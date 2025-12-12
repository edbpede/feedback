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
}

/** Persisted onboarding state */
export interface OnboardingState {
  completed: boolean;
  context: OnboardingContext | null;
}
