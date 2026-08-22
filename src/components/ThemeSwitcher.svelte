<script lang="ts">
import { Button } from "@components/ui";
import { t } from "@lib/i18n";
import { getTheme, toggleTheme } from "@lib/theme";

const isDark = $derived(getTheme() === "dark");
</script>

<Button
  variant="ghost"
  size="icon"
  onclick={toggleTheme}
  title={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
  aria-label={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
  class="h-9 w-9"
>
  <span
    class="text-lg transition-transform duration-200 {isDark ? 'i-carbon-sun' : 'i-carbon-moon'}"
  ></span>
</Button>
