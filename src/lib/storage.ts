import type { Message, OnboardingState, ModelPathState, AnonymizationState } from "@lib/types";

const STORAGE_KEY = "feedback-bot-messages";
const ONBOARDING_KEY = "feedback-bot-onboarding";
const COSTS_KEY = "feedback-bot-costs";
const MODEL_PATH_KEY = "feedback-bot-model-path";
const ANONYMIZATION_KEY = "feedback-bot-anonymization";

export function saveMessages(messages: Message[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    console.warn("Failed to save messages to localStorage");
  }
}

export function loadMessages(): Message[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Message[];
  } catch {
    return [];
  }
}

export function clearMessages(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.warn("Failed to clear messages from localStorage");
  }
}

export function saveMessageCosts(costs: Map<number, number>): void {
  try {
    const arr = Array.from(costs.entries());
    localStorage.setItem(COSTS_KEY, JSON.stringify(arr));
  } catch {
    console.warn("Failed to save message costs to localStorage");
  }
}

export function loadMessageCosts(): Map<number, number> {
  try {
    const stored = localStorage.getItem(COSTS_KEY);
    if (!stored) return new Map();
    const arr = JSON.parse(stored) as [number, number][];
    return new Map(arr);
  } catch {
    return new Map();
  }
}

export function clearMessageCosts(): void {
  try {
    localStorage.removeItem(COSTS_KEY);
  } catch {
    console.warn("Failed to clear message costs from localStorage");
  }
}

const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  completed: false,
  context: null,
};

export function saveOnboardingState(state: OnboardingState): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  } catch {
    console.warn("Failed to save onboarding state to localStorage");
  }
}

export function loadOnboardingState(): OnboardingState {
  try {
    const stored = localStorage.getItem(ONBOARDING_KEY);
    if (!stored) return DEFAULT_ONBOARDING_STATE;
    return JSON.parse(stored) as OnboardingState;
  } catch {
    return DEFAULT_ONBOARDING_STATE;
  }
}

export function clearOnboardingState(): void {
  try {
    localStorage.removeItem(ONBOARDING_KEY);
  } catch {
    console.warn("Failed to clear onboarding state from localStorage");
  }
}

// ============================================================================
// Model Path Storage (GDPR Anonymization Feature)
// ============================================================================

const DEFAULT_MODEL_PATH_STATE: ModelPathState = {
  selected: false,
  path: null,
};

export function saveModelPath(state: ModelPathState): void {
  try {
    localStorage.setItem(MODEL_PATH_KEY, JSON.stringify(state));
  } catch {
    console.warn("Failed to save model path to localStorage");
  }
}

export function loadModelPath(): ModelPathState {
  try {
    const stored = localStorage.getItem(MODEL_PATH_KEY);
    if (!stored) return DEFAULT_MODEL_PATH_STATE;
    return JSON.parse(stored) as ModelPathState;
  } catch {
    return DEFAULT_MODEL_PATH_STATE;
  }
}

export function clearModelPath(): void {
  try {
    localStorage.removeItem(MODEL_PATH_KEY);
  } catch {
    console.warn("Failed to clear model path from localStorage");
  }
}

// ============================================================================
// Anonymization State Storage (GDPR Anonymization Feature)
// ============================================================================

export function saveAnonymizationState(state: AnonymizationState): void {
  try {
    localStorage.setItem(ANONYMIZATION_KEY, JSON.stringify(state));
  } catch {
    console.warn("Failed to save anonymization state to localStorage");
  }
}

export function loadAnonymizationState(): AnonymizationState | null {
  try {
    const stored = localStorage.getItem(ANONYMIZATION_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as AnonymizationState;
  } catch {
    return null;
  }
}

export function clearAnonymizationState(): void {
  try {
    localStorage.removeItem(ANONYMIZATION_KEY);
  } catch {
    console.warn("Failed to clear anonymization state from localStorage");
  }
}

/**
 * Clear all GDPR-related state (model path + anonymization).
 * Useful when user wants to reset their model path choice.
 */
export function clearGDPRState(): void {
  clearModelPath();
  clearAnonymizationState();
}
