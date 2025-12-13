import type { Component } from "solid-js";
import { For } from "solid-js";
import { t } from "@lib/i18n";
import { StepIndicator } from "./StepIndicator";
import { Card, CardContent } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { AIProviderLogo } from "@components/AIProviderLogo";
import { AVAILABLE_MODELS, DEFAULT_MODEL_ID, type ModelConfig, type SpeedTier } from "@config/models";

interface ModelSelectionStepProps {
  value: string;
  onChange: (model: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
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
  return (
    <Card class="w-full max-w-3xl">
      <CardContent class="pt-6">
        <StepIndicator totalSteps={props.totalSteps} currentStep={props.currentStep} />

        <h2 class="text-xl font-bold mb-2 text-center">
          {t("onboarding.steps.modelSelection.title")}
        </h2>
        <p class="text-muted-foreground mb-6 text-center text-sm">
          {t("onboarding.steps.modelSelection.description")}
        </p>

        {/* Model Cards */}
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <For each={AVAILABLE_MODELS}>
            {(model) => {
              const isSelected = () => props.value === model.id;
              const isDefault = model.id === DEFAULT_MODEL_ID;

              return (
                <button
                  type="button"
                  onClick={() => props.onChange(model.id)}
                  class={`relative p-5 rounded-lg border-2 transition-all text-left ${
                    isSelected()
                      ? "border-primary bg-accent/20"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  {/* Header: Provider Logo + Name + Default badge */}
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <AIProviderLogo provider={model.provider} size="sm" />
                      <span class="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        {model.provider}
                      </span>
                    </div>
                    {isDefault && (
                      <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                        {t("onboarding.steps.modelSelection.default")}
                      </span>
                    )}
                  </div>

                  {/* Model name */}
                  <h3 class="font-semibold text-base mb-2">
                    {t(model.nameKey)}
                  </h3>

                  {/* Description */}
                  <p class="text-sm text-muted-foreground mb-3 leading-snug">
                    {t(model.descriptionKey)}
                  </p>

                  {/* Best For tag */}
                  <div class="mb-3">
                    <span class="text-xs font-medium text-foreground/70">
                      {t("onboarding.steps.modelSelection.bestForLabel")}:
                    </span>
                    <span class="text-xs font-semibold text-foreground ml-1">
                      {t(model.bestForKey)}
                    </span>
                  </div>

                  {/* Footer: Speed + Pricing + Date */}
                  <div class="flex items-center gap-2 flex-wrap">
                    {/* Speed badge */}
                    <span
                      class={`px-2 py-0.5 text-xs font-medium rounded-full ${getSpeedBadgeClass(model.speedTier)}`}
                    >
                      {t(`onboarding.steps.modelSelection.speedTiers.${model.speedTier}`)}
                    </span>

                    {/* Pricing badge */}
                    <span
                      class={`px-2 py-0.5 text-xs font-medium rounded-full ${getPricingBadgeClass(model.pricingTier)}`}
                    >
                      {t(`onboarding.steps.modelSelection.pricingTiers.${model.pricingTier}`)}
                    </span>

                    {/* Release date */}
                    <span class="text-xs text-muted-foreground ml-auto">
                      {model.releaseDate}
                    </span>
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
