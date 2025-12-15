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

// ============================================================================
// GDPR Anonymization Feature Types
// ============================================================================

/** Model path selection for privacy vs quality trade-off */
export type ModelPath = "privacy-first" | "enhanced-quality";

/** Persisted model path state */
export interface ModelPathState {
  selected: boolean;
  path: ModelPath | null;
}

/** PII category types for classification */
export type PIICategory = "name" | "place" | "institution" | "contact" | "other";

/** Confidence level for PII detection */
export type PIIConfidence = "high" | "medium" | "low";

/** A single detected PII item */
export interface PIIFinding {
  /** Unique identifier for UI tracking */
  id: string;
  /** The detected PII text */
  original: string;
  /** Proposed anonymized replacement */
  replacement: string;
  /** Category of PII */
  category: PIICategory;
  /** Detection confidence level */
  confidence: PIIConfidence;
  /** Explanation for why this was flagged */
  reasoning: string;
  /** User chose to keep this item (not anonymize) */
  kept: boolean;
}

/** PII detection result from the API */
export interface PIIDetectionResult {
  /** List of detected PII items */
  findings: PIIFinding[];
  /** Notes about the text context (e.g., fiction vs personal) */
  contextNotes: string;
  /** Text with all proposed replacements applied */
  anonymizedText: string;
  /** True if no PII was found */
  isClean: boolean;
}

/** Persisted anonymization state */
export interface AnonymizationState {
  /** Original text before anonymization */
  originalText: string;
  /** Text after anonymization applied */
  anonymizedText: string;
  /** PII items that were anonymized */
  appliedReplacements: PIIFinding[];
  /** PII items the user chose to keep */
  skippedItems: PIIFinding[];
}

/** PII detection API request */
export interface PIIDetectionRequest {
  /** Text to analyze for PII */
  text: string;
  /** Optional user context for false positive handling */
  context?: string;
}

/** User's reason for declining PII anonymization */
export type PIIDeclineReason =
  | "already_removed"  // "I've already removed personal info"
  | "false_positive"   // "Something was flagged incorrectly"
  | "selective_keep";  // "Keep specific items"
