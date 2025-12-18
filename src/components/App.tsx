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
  clearMessageCosts,
  saveModelPath,
  clearGDPRState,
  saveAnonymizationState,
} from "@lib/storage";
import type { OnboardingContext, OnboardingState, ModelPathState } from "@lib/types";

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
      const response = await fetch("/api/verify-session");
      if (response.ok) {
        const result = (await response.json()) as { success: boolean; data?: { valid: boolean } };
        setIsAuthenticated(result.success && result.data?.valid === true);
      } else {
        setIsAuthenticated(false);
      }
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

  const handleChangeModelPath = () => {
    // Reset all state when changing model path
    clearGDPRState();
    clearOnboardingState();
    clearMessages();
    clearMessageCosts();
    setOnboardingState({ completed: false, context: null });
    setIsEditing(false);
  };

  const handleOnboardingComplete = (context: OnboardingContext) => {
    const wasEditing = isEditing();

    // Save anonymization state if present (PII review now happens during onboarding)
    if (context.anonymizationState) {
      saveAnonymizationState(context.anonymizationState);
    }

    // Finalize onboarding
    const newState: OnboardingState = { completed: true, context };
    setOnboardingState(newState);
    saveOnboardingState(newState);

    // Save model path separately for quick access
    const modelPathState: ModelPathState = { selected: true, path: context.modelPath };
    saveModelPath(modelPathState);

    // Clear messages when completing an edit so new conversation starts fresh
    if (wasEditing) {
      clearMessages();
      clearMessageCosts();
    }

    setIsEditing(false);
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
          {/* Onboarding or Chat */}
          <Show
            when={onboardingState().completed && !isEditing()}
            fallback={
              <OnboardingFlow
                onComplete={handleOnboardingComplete}
                onSkip={isEditing() ? handleCancelEdit : handleOnboardingSkip}
                initialContext={onboardingState().context}
                isEditing={isEditing()}
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
                onChangeModelPath={handleChangeModelPath}
                modelPath={onboardingState().context?.modelPath ?? null}
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
