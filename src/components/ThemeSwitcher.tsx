import { type Component } from "solid-js";
import { getTheme, toggleTheme } from "@lib/theme";
import { t } from "@lib/i18n";

export const ThemeSwitcher: Component = () => {
  const isDark = () => getTheme() === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      class="flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      title={isDark() ? t("theme.switchToLight") : t("theme.switchToDark")}
      aria-label={isDark() ? t("theme.switchToLight") : t("theme.switchToDark")}
    >
      <span
        class={`text-lg transition-transform duration-200 ${isDark() ? "i-carbon-sun" : "i-carbon-moon"}`}
      />
    </button>
  );
};
