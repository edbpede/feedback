/** Detailed error information for debugging */
export interface ErrorDetails {
  status: number;
  message: string;
  type?: string;
  code?: string | null;
  retryable: boolean;
}

export type ApiResponse<T> =
  | { success: true; data: T; error?: never; errorDetails?: never }
  | { success: false; data?: never; error: string; errorDetails?: ErrorDetails };

export interface Message {
  role: "user" | "assistant";
  content: string;
  /** Model ID that generated this message (assistant messages only) */
  modelId?: string;
}

export interface AuthRequest {
  password: string;
}

export interface ChatRequest {
  messages: Message[];
  /** Optional model ID to use for this request */
  model?: string;
  /** Optional subject for subject-specific system prompts */
  subject?: string;
}

export interface StreamChunk {
  choices: Array<{
    delta: {
      content?: string;
    };
  }>;
}

/** Token usage information from API response */
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/** Extended StreamChunk with usage data (typically in final chunk) */
export interface StreamChunkWithUsage extends StreamChunk {
  usage?: TokenUsage;
}

/** Account balance response from NanoGPT */
export interface BalanceResponse {
  /** Balance in USD */
  balance: number;
}

/** File attached during onboarding */
export interface AttachedFile {
  name: string;
  content: string;
}

/** Context collected from the onboarding flow */
export interface OnboardingContext {
  subject: string;
  grade: string;
  assignmentDescription: string;
  studentWork: string;
  studentWorkFile: AttachedFile | null;
  wantsGrade: boolean;
  /** Selected AI model ID */
  model: string;
}

/** Persisted onboarding state */
export interface OnboardingState {
  completed: boolean;
  context: OnboardingContext | null;
}
