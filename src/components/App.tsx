import { createSignal, onMount, Show, lazy, Suspense, type Component } from "solid-js";
import { PasswordGate } from "@components/PasswordGate";
import { OnboardingFlow } from "@components/onboarding";
import { ModelPathStep } from "@components/ModelPathStep";
import { PIIReviewFlow } from "@components/pii";

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
  loadModelPath,
  saveModelPath,
  clearGDPRState,
  saveAnonymizationState,
} from "@lib/storage";
import { requiresPIIAnonymization } from "@config/models";
import type {
  OnboardingContext,
  OnboardingState,
  ModelPathState,
  ModelPath,
  AnonymizationState,
} from "@lib/types";

export const App: Component = () => {
  const [isAuthenticated, setIsAuthenticated] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);
  const [modelPathState, setModelPathState] = createSignal<ModelPathState>({
    selected: false,
    path: null,
  });
  const [onboardingState, setOnboardingState] = createSignal<OnboardingState>({
    completed: false,
    context: null,
  });
  const [isEditing, setIsEditing] = createSignal(false);
  const [pendingAutoSubmit, setPendingAutoSubmit] = createSignal(false);

  // PII Review state
  const [showPIIReview, setShowPIIReview] = createSignal(false);
  const [pendingContext, setPendingContext] = createSignal<OnboardingContext | null>(null);
  const [textForPIIReview, setTextForPIIReview] = createSignal("");

  onMount(async () => {
    // Initialize locale and theme from localStorage
    initLocale();
    initTheme();

    // Load model path and onboarding state from localStorage
    setModelPathState(loadModelPath());
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

  const handleModelPathSelect = (path: ModelPath) => {
    const newState: ModelPathState = { selected: true, path };
    setModelPathState(newState);
    saveModelPath(newState);
  };

  const handleChangeModelPath = () => {
    // Reset all state when changing model path
    clearGDPRState();
    clearOnboardingState();
    clearMessages();
    clearMessageCosts();
    setModelPathState({ selected: false, path: null });
    setOnboardingState({ completed: false, context: null });
    setIsEditing(false);
  };

  const handleOnboardingComplete = (context: OnboardingContext) => {
    const wasEditing = isEditing();

    // Check if model requires PII anonymization
    if (requiresPIIAnonymization(context.model)) {
      const studentWorkText = context.studentWork?.trim() || "";
      const fileContent = context.studentWorkFile?.content?.trim() || "";
      const hasStudentWork = studentWorkText || fileContent;

      if (hasStudentWork) {
        // Combine text for PII review
        const textToReview = [studentWorkText, fileContent].filter(Boolean).join("\n\n");
        setTextForPIIReview(textToReview);
        setPendingContext(context);
        setShowPIIReview(true);
        setIsEditing(false);
        return;
      }
    }

    // No PII review needed - proceed directly
    finalizeOnboarding(context, wasEditing);
  };

  const finalizeOnboarding = (context: OnboardingContext, wasEditing: boolean) => {
    const newState: OnboardingState = { completed: true, context };
    setOnboardingState(newState);
    saveOnboardingState(newState);

    // Clear messages when completing an edit so new conversation starts fresh
    if (wasEditing) {
      clearMessages();
      clearMessageCosts();
    }

    setIsEditing(false);
    setPendingAutoSubmit(true);
  };

  const handlePIIReviewComplete = (anonymizationState: AnonymizationState) => {
    const context = pendingContext();
    if (!context) return;

    // Save anonymization state for reference
    saveAnonymizationState(anonymizationState);

    // Update context with anonymized text
    const updatedContext: OnboardingContext = {
      ...context,
      studentWork: anonymizationState.anonymizedText,
      // Clear file content if it was anonymized
      studentWorkFile: context.studentWorkFile
        ? { ...context.studentWorkFile, content: "" }
        : null,
    };

    // Clear PII review state
    setShowPIIReview(false);
    setPendingContext(null);
    setTextForPIIReview("");

    // Finalize onboarding with anonymized context
    finalizeOnboarding(updatedContext, false);
  };

  const handlePIIReviewBack = () => {
    // Go back to onboarding
    setShowPIIReview(false);
    setPendingContext(null);
    setTextForPIIReview("");
    setIsEditing(true); // Return to editing mode
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
          {/* Model Path Selection Step */}
          <Show
            when={modelPathState().selected}
            fallback={
              <div class="flex min-h-screen items-center justify-center p-4">
                <ModelPathStep onContinue={handleModelPathSelect} />
              </div>
            }
          >
            {/* PII Review Flow (for commercial models) */}
            <Show
              when={showPIIReview()}
              fallback={
                /* Onboarding or Chat */
                <Show
                  when={onboardingState().completed && !isEditing()}
                  fallback={
                    <OnboardingFlow
                      onComplete={handleOnboardingComplete}
                      onSkip={isEditing() ? handleCancelEdit : handleOnboardingSkip}
                      initialContext={onboardingState().context}
                      isEditing={isEditing()}
                      modelPath={modelPathState().path}
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
                      modelPath={modelPathState().path}
                    />
                  </Suspense>
                </Show>
              }
            >
              <div class="flex min-h-screen items-center justify-center p-4">
                <PIIReviewFlow
                  text={textForPIIReview()}
                  onComplete={handlePIIReviewComplete}
                  onBack={handlePIIReviewBack}
                />
              </div>
            </Show>
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
