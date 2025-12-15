import type {
  ApiResponse,
  BalanceResponse,
  ErrorDetails,
  Message,
  StreamChunkWithUsage,
  TokenUsage,
  PIIDetectionResult,
  PIIDetectionRequest,
} from "@lib/types";
import { ApiError } from "@lib/errorUtils";

/** Retry configuration - progressive strategy */
const MAX_RETRIES = 10;
const RETRY_DELAYS = [
  1000,
  1500,
  2000,
  2000,
  2000, // Phase 1 (attempts 1-5): quick retries
  4000,
  8000,
  16000,
  32000,
  60000, // Phase 2 (attempts 6-10): exponential backoff
];

/** Delay helper for retry backoff */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function authenticate(password: string): Promise<ApiResponse<unknown>> {
  const response = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return response.json() as Promise<ApiResponse<unknown>>;
}

/** Retry phase indicator */
export type RetryPhase = "quick" | "backoff";

export interface SendMessageOptions {
  messages: Message[];
  model?: string;
  /** Subject for subject-specific system prompts */
  subject?: string;
  onChunk: (chunk: string) => void;
  /** Callback with attempt number, max attempts, phase, and delay until next retry */
  onRetry?: (attempt: number, maxAttempts: number, phase: RetryPhase, delayMs: number) => void;
  /** Callback when usage data is received (typically in final chunk) */
  onUsage?: (usage: TokenUsage) => void;
}

export async function sendMessage(options: SendMessageOptions): Promise<void> {
  const { messages, model, subject, onChunk, onRetry, onUsage } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, model, subject }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ApiResponse<never>;

        // Log detailed error to browser console
        logError(attempt, errorData.errorDetails, errorData.error);

        // Check if we should retry
        if (errorData.errorDetails?.retryable && attempt < MAX_RETRIES - 1) {
          const phase: RetryPhase = attempt < 5 ? "quick" : "backoff";
          onRetry?.(attempt + 1, MAX_RETRIES, phase, RETRY_DELAYS[attempt]);
          await delay(RETRY_DELAYS[attempt]);
          continue;
        }

        const status = errorData.errorDetails?.status ?? response.status;
        throw new ApiError(
          status,
          errorData.error || "Request failed",
          errorData.errorDetails?.retryable ?? false
        );
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") return;

            try {
              const parsed = JSON.parse(data) as StreamChunkWithUsage;
              const content = parsed.choices[0]?.delta?.content;
              if (content) onChunk(content);
              // Capture usage data if present (typically in final chunk)
              if (parsed.usage && onUsage) {
                onUsage(parsed.usage);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      return; // Success - exit retry loop
    } catch (error) {
      // Re-throw ApiError as-is (already processed)
      if (error instanceof ApiError) {
        lastError = error;
      } else {
        // Network error - status 0 indicates network failure
        lastError = new ApiError(0, "Network error", true);
      }

      console.error(`[Chat API] Attempt ${attempt + 1}/${MAX_RETRIES} error:`, lastError.message);

      if (attempt < MAX_RETRIES - 1 && lastError.retryable) {
        const phase: RetryPhase = attempt < 5 ? "quick" : "backoff";
        onRetry?.(attempt + 1, MAX_RETRIES, phase, RETRY_DELAYS[attempt]);
        await delay(RETRY_DELAYS[attempt]);
      }
    }
  }

  // Always throw with retryable: false when retry loop is exhausted
  // This ensures ChatWindow sets retriesExhausted = true, showing fallback model selector
  if (lastError) {
    const apiError = lastError as ApiError;
    throw new ApiError(apiError.status, apiError.message, false);
  }
  throw new ApiError(0, "Connection failed after 10 attempts", false);
}

/** Log detailed error information to browser console */
function logError(attempt: number, errorDetails?: ErrorDetails, fallbackMessage?: string): void {
  const errorInfo = {
    attempt: `${attempt + 1}/${MAX_RETRIES}`,
    status: errorDetails?.status,
    message: errorDetails?.message || fallbackMessage,
    type: errorDetails?.type,
    code: errorDetails?.code,
    retryable: errorDetails?.retryable,
  };

  console.error(`[Chat API] Request failed:`, errorInfo);
}

export async function logout(): Promise<void> {
  await fetch("/api/logout", { method: "POST" });
}

/**
 * Fetch account balance from NanoGPT.
 * Returns null on error (graceful degradation).
 */
export async function fetchBalance(): Promise<BalanceResponse | null> {
  try {
    const response = await fetch("/api/balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      console.error("[Balance API] Failed:", response.status);
      return null;
    }

    const data = (await response.json()) as ApiResponse<BalanceResponse>;
    return data.success ? data.data : null;
  } catch (error) {
    console.error("[Balance API] Error:", error);
    return null;
  }
}

/**
 * Detect PII (Personally Identifiable Information) in text.
 * Uses a TEE model to analyze Danish student text for personal information.
 *
 * @param text - The text to analyze
 * @param context - Optional user-provided context about the text
 * @returns PIIDetectionResult with findings and anonymized text
 * @throws ApiError on failure
 */
export async function detectPII(text: string, context?: string): Promise<PIIDetectionResult> {
  const requestBody: PIIDetectionRequest = { text, context };

  const response = await fetch("/api/pii-detect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const data = (await response.json()) as ApiResponse<PIIDetectionResult>;

  if (!response.ok || !data.success) {
    const errorDetails = data.errorDetails;
    console.error("[PII Detection API] Failed:", {
      status: errorDetails?.status ?? response.status,
      message: errorDetails?.message ?? data.error,
      type: errorDetails?.type,
      code: errorDetails?.code,
    });

    throw new ApiError(
      errorDetails?.status ?? response.status,
      data.error || "PII detection failed",
      errorDetails?.retryable ?? false
    );
  }

  return data.data;
}
