<script lang="ts">
  import { Button } from "@components/ui";
  import { getLocale, type Locale, setLocale, t } from "@lib/i18n";

  const toggleLocale = () => {
    const current = getLocale();
    const next: Locale = current === "da" ? "en" : "da";
    setLocale(next);
  };
</script>

<Button
  variant="ghost"
  size="sm"
  onclick={toggleLocale}
  title={t("language.label")}
  class="text-muted-foreground hover:text-foreground gap-1"
>
  <span class="i-carbon-language"></span>
  <span class="hidden sm:inline">{getLocale() === "da" ? t("language.danish") : t("language.english")}</span>
</Button>
