import type {
  ApiResponse,
  BalanceResponse,
  ErrorDetails,
  Message,
  StreamChunkWithUsage,
  TokenUsage,
} from "@lib/types";

/** Retry configuration */
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s

/** Delay helper for retry backoff */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function authenticate(
  password: string
): Promise<ApiResponse<unknown>> {
  const response = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return response.json() as Promise<ApiResponse<unknown>>;
}

export interface SendMessageOptions {
  messages: Message[];
  model?: string;
  onChunk: (chunk: string) => void;
  onRetry?: (attempt: number, maxAttempts: number) => void;
  /** Callback when usage data is received (typically in final chunk) */
  onUsage?: (usage: TokenUsage) => void;
}

export async function sendMessage(options: SendMessageOptions): Promise<void> {
  const { messages, model, onChunk, onRetry, onUsage } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, model }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ApiResponse<never>;

        // Log detailed error to browser console
        logError(attempt, errorData.errorDetails, errorData.error);

        // Check if we should retry
        if (errorData.errorDetails?.retryable && attempt < MAX_RETRIES - 1) {
          onRetry?.(attempt + 1, MAX_RETRIES);
          await delay(RETRY_DELAYS[attempt]);
          continue;
        }

        throw new Error(errorData.error || "Request failed");
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
      // Network error - always retryable
      lastError = error instanceof Error ? error : new Error(String(error));

      console.error(
        `[Chat API] Attempt ${attempt + 1}/${MAX_RETRIES} network error:`,
        lastError.message
      );

      if (attempt < MAX_RETRIES - 1) {
        onRetry?.(attempt + 1, MAX_RETRIES);
        await delay(RETRY_DELAYS[attempt]);
      }
    }
  }

  throw lastError || new Error("Request failed after all retries");
}

/** Log detailed error information to browser console */
function logError(
  attempt: number,
  errorDetails?: ErrorDetails,
  fallbackMessage?: string
): void {
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
