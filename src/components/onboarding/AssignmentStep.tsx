import type { Component } from "solid-js";
import { t } from "@lib/i18n";
import { StepIndicator } from "./StepIndicator";
import { Card, CardContent } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Textarea } from "@components/ui/textarea";

interface AssignmentStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

export const AssignmentStep: Component<AssignmentStepProps> = (props) => {
  return (
    <Card class="w-full max-w-2xl">
      <CardContent class="pt-6">
        <StepIndicator totalSteps={props.totalSteps} currentStep={props.currentStep} />

        <h2 class="mb-2 text-center text-xl font-bold">{t("onboarding.steps.assignment.title")}</h2>
        <p class="text-muted-foreground mb-6 text-center text-sm">
          {t("onboarding.steps.assignment.hint")}
        </p>

        <div class="mb-6">
          <Textarea
            class="min-h-32 resize-y"
            placeholder={t("onboarding.steps.assignment.placeholder")}
            value={props.value}
            onInput={(e) => props.onChange(e.currentTarget.value)}
            autofocus
          />
        </div>

        {/* Navigation */}
        <div class="flex items-center justify-between">
          <Button variant="secondary" onClick={() => props.onBack()}>
            <span class="i-carbon-arrow-left mr-1" />
            {t("onboarding.navigation.back")}
          </Button>

          <div class="flex items-center gap-2">
            <Button variant="link" onClick={() => props.onSkip()} class="text-muted-foreground">
              {t("onboarding.steps.assignment.skipButton")}
            </Button>
            <Button onClick={() => props.onNext()} disabled={!props.value.trim()}>
              {t("onboarding.navigation.next")}
              <span class="i-carbon-arrow-right ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
