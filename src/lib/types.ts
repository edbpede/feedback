export type ApiResponse<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string };

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface AuthRequest {
  password: string;
}

export interface ChatRequest {
  messages: Message[];
}

export interface StreamChunk {
  choices: Array<{
    delta: {
      content?: string;
    };
  }>;
}
