import { type Component } from "solid-js";
import { getLocale, setLocale, t, type Locale } from "@lib/i18n";
import { Button } from "@components/ui/button";

export const LanguageSwitcher: Component = () => {
  const toggleLocale = () => {
    const current = getLocale();
    const next: Locale = current === "da" ? "en" : "da";
    setLocale(next);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      title={t("language.label")}
      class="gap-1 text-muted-foreground hover:text-foreground"
    >
      <span class="i-carbon-language" />
      <span class="hidden sm:inline">
        {getLocale() === "da" ? t("language.danish") : t("language.english")}
      </span>
    </Button>
  );
};
