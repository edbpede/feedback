import type { APIRoute } from "astro";
import { createHmac, timingSafeEqual } from "node:crypto";
import { SESSION_SECRET, NANO_GPT_API_KEY, NANO_GPT_MODEL, API_BASE_URL } from "astro:env/server";
import { loadSystemPrompt } from "@lib/promptLoader";
import { isValidModel, requiresStrictAlternation } from "@config/models";
import type { ApiResponse, ChatRequest, ErrorDetails, Message } from "@lib/types";

/** Status codes that are considered retryable (temporary failures) */
const RETRYABLE_STATUS_CODES = [500, 502, 503, 504];

interface NanoGptErrorBody {
  error?: {
    message?: string;
    type?: string;
    code?: string | null;
  };
}

/**
 * Formats messages for the API based on model requirements.
 * For models requiring strict user/assistant alternation (e.g., Gemma),
 * the system prompt is merged into the first user message.
 */
function formatMessagesForModel(
  systemPrompt: string,
  messages: Message[],
  strictAlternation: boolean
): Array<{ role: string; content: string }> {
  if (!strictAlternation) {
    // Standard format with system role
    return [{ role: "system", content: systemPrompt }, ...messages];
  }

  // For strict alternation models: merge system prompt into first user message
  const result: Array<{ role: string; content: string }> = [];

  for (const msg of messages) {
    if (result.length === 0 && msg.role === "user") {
      // First user message - prepend system prompt
      result.push({
        role: "user",
        content: `${systemPrompt}\n\n---\n\n${msg.content}`,
      });
    } else if (result.length > 0 && result[result.length - 1].role === msg.role) {
      // Merge consecutive same-role messages
      result[result.length - 1].content += "\n\n" + msg.content;
    } else {
      result.push({ role: msg.role, content: msg.content });
    }
  }

  return result;
}

/** Maximum token age: 7 days in milliseconds */
const MAX_TOKEN_AGE = 7 * 24 * 60 * 60 * 1000;

function verifyToken(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expectedSignature = createHmac("sha256", secret).update(payload).digest("base64url");

  // Use timing-safe comparison to prevent timing attacks
  try {
    const signaturesMatch = timingSafeEqual(
      Buffer.from(signature, "base64url"),
      Buffer.from(expectedSignature, "base64url")
    );
    if (!signaturesMatch) return false;
  } catch {
    return false; // Different lengths
  }

  // Validate payload structure and expiration
  const colonIndex = payload.indexOf(":");
  if (colonIndex === -1) return false;
  const timestamp = parseInt(payload.slice(colonIndex + 1), 10);
  if (isNaN(timestamp)) return false;
  const tokenAge = Date.now() - timestamp;
  return tokenAge >= 0 && tokenAge <= MAX_TOKEN_AGE;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  // Verify session
  const sessionCookie = cookies.get("session")?.value;
  if (!sessionCookie || !verifyToken(sessionCookie, SESSION_SECRET)) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Unauthorized",
    };
    return new Response(JSON.stringify(response), { status: 401 });
  }

  try {
    const body = (await request.json()) as ChatRequest;

    // Validate and select model: use client-provided model if valid, else fall back to env default
    let selectedModel = NANO_GPT_MODEL;
    if (body.model) {
      if (isValidModel(body.model)) {
        selectedModel = body.model;
      } else {
        console.warn(`Invalid model requested: ${body.model}, falling back to ${NANO_GPT_MODEL}`);
      }
    }

    // Load subject-specific or fallback system prompt
    const systemPrompt = loadSystemPrompt(body.subject);

    const messages = formatMessagesForModel(
      systemPrompt,
      body.messages,
      requiresStrictAlternation(selectedModel)
    );

    const nanoGptResponse = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NANO_GPT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        stream: true,
        stream_options: { include_usage: true },
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!nanoGptResponse.ok) {
      const errorBody = await nanoGptResponse.text();
      console.error("NanoGPT API error:", {
        status: nanoGptResponse.status,
        body: errorBody,
      });

      // Parse error body to extract details
      let parsedError: NanoGptErrorBody = {};
      try {
        parsedError = JSON.parse(errorBody) as NanoGptErrorBody;
      } catch {
        // Body wasn't JSON, use raw text as message
      }

      const errorDetails: ErrorDetails = {
        status: nanoGptResponse.status,
        message: parsedError.error?.message || errorBody || "Unknown error",
        type: parsedError.error?.type,
        code: parsedError.error?.code,
        retryable: RETRYABLE_STATUS_CODES.includes(nanoGptResponse.status),
      };

      const response: ApiResponse<never> = {
        success: false,
        error: `API error: ${nanoGptResponse.status}`,
        errorDetails,
      };
      return new Response(JSON.stringify(response), {
        status: nanoGptResponse.status,
      });
    }

    // Stream response back to client
    return new Response(nanoGptResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API internal error:", error);

    const errorDetails: ErrorDetails = {
      status: 500,
      message: error instanceof Error ? error.message : "Unknown internal error",
      type: "InternalError",
      retryable: true,
    };

    const response: ApiResponse<never> = {
      success: false,
      error: "Internal server error",
      errorDetails,
    };
    return new Response(JSON.stringify(response), { status: 500 });
  }
};
