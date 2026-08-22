<script lang="ts">
/**
 * @fileoverview Final onboarding step for AI model selection.
 * Displays available models filtered by the selected path (TEE or commercial),
 * with pricing tiers, speed indicators, and subject-based recommendations.
 */

import AIProviderLogo from "@components/AIProviderLogo.svelte";
import { Alert, AlertDescription, Button, Card, CardContent } from "@components/ui";
import {
  AVAILABLE_MODELS,
  DEFAULT_MODEL_ID,
  getDefaultModelForPath,
  getModelsForPath,
  getRecommendedModelForSubject,
  type ModelConfig,
  type SpeedTier,
} from "@config/models";
import { type TranslationKey, t } from "@lib/i18n";
import type { ModelPath } from "@lib/types";
import PrivacyInfoBox from "./PrivacyInfoBox.svelte";
import StepIndicator from "./StepIndicator.svelte";

/** Props for the ModelSelectionStep component */
interface ModelSelectionStepProps {
  /** Currently selected model ID */
  value: string;
  /** Callback when user selects a different model */
  onChange: (model: string) => void;
  /** Callback when user submits and completes onboarding */
  onSubmit: () => void;
  /** Callback to go back to previous step */
  onBack: () => void;
  /** Current step number for progress indicator */
  currentStep: number;
  /** Total steps for progress indicator */
  totalSteps: number;
  /** Subject selected in step 1, used to show recommendation badge */
  subject?: string;
  /** Selected model path (privacy-first or enhanced-quality) */
  modelPath?: ModelPath | null;
}

/** Returns CSS classes for pricing tier badge styling */
function getPricingBadgeClass(tier: ModelConfig["pricingTier"]): string {
  switch (tier) {
    case "budget":
      return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400";
    case "standard":
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
    case "premium":
      return "bg-purple-500/20 text-purple-600 dark:text-purple-400";
  }
}

/** Returns CSS classes for speed tier badge styling */
function getSpeedBadgeClass(tier: SpeedTier): string {
  switch (tier) {
    case "fast":
      return "bg-amber-500/20 text-amber-600 dark:text-amber-400";
    case "medium":
      return "bg-slate-500/20 text-slate-600 dark:text-slate-400";
    case "very-fast":
      return "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400";
  }
}

/**
 * Final onboarding step: AI model selection.
 * Displays model cards filtered by the selected path with pricing,
 * speed, and subject-based recommendation badges.
 */
let {
  value,
  onChange,
  onSubmit,
  onBack,
  currentStep,
  totalSteps,
  subject,
  modelPath,
}: ModelSelectionStepProps = $props();

const recommendedModelId = $derived(subject ? getRecommendedModelForSubject(subject) : null);

// Get models filtered by path, or all models if no path selected
const displayModels = $derived.by(() => {
  if (modelPath) {
    return getModelsForPath(modelPath);
  }
  return AVAILABLE_MODELS;
});

// Get the default model ID for the current path
const defaultModelId = $derived.by(() => {
  if (modelPath) {
    return getDefaultModelForPath(modelPath);
  }
  return DEFAULT_MODEL_ID;
});

// Check if using commercial path (needs anonymization warning)
const isCommercialPath = $derived(modelPath === "enhanced-quality");
</script>

<Card class="w-full max-w-3xl">
  <CardContent class="pt-6">
    <StepIndicator {totalSteps} {currentStep} />

    <h2 class="mb-2 text-center text-xl font-bold">
      {t("onboarding.steps.modelSelection.title")}
    </h2>
    <p class="text-muted-foreground mb-4 text-center text-sm">
      {t("onboarding.steps.modelSelection.description")}
    </p>

    <!-- Privacy/Security Info Banner for TEE path -->
    {#if !isCommercialPath}
      <PrivacyInfoBox />
    {/if}

    <!-- Anonymization warning for commercial path -->
    {#if isCommercialPath}
      <Alert variant="warning" class="mb-6">
        <span class="i-carbon-warning-alt text-lg"></span>
        <AlertDescription>
          {t("onboarding.steps.modelSelection.commercialWarning")}
        </AlertDescription>
      </Alert>
    {/if}

    <!-- Model Cards -->
    <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each displayModels as model (model.id)}
        {@const isSelected = value === model.id}
        {@const isRecommended = recommendedModelId === model.id}
        {@const isDefault = model.id === defaultModelId}

        <button
          type="button"
          onclick={() => onChange(model.id)}
          class={`relative flex flex-col rounded-lg border-2 p-5 text-left transition-all ${
            isSelected
              ? "border-primary bg-accent/20"
              : "border-border hover:border-muted-foreground"
          }`}
        >
          <!-- Standard badge for default model -->
          {#if isDefault}
            <div
              class="bg-primary text-primary-foreground absolute -top-2.5 left-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            >
              <span class="i-carbon-star-filled text-[10px]"></span>{t("onboarding.steps.modelSelection.default")}
            </div>
          {/if}

          <!-- Subject recommendation badge (only for non-default recommended models) -->
          {#if isRecommended && !isDefault && subject}
            <div
              class="bg-muted text-muted-foreground absolute -top-2.5 left-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            >
              <span class="i-carbon-thumbs-up text-[10px]"></span>{t("onboarding.steps.modelSelection.alsoGoodFor", {
                subject: t(`onboarding.subjects.${subject}` as TranslationKey),
              })}
            </div>
          {/if}

          <!-- Header: Provider Logo + Name -->
          <div class="mb-3 flex items-center gap-2">
            <AIProviderLogo provider={model.provider} size="sm" />
            <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              {model.provider}
            </span>
          </div>

          <!-- Model name -->
          <h3 class="mb-2 text-base font-semibold">{t(model.nameKey)}</h3>

          <!-- Description -->
          <p class="text-muted-foreground mb-3 text-sm leading-snug">
            {t(model.descriptionKey)}
          </p>

          <!-- Best For tag - flex-1 to push footer down -->
          <div class="flex-1">
            <span class="text-foreground/70 text-xs font-medium">
              {t("onboarding.steps.modelSelection.bestForLabel")}:
            </span>
            <span class="text-foreground ml-1 text-xs font-semibold">
              {t(model.bestForKey)}
            </span>
          </div>

          <!-- Footer: Speed + Pricing badges -->
          <div class="mb-2 mt-3 flex flex-wrap items-center gap-2">
            <!-- Speed badge -->
            <span
              class={`rounded-full px-2 py-0.5 text-xs font-medium ${getSpeedBadgeClass(model.speedTier)}`}
            >
              {t(`onboarding.steps.modelSelection.speedTiers.${model.speedTier}`)}
            </span>

            <!-- Pricing badge -->
            <span
              class={`rounded-full px-2 py-0.5 text-xs font-medium ${getPricingBadgeClass(model.pricingTier)}`}
            >
              {t(`onboarding.steps.modelSelection.pricingTiers.${model.pricingTier}`)}
            </span>
          </div>

          <!-- Release date - always bottom right, with padding for checkmark -->
          <div class="pr-8 text-right">
            <span class="text-muted-foreground text-xs">{model.releaseDate}</span>
          </div>

          <!-- Selection indicator -->
          {#if isSelected}
            <div class="absolute bottom-2 right-2">
              <span class="i-carbon-checkmark-filled text-primary text-lg"></span>
            </div>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Navigation -->
    <div class="flex justify-between">
      <Button variant="secondary" onclick={() => onBack()}>
        <span class="i-carbon-arrow-left mr-1"></span>{t("onboarding.navigation.back")}
      </Button>
      <Button onclick={() => onSubmit()}>
        <span class="i-carbon-send mr-1"></span>{t("onboarding.navigation.submit")}
      </Button>
    </div>
  </CardContent>
</Card>
