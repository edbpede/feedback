import type { Component } from "solid-js";
import { For } from "solid-js";
import { t, type TranslationKey } from "@lib/i18n";
import { StepIndicator } from "./StepIndicator";
import { Card, CardContent } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { PrivacyInfoBox } from "./PrivacyInfoBox";
import { AIProviderLogo } from "@components/AIProviderLogo";
import {
  AVAILABLE_MODELS,
  getRecommendedModelForSubject,
  DEFAULT_MODEL_ID,
  type ModelConfig,
  type SpeedTier,
} from "@config/models";

interface ModelSelectionStepProps {
  value: string;
  onChange: (model: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
  /** Subject selected in step 1, used to show recommendation badge */
  subject?: string;
}

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

export const ModelSelectionStep: Component<ModelSelectionStepProps> = (props) => {
  const recommendedModelId = () =>
    props.subject ? getRecommendedModelForSubject(props.subject) : null;

  return (
    <Card class="w-full max-w-3xl">
      <CardContent class="pt-6">
        <StepIndicator totalSteps={props.totalSteps} currentStep={props.currentStep} />

        <h2 class="mb-2 text-center text-xl font-bold">
          {t("onboarding.steps.modelSelection.title")}
        </h2>
        <p class="text-muted-foreground mb-4 text-center text-sm">
          {t("onboarding.steps.modelSelection.description")}
        </p>

        {/* Model Cards */}
        <div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <For each={AVAILABLE_MODELS}>
            {(model) => {
              const isSelected = () => props.value === model.id;
              const isRecommended = () => recommendedModelId() === model.id;
              const isDefault = () => model.id === DEFAULT_MODEL_ID;

              return (
                <button
                  type="button"
                  onClick={() => props.onChange(model.id)}
                  class={`relative flex flex-col rounded-lg border-2 p-5 text-left transition-all ${
                    isSelected()
                      ? "border-primary bg-accent/20"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  {/* Standard badge for default model */}
                  {isDefault() && (
                    <div class="bg-primary text-primary-foreground absolute -top-2.5 left-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                      <span class="i-carbon-star-filled text-[10px]" />
                      {t("onboarding.steps.modelSelection.default")}
                    </div>
                  )}

                  {/* Subject recommendation badge (only for non-default recommended models) */}
                  {isRecommended() && !isDefault() && props.subject && (
                    <div class="bg-muted text-muted-foreground absolute -top-2.5 left-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                      <span class="i-carbon-thumbs-up text-[10px]" />
                      {t("onboarding.steps.modelSelection.alsoGoodFor", {
                        subject: t(`onboarding.subjects.${props.subject}` as TranslationKey),
                      })}
                    </div>
                  )}

                  {/* Header: Provider Logo + Name */}
                  <div class="mb-3 flex items-center gap-2">
                    <AIProviderLogo provider={model.provider} size="sm" />
                    <span class="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      {model.provider}
                    </span>
                  </div>

                  {/* Model name */}
                  <h3 class="mb-2 text-base font-semibold">{t(model.nameKey)}</h3>

                  {/* Description */}
                  <p class="text-muted-foreground mb-3 text-sm leading-snug">
                    {t(model.descriptionKey)}
                  </p>

                  {/* Best For tag - flex-1 to push footer down */}
                  <div class="flex-1">
                    <span class="text-foreground/70 text-xs font-medium">
                      {t("onboarding.steps.modelSelection.bestForLabel")}:
                    </span>
                    <span class="text-foreground ml-1 text-xs font-semibold">
                      {t(model.bestForKey)}
                    </span>
                  </div>

                  {/* Footer: Speed + Pricing badges */}
                  <div class="mb-2 mt-3 flex flex-wrap items-center gap-2">
                    {/* Speed badge */}
                    <span
                      class={`rounded-full px-2 py-0.5 text-xs font-medium ${getSpeedBadgeClass(model.speedTier)}`}
                    >
                      {t(`onboarding.steps.modelSelection.speedTiers.${model.speedTier}`)}
                    </span>

                    {/* Pricing badge */}
                    <span
                      class={`rounded-full px-2 py-0.5 text-xs font-medium ${getPricingBadgeClass(model.pricingTier)}`}
                    >
                      {t(`onboarding.steps.modelSelection.pricingTiers.${model.pricingTier}`)}
                    </span>
                  </div>

                  {/* Release date - always bottom right, with padding for checkmark */}
                  <div class="pr-8 text-right">
                    <span class="text-muted-foreground text-xs">{model.releaseDate}</span>
                  </div>

                  {/* Selection indicator */}
                  {isSelected() && (
                    <div class="absolute bottom-2 right-2">
                      <span class="i-carbon-checkmark-filled text-primary text-lg" />
                    </div>
                  )}
                </button>
              );
            }}
          </For>
        </div>

        {/* Privacy/Security Info Box */}
        <PrivacyInfoBox />

        {/* Navigation */}
        <div class="flex justify-between">
          <Button variant="secondary" onClick={() => props.onBack()}>
            <span class="i-carbon-arrow-left mr-1" />
            {t("onboarding.navigation.back")}
          </Button>
          <Button onClick={() => props.onSubmit()}>
            <span class="i-carbon-send mr-1" />
            {t("onboarding.navigation.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
