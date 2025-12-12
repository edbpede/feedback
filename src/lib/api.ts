import type { ApiResponse, Message, StreamChunk } from "@lib/types";

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

export async function sendMessage(
  messages: Message[],
  onChunk: (chunk: string) => void
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiResponse<never>;
    throw new Error(error.error || "Request failed");
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
          const parsed = JSON.parse(data) as StreamChunk;
          const content = parsed.choices[0]?.delta?.content;
          if (content) onChunk(content);
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }
}

export async function logout(): Promise<void> {
  await fetch("/api/logout", { method: "POST" });
}
