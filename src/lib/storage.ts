import type { Message, OnboardingState } from "@lib/types";

const STORAGE_KEY = "feedback-bot-messages";
const ONBOARDING_KEY = "feedback-bot-onboarding";

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
