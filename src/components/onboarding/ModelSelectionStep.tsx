import type { Component } from "solid-js";
import { For } from "solid-js";
import { t } from "@lib/i18n";
import { StepIndicator } from "./StepIndicator";
import { Card, CardContent } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@components/ui/collapsible";
import { AIProviderLogo } from "@components/AIProviderLogo";
import { AVAILABLE_MODELS, getRecommendedModelForSubject, type ModelConfig, type SpeedTier } from "@config/models";

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

        <h2 class="text-xl font-bold mb-2 text-center">
          {t("onboarding.steps.modelSelection.title")}
        </h2>
        <p class="text-muted-foreground mb-4 text-center text-sm">
          {t("onboarding.steps.modelSelection.description")}
        </p>

        {/* Privacy/Security Info - Collapsible */}
        <Collapsible class="mb-6">
          <CollapsibleTrigger class="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
            <span class="i-carbon-security text-primary" />
            <span>{t("onboarding.steps.modelSelection.privacy.trigger")}</span>
            <span class="i-carbon-chevron-down text-xs transition-transform duration-200 group-data-[expanded]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div class="mt-3 p-4 bg-muted/50 rounded-lg text-sm">
              <p class="text-muted-foreground leading-relaxed">
                {t("onboarding.steps.modelSelection.privacy.description")}
              </p>
              <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span class="text-muted-foreground">{t("onboarding.steps.modelSelection.privacy.learnMoreLabel")}</span>
                <a
                  href="https://techcommunity.microsoft.com/blog/azureconfidentialcomputingblog/azure-ai-confidential-inferencing-technical-deep-dive/4253150"
                  class="text-primary hover:underline inline-flex items-center gap-0.5"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("onboarding.steps.modelSelection.privacy.sourceAzure")}
                  <span class="i-carbon-arrow-up-right" />
                </a>
                <a
                  href="https://cloud.google.com/blog/products/identity-security/how-confidential-computing-lays-the-foundation-for-trusted-ai"
                  class="text-primary hover:underline inline-flex items-center gap-0.5"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("onboarding.steps.modelSelection.privacy.sourceGoogle")}
                  <span class="i-carbon-arrow-up-right" />
                </a>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Model Cards */}
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <For each={AVAILABLE_MODELS}>
            {(model) => {
              const isSelected = () => props.value === model.id;
              const isRecommended = () => recommendedModelId() === model.id;

              return (
                <button
                  type="button"
                  onClick={() => props.onChange(model.id)}
                  class={`relative p-5 rounded-lg border-2 transition-all text-left flex flex-col ${
                    isSelected()
                      ? "border-primary bg-accent/20"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  {/* Recommendation badge */}
                  {isRecommended() && props.subject && (
                    <div class="absolute -top-2.5 left-3 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center gap-1">
                      <span class="i-carbon-star-filled text-[10px]" />
                      {t("onboarding.steps.modelSelection.recommendedFor", {
                        subject: t(`onboarding.subjects.${props.subject}`),
                      })}
                    </div>
                  )}

                  {/* Header: Provider Logo + Name */}
                  <div class="flex items-center gap-2 mb-3">
                    <AIProviderLogo provider={model.provider} size="sm" />
                    <span class="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      {model.provider}
                    </span>
                  </div>

                  {/* Model name */}
                  <h3 class="font-semibold text-base mb-2">
                    {t(model.nameKey)}
                  </h3>

                  {/* Description */}
                  <p class="text-sm text-muted-foreground mb-3 leading-snug">
                    {t(model.descriptionKey)}
                  </p>

                  {/* Best For tag - flex-1 to push footer down */}
                  <div class="flex-1">
                    <span class="text-xs font-medium text-foreground/70">
                      {t("onboarding.steps.modelSelection.bestForLabel")}:
                    </span>
                    <span class="text-xs font-semibold text-foreground ml-1">
                      {t(model.bestForKey)}
                    </span>
                  </div>

                  {/* Footer: Speed + Pricing badges */}
                  <div class="flex items-center gap-2 flex-wrap mb-2 mt-3">
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
                  </div>

                  {/* Release date - always bottom right */}
                  <div class="text-right">
                    <span class="text-xs text-muted-foreground">
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
