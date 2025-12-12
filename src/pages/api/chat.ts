import type { APIRoute } from "astro";
import { createHmac } from "node:crypto";
import {
  SESSION_SECRET,
  NANO_GPT_API_KEY,
  NANO_GPT_MODEL,
  API_BASE_URL,
} from "astro:env/server";
import { SYSTEM_PROMPT } from "@config/systemPrompt";
import type { ApiResponse, ChatRequest } from "@lib/types";

function verifyToken(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return signature === expectedSignature;
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

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
      ...body.messages,
    ];

    const nanoGptResponse = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NANO_GPT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: NANO_GPT_MODEL,
        messages,
        stream: true,
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

      const response: ApiResponse<never> = {
        success: false,
        error: `API error: ${nanoGptResponse.status}`,
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
  } catch {
    const response: ApiResponse<never> = {
      success: false,
      error: "Internal server error",
    };
    return new Response(JSON.stringify(response), { status: 500 });
  }
};
