import type { VoidComponent } from "solid-js";
import { t } from "@lib/i18n";

export const PrivacyWarning: VoidComponent = () => {
  return (
    <div class="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      <span class="text-amber-600 dark:text-amber-400 text-xl shrink-0">
        ⚠️
      </span>
      <div>
        <p class="font-medium text-amber-800 dark:text-amber-200">
          {t("onboarding.privacy.title")}
        </p>
        <ul class="text-sm text-amber-700 dark:text-amber-300 mt-1 space-y-1">
          <li class="flex items-start gap-2">
            <span class="shrink-0">•</span>
            <span>{t("onboarding.privacy.line1")}</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="shrink-0">•</span>
            <span>{t("onboarding.privacy.line2")}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
