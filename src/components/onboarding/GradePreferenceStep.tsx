import type { Component } from "solid-js";
import { t } from "@lib/i18n";
import { StepIndicator } from "./StepIndicator";
import { CardExternalLinks } from "@components/CardExternalLinks";
import { Card, CardContent } from "@components/ui/card";
import { Button } from "@components/ui/button";

interface GradePreferenceStepProps {
  value: boolean;
  onChange: (value: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

export const GradePreferenceStep: Component<GradePreferenceStepProps> = (props) => {
  return (
    <Card class="w-full max-w-2xl">
      <CardContent class="pt-6">
        <div class="flex justify-start mb-4">
          <CardExternalLinks />
        </div>

        <StepIndicator totalSteps={props.totalSteps} currentStep={props.currentStep} />

        <h2 class="text-xl font-bold mb-2 text-center">
          {t("onboarding.steps.gradePreference.title")}
        </h2>
        <p class="text-muted-foreground mb-6 text-center text-sm">
          {t("onboarding.steps.gradePreference.hint")}
        </p>

        {/* Grade Toggle Cards */}
        <div class="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            type="button"
            onClick={() => props.onChange(true)}
            class={`flex-1 p-6 rounded-lg border-2 transition-all text-center ${
              props.value
                ? "border-primary bg-accent/20"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            <span class="block text-3xl mb-3">📊</span>
            <span class="font-medium">{t("onboarding.steps.gradePreference.yes")}</span>
          </button>

          <button
            type="button"
            onClick={() => props.onChange(false)}
            class={`flex-1 p-6 rounded-lg border-2 transition-all text-center ${
              !props.value
                ? "border-primary bg-accent/20"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            <span class="block text-3xl mb-3">💬</span>
            <span class="font-medium">{t("onboarding.steps.gradePreference.no")}</span>
          </button>
        </div>

        {/* Navigation */}
        <div class="flex justify-between">
          <Button variant="secondary" onClick={() => props.onBack()}>
            <span class="i-carbon-arrow-left mr-1" />
            {t("onboarding.navigation.back")}
          </Button>
          <Button onClick={() => props.onNext()}>
            {t("onboarding.navigation.next")}
            <span class="i-carbon-arrow-right ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
