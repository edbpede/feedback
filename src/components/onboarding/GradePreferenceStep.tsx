import type { Component } from "solid-js";
import { t } from "@lib/i18n";
import { StepIndicator } from "./StepIndicator";
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
        <StepIndicator totalSteps={props.totalSteps} currentStep={props.currentStep} />

        <h2 class="mb-2 text-center text-xl font-bold">
          {t("onboarding.steps.gradePreference.title")}
        </h2>
        <p class="text-muted-foreground mb-6 text-center text-sm">
          {t("onboarding.steps.gradePreference.hint")}
        </p>

        {/* Grade Toggle Cards */}
        <div class="mb-8 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => props.onChange(true)}
            class={`flex-1 rounded-lg border-2 p-6 text-center transition-all ${
              props.value
                ? "border-primary bg-accent/20"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            <span class="mb-3 block text-3xl">📊</span>
            <span class="font-medium">{t("onboarding.steps.gradePreference.yes")}</span>
          </button>

          <button
            type="button"
            onClick={() => props.onChange(false)}
            class={`flex-1 rounded-lg border-2 p-6 text-center transition-all ${
              !props.value
                ? "border-primary bg-accent/20"
                : "border-border hover:border-muted-foreground"
            }`}
          >
            <span class="mb-3 block text-3xl">💬</span>
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
