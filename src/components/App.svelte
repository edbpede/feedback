<script lang="ts">
import PasswordGate from "@components/PasswordGate.svelte";
import { OnboardingFlow } from "@components/onboarding";
import { initLocale } from "@lib/i18n";
import {
  clearMessageCosts,
  clearMessages,
  clearOnboardingState,
  loadOnboardingState,
  saveAnonymizationState,
  saveModelPath,
  saveOnboardingState,
} from "@lib/storage";
import { initTheme } from "@lib/theme";
import type { ModelPathState, OnboardingContext, OnboardingState } from "@lib/types";
import { onMount } from "svelte";

let isAuthenticated = $state(false);
let isLoading = $state(true);
let onboardingState = $state<OnboardingState>({
  completed: false,
  context: null,
});
let isEditing = $state(false);
let pendingAutoSubmit = $state(false);

onMount(async () => {
  // Initialize locale and theme from localStorage
  initLocale();
  initTheme();

  // Load onboarding state from localStorage
  onboardingState = loadOnboardingState();

  // Check if session cookie exists by making a lightweight request
  try {
    const response = await fetch("/api/verify-session");
    if (response.ok) {
      const result = (await response.json()) as { success: boolean; data?: { valid: boolean } };
      isAuthenticated = result.success && result.data?.valid === true;
    } else {
      isAuthenticated = false;
    }
  } catch {
    isAuthenticated = false;
  } finally {
    isLoading = false;
  }
});

const handleLogout = async () => {
  await fetch("/api/logout", { method: "POST" });
  isAuthenticated = false;
};

const handleOnboardingComplete = (context: OnboardingContext) => {
  const wasEditing = isEditing;

  // Save anonymization state if present (PII review now happens during onboarding)
  if (context.anonymizationState) {
    saveAnonymizationState(context.anonymizationState);
  }

  // Finalize onboarding
  const newState: OnboardingState = { completed: true, context };
  onboardingState = newState;
  saveOnboardingState(newState);

  // Save model path separately for quick access
  const modelPathState: ModelPathState = { selected: true, path: context.modelPath };
  saveModelPath(modelPathState);

  // Clear messages when completing an edit so new conversation starts fresh
  if (wasEditing) {
    clearMessages();
    clearMessageCosts();
  }

  isEditing = false;
  pendingAutoSubmit = true;
};

const handleAutoSubmitComplete = () => {
  pendingAutoSubmit = false;
};

const handleOnboardingSkip = () => {
  const newState: OnboardingState = { completed: true, context: null };
  onboardingState = newState;
  saveOnboardingState(newState);
};

const handleClearOnboarding = () => {
  clearOnboardingState();
  clearMessages();
  onboardingState = { completed: false, context: null };
};

const handleEditContext = () => {
  isEditing = true;
};

const handleCancelEdit = () => {
  isEditing = false;
};

const handleModelChange = (modelId: string) => {
  const currentState = onboardingState;
  if (currentState.context) {
    const newContext = { ...currentState.context, model: modelId };
    const newState: OnboardingState = { completed: true, context: newContext };
    onboardingState = newState;
    saveOnboardingState(newState);
  }
};
</script>

<div class="bg-background text-foreground min-h-screen transition-colors duration-200">
  {#if !isLoading}
    {#if isAuthenticated}
      <!-- Onboarding or Chat -->
      {#if onboardingState.completed && !isEditing}
        <!--
          Lazy load ChatWindow - user must complete onboarding first.
          The dynamic import is what keeps ChatWindow in its own rollup chunk; the
          pre-:then branch is the old <Suspense fallback>.
        -->
        {#await import("@components/ChatWindow.svelte")}
          {@render loadingSpinner()}
        {:then ChatWindowModule}
          <ChatWindowModule.default
            onLogout={handleLogout}
            onboardingContext={onboardingState.context}
            onClearOnboarding={handleClearOnboarding}
            onEditContext={handleEditContext}
            autoSubmit={pendingAutoSubmit}
            onAutoSubmitComplete={handleAutoSubmitComplete}
            onModelChange={handleModelChange}
          />
        {/await}
      {:else}
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onSkip={isEditing ? handleCancelEdit : handleOnboardingSkip}
          initialContext={onboardingState.context}
          {isEditing}
        />
      {/if}
    {:else}
      <PasswordGate
        onSuccess={() => {
          isAuthenticated = true;
        }}
      />
    {/if}
  {:else}
    {@render loadingSpinner()}
  {/if}
</div>

{#snippet loadingSpinner()}
  <div class="flex min-h-screen items-center justify-center">
    <div class="i-carbon-loading text-primary animate-spin text-4xl"></div>
  </div>
{/snippet}
