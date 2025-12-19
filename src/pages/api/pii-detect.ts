import type { APIRoute } from "astro";
import { createHmac, timingSafeEqual } from "node:crypto";
import { SESSION_SECRET, NANO_GPT_API_KEY, API_BASE_URL } from "astro:env/server";
import { PII_DETECTION_MODEL, PII_DETECTION_FALLBACK_MODELS } from "@config/models";
import {
  PII_DETECTION_SYSTEM_PROMPT,
  generatePIIDetectionPrompt,
} from "@config/prompts/anonymization";
import type {
  ApiResponse,
  PIIDetectionRequest,
  PIIDetectionResult,
  PIIFinding,
  PIICategory,
  PIIConfidence,
  ErrorDetails,
} from "@lib/types";

/** Status codes that are considered retryable (temporary failures) */
const RETRYABLE_STATUS_CODES = [500, 502, 503, 504];

interface NanoGptResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface NanoGptErrorBody {
  error?: {
    message?: string;
    type?: string;
    code?: string | null;
  };
}

interface RawPIIFinding {
  original: string;
  replacement: string;
  category: string;
  confidence: string;
  reasoning: string;
}

interface RawPIIResponse {
  findings: RawPIIFinding[];
  context_notes?: string;
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

/**
 * Parse the raw JSON response from the model into typed PIIFindings.
 */
function parseFindings(rawResponse: RawPIIResponse): {
  findings: PIIFinding[];
  contextNotes: string;
} {
  const validCategories: PIICategory[] = ["name", "place", "institution", "contact", "other"];
  const validConfidences: PIIConfidence[] = ["high", "medium", "low"];

  const findings: PIIFinding[] = rawResponse.findings.map((raw, index) => ({
    id: `pii-${Date.now()}-${index}`,
    original: raw.original || "",
    replacement: raw.replacement || "[ANONYMISERET]",
    category: validCategories.includes(raw.category as PIICategory)
      ? (raw.category as PIICategory)
      : "other",
    confidence: validConfidences.includes(raw.confidence as PIIConfidence)
      ? (raw.confidence as PIIConfidence)
      : "medium",
    reasoning: raw.reasoning || "",
    kept: false,
  }));

  return {
    findings,
    contextNotes: rawResponse.context_notes || "",
  };
}

/**
 * Apply anonymizations to the original text.
 */
function applyAnonymizations(text: string, findings: PIIFinding[]): string {
  let result = text;

  // Sort findings by length (longest first to avoid substring replacement issues)
  const sortedFindings = [...findings]
    .filter((f) => !f.kept)
    .sort((a, b) => b.original.length - a.original.length);

  for (const finding of sortedFindings) {
    // Use global replace to handle multiple occurrences
    result = result.split(finding.original).join(finding.replacement);
  }

  return result;
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
    const body = (await request.json()) as PIIDetectionRequest;

    // Validate model if provided, default to primary
    const requestedModel = body.model || PII_DETECTION_MODEL;
    const isValidPIIModel = PII_DETECTION_FALLBACK_MODELS.includes(
      requestedModel as (typeof PII_DETECTION_FALLBACK_MODELS)[number]
    );
    if (!isValidPIIModel) {
      const response: ApiResponse<never> = {
        success: false,
        error: `Invalid PII detection model: ${requestedModel}`,
        errorDetails: {
          status: 400,
          message: `Model must be one of: ${PII_DETECTION_FALLBACK_MODELS.join(", ")}`,
          retryable: false,
        },
      };
      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!body.text || body.text.trim().length === 0) {
      const response: ApiResponse<PIIDetectionResult> = {
        success: true,
        data: {
          findings: [],
          contextNotes: "Ingen tekst at analysere",
          anonymizedText: "",
          isClean: true,
        },
      };
      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const userPrompt = generatePIIDetectionPrompt(body.text, body.context);

    // Call NanoGPT with the TEE model for PII detection (non-streaming)
    const nanoGptResponse = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NANO_GPT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: requestedModel,
        messages: [
          { role: "system", content: PII_DETECTION_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        stream: false,
        temperature: 0.1, // Low temperature for consistent detection
        max_tokens: 4000,
      }),
    });

    if (!nanoGptResponse.ok) {
      const errorBody = await nanoGptResponse.text();
      console.error("NanoGPT API error (PII detection):", {
        status: nanoGptResponse.status,
        body: errorBody,
      });

      let parsedError: NanoGptErrorBody = {};
      try {
        parsedError = JSON.parse(errorBody) as NanoGptErrorBody;
      } catch {
        // Body wasn't JSON
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
        error: `PII detection failed: ${nanoGptResponse.status}`,
        errorDetails,
      };
      return new Response(JSON.stringify(response), {
        status: nanoGptResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const nanoGptResult = (await nanoGptResponse.json()) as NanoGptResponse;
    const content = nanoGptResult.choices?.[0]?.message?.content;

    if (!content) {
      const response: ApiResponse<never> = {
        success: false,
        error: "No content in PII detection response",
        errorDetails: {
          status: 500,
          message: "Empty response from PII detection model",
          retryable: true,
        },
      };
      return new Response(JSON.stringify(response), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse the JSON response from the model
    let rawResponse: RawPIIResponse;
    try {
      // Extract JSON from the response (model may include markdown code blocks)
      let jsonContent = content.trim();
      if (jsonContent.startsWith("```json")) {
        jsonContent = jsonContent.slice(7);
      }
      if (jsonContent.startsWith("```")) {
        jsonContent = jsonContent.slice(3);
      }
      if (jsonContent.endsWith("```")) {
        jsonContent = jsonContent.slice(0, -3);
      }
      jsonContent = jsonContent.trim();

      rawResponse = JSON.parse(jsonContent) as RawPIIResponse;
    } catch (parseError) {
      console.error("Failed to parse PII detection response:", content);
      const response: ApiResponse<never> = {
        success: false,
        error: "Failed to parse PII detection response",
        errorDetails: {
          status: 500,
          message: "Invalid JSON in PII detection response",
          retryable: true,
        },
      };
      return new Response(JSON.stringify(response), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { findings, contextNotes } = parseFindings(rawResponse);
    const anonymizedText = applyAnonymizations(body.text, findings);

    const result: PIIDetectionResult = {
      findings,
      contextNotes,
      anonymizedText,
      isClean: findings.length === 0,
      modelUsed: requestedModel,
    };

    const response: ApiResponse<PIIDetectionResult> = {
      success: true,
      data: result,
    };

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PII detection API internal error:", error);

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
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
