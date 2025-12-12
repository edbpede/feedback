import type { Component } from "solid-js";
import { t } from "@lib/i18n";
import { StepIndicator } from "./StepIndicator";
import { PrivacyWarning } from "./PrivacyWarning";

interface StudentWorkStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

export const StudentWorkStep: Component<StudentWorkStepProps> = (props) => {
  return (
    <div class="card w-full max-w-2xl">
      <StepIndicator totalSteps={props.totalSteps} currentStep={props.currentStep} />

      <h2 class="text-xl font-bold mb-2 text-center">
        {t("onboarding.steps.studentWork.title")}
      </h2>
      <p class="text-gray-500 dark:text-gray-400 mb-4 text-center text-sm">
        {t("onboarding.steps.studentWork.hint")}
      </p>

      <PrivacyWarning />

      <div class="mt-4 mb-6">
        <textarea
          class="input-base min-h-40 resize-y"
          placeholder={t("onboarding.steps.studentWork.placeholder")}
          value={props.value}
          onInput={(e) => props.onChange(e.currentTarget.value)}
          autofocus
        />
      </div>

      {/* Navigation */}
      <div class="flex justify-between items-center">
        <button
          type="button"
          onClick={() => props.onBack()}
          class="btn-secondary"
        >
          <span class="i-carbon-arrow-left mr-1" />
          {t("onboarding.navigation.back")}
        </button>

        <div class="flex gap-2">
          <button
            type="button"
            onClick={() => props.onSkip()}
            class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline transition-colors"
          >
            {t("onboarding.steps.studentWork.skipButton")}
          </button>
          <button
            type="button"
            onClick={() => props.onNext()}
            disabled={!props.value.trim()}
            class="btn-primary"
          >
            {t("onboarding.navigation.next")}
            <span class="i-carbon-arrow-right ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
