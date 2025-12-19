/**
 * @fileoverview LocalStorage persistence utilities for the feedback bot.
 * Handles saving and loading of messages, onboarding state, costs, model path,
 * and anonymization state. All functions are safe to call in SSR context
 * (they silently fail if localStorage is unavailable).
 */

import type { Message, OnboardingState, ModelPathState, AnonymizationState } from "@lib/types";

/** LocalStorage key for chat messages */
const STORAGE_KEY = "feedback-bot-messages";
/** LocalStorage key for onboarding state */
const ONBOARDING_KEY = "feedback-bot-onboarding";
/** LocalStorage key for per-message token costs */
const COSTS_KEY = "feedback-bot-costs";
/** LocalStorage key for selected model path (privacy-first or enhanced-quality) */
const MODEL_PATH_KEY = "feedback-bot-model-path";
/** LocalStorage key for PII anonymization state */
const ANONYMIZATION_KEY = "feedback-bot-anonymization";

/** Saves chat messages to localStorage */
export function saveMessages(messages: Message[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    console.warn("Failed to save messages to localStorage");
  }
}

/** Loads chat messages from localStorage */
export function loadMessages(): Message[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Message[];
  } catch {
    return [];
  }
}

/** Clears all chat messages from localStorage */
export function clearMessages(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.warn("Failed to clear messages from localStorage");
  }
}

/** Saves per-message token costs to localStorage (message index → cost in DKK) */
export function saveMessageCosts(costs: Map<number, number>): void {
  try {
    const arr = Array.from(costs.entries());
    localStorage.setItem(COSTS_KEY, JSON.stringify(arr));
  } catch {
    console.warn("Failed to save message costs to localStorage");
  }
}

/** Loads per-message token costs from localStorage */
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

/** Clears all message costs from localStorage */
export function clearMessageCosts(): void {
  try {
    localStorage.removeItem(COSTS_KEY);
  } catch {
    console.warn("Failed to clear message costs from localStorage");
  }
}

/** Default onboarding state for new users */
const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  completed: false,
  context: null,
};

/** Saves onboarding completion state and context to localStorage */
export function saveOnboardingState(state: OnboardingState): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
  } catch {
    console.warn("Failed to save onboarding state to localStorage");
  }
}

/** Loads onboarding state from localStorage, returns default if not found */
export function loadOnboardingState(): OnboardingState {
  try {
    const stored = localStorage.getItem(ONBOARDING_KEY);
    if (!stored) return DEFAULT_ONBOARDING_STATE;
    return JSON.parse(stored) as OnboardingState;
  } catch {
    return DEFAULT_ONBOARDING_STATE;
  }
}

/** Clears onboarding state from localStorage */
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

/** Default model path state (no path selected) */
const DEFAULT_MODEL_PATH_STATE: ModelPathState = {
  selected: false,
  path: null,
};

/** Saves selected model path (privacy-first or enhanced-quality) to localStorage */
export function saveModelPath(state: ModelPathState): void {
  try {
    localStorage.setItem(MODEL_PATH_KEY, JSON.stringify(state));
  } catch {
    console.warn("Failed to save model path to localStorage");
  }
}

/** Loads model path state from localStorage, returns default if not found */
export function loadModelPath(): ModelPathState {
  try {
    const stored = localStorage.getItem(MODEL_PATH_KEY);
    if (!stored) return DEFAULT_MODEL_PATH_STATE;
    return JSON.parse(stored) as ModelPathState;
  } catch {
    return DEFAULT_MODEL_PATH_STATE;
  }
}

/** Clears model path selection from localStorage */
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

/** Saves PII anonymization state (findings, decisions, anonymized text) to localStorage */
export function saveAnonymizationState(state: AnonymizationState): void {
  try {
    localStorage.setItem(ANONYMIZATION_KEY, JSON.stringify(state));
  } catch {
    console.warn("Failed to save anonymization state to localStorage");
  }
}

/** Loads PII anonymization state from localStorage, returns null if not found */
export function loadAnonymizationState(): AnonymizationState | null {
  try {
    const stored = localStorage.getItem(ANONYMIZATION_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as AnonymizationState;
  } catch {
    return null;
  }
}

/** Clears PII anonymization state from localStorage */
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
