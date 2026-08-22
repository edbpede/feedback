<script lang="ts">
/**
 * @fileoverview Loading state component for PII detection.
 * Displays an animated spinner, current model info, TEE security badge,
 * and retry/fallback status during the detection process.
 */

import AIProviderLogo from "@components/AIProviderLogo.svelte";
import { Card, CardContent, Tooltip, TooltipContent, TooltipTrigger } from "@components/ui";
import { getModelById } from "@config/models";
import { t } from "@lib/i18n";
import type { PIIDetectionStatus } from "@lib/types";

/** Props for the PIIDetectionLoading component */
interface PIIDetectionLoadingProps {
  /** Status object for showing retry/fallback progress during detection */
  status?: PIIDetectionStatus | null;
}

/**
 * Loading state shown during PII detection.
 * Displays spinner, current model info, and retry status.
 */
let { status }: PIIDetectionLoadingProps = $props();

const modelConfig = $derived.by(() => {
  if (!status?.currentModel) return null;
  return getModelById(status.currentModel);
});

const showRetryInfo = $derived.by(() => {
  if (!status) return false;
  // Show retry info if we're past first attempt or past first model
  return status.retryAttempt > 1 || status.modelIndex > 1;
});
</script>

<Card class="w-full max-w-2xl">
  <CardContent class="py-12">
    <div class="flex flex-col items-center justify-center gap-6">
      <!-- Spinner with shield icon -->
      <div class="relative">
        <div
          class="border-muted border-t-primary h-16 w-16 animate-spin rounded-full border-4"
        ></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="i-carbon-security text-primary text-2xl"></span>
        </div>
      </div>

      <!-- Title -->
      <h2 class="text-xl font-semibold">{t("pii.detecting.title")}</h2>

      <!-- Model info when available -->
      {#if modelConfig}
        {@const config = modelConfig}
        <div class="flex flex-col items-center gap-2">
          <div class="flex items-center gap-2">
            <AIProviderLogo provider={config.provider} size="sm" />
            <span class="text-muted-foreground text-sm">{t(config.nameKey)}</span>
          </div>
          <!-- TEE security badge -->
          <Tooltip>
            <TooltipTrigger class="flex cursor-help items-center gap-1.5">
              <span class="i-carbon-locked text-primary text-sm"></span>
              <span class="text-primary text-xs font-medium">
                {t("pii.detecting.teeBadge.label")}
              </span>
            </TooltipTrigger>
            <TooltipContent class="max-w-xs">
              <p>{t("pii.detecting.teeBadge.tooltip")}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      {/if}

      <!-- Retry/fallback status -->
      {#if showRetryInfo && status}
        {@const retryStatus = status}
        <div class="bg-muted/50 rounded-lg px-4 py-2 text-center">
          {#if retryStatus.modelIndex > 1}
            <p class="text-muted-foreground text-sm">
              {t("pii.detecting.tryingModel", {
                current: String(retryStatus.modelIndex),
                total: String(retryStatus.totalModels),
              })}
            </p>
          {:else}
            <p class="text-muted-foreground text-sm">
              {t("pii.detecting.retrying", {
                attempt: String(retryStatus.retryAttempt),
                max: String(retryStatus.maxRetries),
              })}
            </p>
          {/if}

          {#if retryStatus.lastError}
            <p class="text-destructive mt-1 text-xs">
              {t("pii.detecting.lastError")}: {retryStatus.lastError}
            </p>
          {/if}
        </div>
      {/if}

      <!-- Description -->
      <p class="text-muted-foreground max-w-md text-center">{t("pii.detecting.description")}</p>
    </div>
  </CardContent>
</Card>
