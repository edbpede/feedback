import { createSignal, onMount, Show, type Component } from "solid-js";
import { PasswordGate } from "@components/PasswordGate";
import { ChatWindow } from "@components/ChatWindow";
import { OnboardingFlow } from "@components/onboarding";
import { initLocale } from "@lib/i18n";
import { initTheme } from "@lib/theme";
import {
  loadOnboardingState,
  saveOnboardingState,
  clearOnboardingState,
  clearMessages,
} from "@lib/storage";
import type { OnboardingContext, OnboardingState } from "@lib/types";

export const App: Component = () => {
  const [isAuthenticated, setIsAuthenticated] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);
  const [onboardingState, setOnboardingState] = createSignal<OnboardingState>({
    completed: false,
    context: null,
  });
  const [isEditing, setIsEditing] = createSignal(false);

  onMount(async () => {
    // Initialize locale and theme from localStorage
    initLocale();
    initTheme();

    // Load onboarding state from localStorage
    setOnboardingState(loadOnboardingState());

    // Check if session cookie exists by making a lightweight request
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      });
      setIsAuthenticated(response.ok);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  });

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setIsAuthenticated(false);
  };

  const handleOnboardingComplete = (context: OnboardingContext) => {
    const newState: OnboardingState = { completed: true, context };
    setOnboardingState(newState);
    saveOnboardingState(newState);
    setIsEditing(false);
  };

  const handleOnboardingSkip = () => {
    const newState: OnboardingState = { completed: true, context: null };
    setOnboardingState(newState);
    saveOnboardingState(newState);
  };

  const handleClearOnboarding = () => {
    clearOnboardingState();
    clearMessages();
    setOnboardingState({ completed: false, context: null });
  };

  const handleEditContext = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Show when={!isLoading()} fallback={<LoadingSpinner />}>
        <Show
          when={isAuthenticated()}
          fallback={<PasswordGate onSuccess={() => setIsAuthenticated(true)} />}
        >
          <Show
            when={onboardingState().completed && !isEditing()}
            fallback={
              <OnboardingFlow
                onComplete={handleOnboardingComplete}
                onSkip={isEditing() ? handleCancelEdit : handleOnboardingSkip}
                initialContext={onboardingState().context}
              />
            }
          >
            <ChatWindow
              onLogout={handleLogout}
              onboardingContext={onboardingState().context}
              onClearOnboarding={handleClearOnboarding}
              onEditContext={handleEditContext}
            />
          </Show>
        </Show>
      </Show>
    </div>
  );
};

const LoadingSpinner: Component = () => (
  <div class="flex items-center justify-center min-h-screen">
    <div class="i-carbon-loading animate-spin text-4xl text-blue-600" />
  </div>
);
