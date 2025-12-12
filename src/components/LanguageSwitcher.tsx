import { type Component } from "solid-js";
import { getLocale, setLocale, t, type Locale } from "@lib/i18n";

export const LanguageSwitcher: Component = () => {
  const toggleLocale = () => {
    const current = getLocale();
    const next: Locale = current === "da" ? "en" : "da";
    setLocale(next);
  };

  return (
    <button
      type="button"
      onClick={toggleLocale}
      class="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      title={t("language.label")}
    >
      <span class="i-carbon-language" />
      <span class="hidden sm:inline">
        {getLocale() === "da" ? t("language.danish") : t("language.english")}
      </span>
    </button>
  );
};
