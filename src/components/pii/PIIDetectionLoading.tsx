import { Show, type Component } from "solid-js";
import { t } from "@lib/i18n";
import { Card, CardContent } from "@components/ui/card";
import { AIProviderLogo } from "@components/AIProviderLogo";
import { getModelById } from "@config/models";
import type { PIIDetectionStatus } from "@lib/types";

interface PIIDetectionLoadingProps {
  /** Optional status for showing retry/fallback progress */
  status?: PIIDetectionStatus | null;
}

/**
 * Loading state shown during PII detection.
 * Displays spinner, current model info, and retry status.
 */
export const PIIDetectionLoading: Component<PIIDetectionLoadingProps> = (props) => {
  const modelConfig = () => {
    if (!props.status?.currentModel) return null;
    return getModelById(props.status.currentModel);
  };

  const showRetryInfo = () => {
    const status = props.status;
    if (!status) return false;
    // Show retry info if we're past first attempt or past first model
    return status.retryAttempt > 1 || status.modelIndex > 1;
  };

  return (
    <Card class="w-full max-w-2xl">
      <CardContent class="py-12">
        <div class="flex flex-col items-center justify-center gap-6">
          {/* Spinner with shield icon */}
          <div class="relative">
            <div class="border-muted border-t-primary h-16 w-16 animate-spin rounded-full border-4" />
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="i-carbon-security text-primary text-2xl" />
            </div>
          </div>

          {/* Title */}
          <h2 class="text-xl font-semibold">{t("pii.detecting.title")}</h2>

          {/* Model info when available */}
          <Show when={modelConfig()}>
            {(config) => (
              <div class="flex items-center gap-2">
                <AIProviderLogo provider={config().provider} size="sm" />
                <span class="text-muted-foreground text-sm">{t(config().nameKey)}</span>
              </div>
            )}
          </Show>

          {/* Retry/fallback status */}
          <Show when={showRetryInfo()}>
            <div class="bg-muted/50 rounded-lg px-4 py-2 text-center">
              <Show
                when={props.status!.modelIndex > 1}
                fallback={
                  <p class="text-muted-foreground text-sm">
                    {t("pii.detecting.retrying", {
                      attempt: String(props.status!.retryAttempt),
                      max: String(props.status!.maxRetries),
                    })}
                  </p>
                }
              >
                <p class="text-muted-foreground text-sm">
                  {t("pii.detecting.tryingModel", {
                    current: String(props.status!.modelIndex),
                    total: String(props.status!.totalModels),
                  })}
                </p>
              </Show>

              <Show when={props.status?.lastError}>
                <p class="text-destructive mt-1 text-xs">
                  {t("pii.detecting.lastError")}: {props.status!.lastError}
                </p>
              </Show>
            </div>
          </Show>

          {/* Description */}
          <p class="text-muted-foreground max-w-md text-center">{t("pii.detecting.description")}</p>
        </div>
      </CardContent>
    </Card>
  );
};
