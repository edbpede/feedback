import { type Component } from "solid-js";
import { getTheme, toggleTheme } from "@lib/theme";
import { t } from "@lib/i18n";
import { Button } from "@components/ui/button";

export const ThemeSwitcher: Component = () => {
  const isDark = () => getTheme() === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={isDark() ? t("theme.switchToLight") : t("theme.switchToDark")}
      aria-label={isDark() ? t("theme.switchToLight") : t("theme.switchToDark")}
      class="w-9 h-9"
    >
      <span
        class={`text-lg transition-transform duration-200 ${isDark() ? "i-carbon-sun" : "i-carbon-moon"}`}
      />
    </Button>
  );
};
