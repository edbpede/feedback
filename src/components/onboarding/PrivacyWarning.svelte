<script lang="ts">
  import { Alert, AlertDescription, AlertTitle } from "@components/ui";
  import { t } from "@lib/i18n";
</script>

<Alert variant="warning">
  <span class="text-xl">⚠️</span>
  <AlertTitle>{t("onboarding.privacy.title")}</AlertTitle>
  <AlertDescription>
    <ul class="mt-1 space-y-1">
      <li class="flex items-start gap-2">
        <span class="shrink-0">•</span>
        <span>{t("onboarding.privacy.line1")}</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="shrink-0">•</span>
        <span>{t("onboarding.privacy.line2")}</span>
      </li>
    </ul>
  </AlertDescription>
</Alert>
