import { createSignal, onMount, Show, lazy, Suspense, type Component } from "solid-js";
import { PasswordGate } from "@components/PasswordGate";
import { OnboardingFlow } from "@components/onboarding";

// Lazy load ChatWindow - user must complete onboarding first
const ChatWindow = lazy(() =>
  import("@components/ChatWindow").then((m) => ({ default: m.ChatWindow }))
);
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
  const [pendingAutoSubmit, setPendingAutoSubmit] = createSignal(false);

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
    // Trigger auto-submit for new onboarding completions (not edits)
    setPendingAutoSubmit(true);
  };

  const handleAutoSubmitComplete = () => {
    setPendingAutoSubmit(false);
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

  const handleModelChange = (modelId: string) => {
    const currentState = onboardingState();
    if (currentState.context) {
      const newContext = { ...currentState.context, model: modelId };
      const newState: OnboardingState = { completed: true, context: newContext };
      setOnboardingState(newState);
      saveOnboardingState(newState);
    }
  };

  return (
    <div class="bg-background text-foreground min-h-screen transition-colors duration-200">
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
            <Suspense fallback={<LoadingSpinner />}>
              <ChatWindow
                onLogout={handleLogout}
                onboardingContext={onboardingState().context}
                onClearOnboarding={handleClearOnboarding}
                onEditContext={handleEditContext}
                autoSubmit={pendingAutoSubmit()}
                onAutoSubmitComplete={handleAutoSubmitComplete}
                onModelChange={handleModelChange}
              />
            </Suspense>
          </Show>
        </Show>
      </Show>
    </div>
  );
};

const LoadingSpinner: Component = () => (
  <div class="flex min-h-screen items-center justify-center">
    <div class="i-carbon-loading text-primary animate-spin text-4xl" />
  </div>
);
