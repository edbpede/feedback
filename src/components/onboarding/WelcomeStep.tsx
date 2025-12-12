import type { Component } from "solid-js";
import { t } from "@lib/i18n";
import { ThemeSwitcher } from "@components/ThemeSwitcher";
import { LanguageSwitcher } from "@components/LanguageSwitcher";

interface WelcomeStepProps {
  onStart: () => void;
}

export const WelcomeStep: Component<WelcomeStepProps> = (props) => {
  return (
    <div class="card w-full max-w-lg text-center">
      <div class="flex justify-end gap-1 mb-4">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>

      <div class="text-6xl mb-6">👋</div>

      <h1 class="text-2xl font-bold mb-4">{t("onboarding.welcome.title")}</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-8">
        {t("onboarding.welcome.description")}
      </p>

      <button
        type="button"
        onClick={() => props.onStart()}
        class="btn-primary text-lg px-8 py-3 w-full sm:w-auto"
      >
        <span class="mr-2">🚀</span>
        {t("onboarding.welcome.startButton")}
      </button>
    </div>
  );
};
