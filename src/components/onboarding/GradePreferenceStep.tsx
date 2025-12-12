import type { Component } from "solid-js";
import { t } from "@lib/i18n";
import { StepIndicator } from "./StepIndicator";

interface GradePreferenceStepProps {
  value: boolean;
  onChange: (value: boolean) => void;
  onSubmit: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

export const GradePreferenceStep: Component<GradePreferenceStepProps> = (props) => {
  return (
    <div class="card w-full max-w-2xl">
      <StepIndicator totalSteps={props.totalSteps} currentStep={props.currentStep} />

      <h2 class="text-xl font-bold mb-2 text-center">
        {t("onboarding.steps.gradePreference.title")}
      </h2>
      <p class="text-gray-500 dark:text-gray-400 mb-6 text-center text-sm">
        {t("onboarding.steps.gradePreference.hint")}
      </p>

      {/* Grade Toggle Cards */}
      <div class="flex flex-col sm:flex-row gap-4 mb-8">
        <button
          type="button"
          onClick={() => props.onChange(true)}
          class={`flex-1 p-6 rounded-lg border-2 transition-all text-center ${
            props.value
              ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
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
              ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
          }`}
        >
          <span class="block text-3xl mb-3">💬</span>
          <span class="font-medium">{t("onboarding.steps.gradePreference.no")}</span>
        </button>
      </div>

      {/* Navigation */}
      <div class="flex justify-between">
        <button
          type="button"
          onClick={() => props.onBack()}
          class="btn-secondary"
        >
          <span class="i-carbon-arrow-left mr-1" />
          {t("onboarding.navigation.back")}
        </button>
        <button
          type="button"
          onClick={() => props.onSubmit()}
          class="btn-primary"
        >
          <span class="i-carbon-send mr-1" />
          {t("onboarding.navigation.submit")}
        </button>
      </div>
    </div>
  );
};
