<script lang="ts">
  import FallbackModelSelector from "@components/FallbackModelSelector.svelte";
  import { Button } from "@components/ui";
  import { type ErrorCategory, getErrorInfo } from "@lib/errorUtils";
  import { t } from "@lib/i18n";

  interface ErrorMessageBubbleProps {
    category: ErrorCategory;
    canRetry?: boolean;
    retryDisabled?: boolean;
    onRetry?: () => void;
    /** Show fallback model selector when all retries exhausted */
    showFallbackSelector?: boolean;
    /** The model that failed (to exclude from fallback options) */
    failedModelId?: string;
    /** User's subject for model recommendations */
    subject?: string;
    /** Callback when user selects a fallback model */
    onSelectFallbackModel?: (modelId: string) => void;
  }

  let {
    category,
    canRetry,
    retryDisabled,
    onRetry,
    showFallbackSelector,
    failedModelId,
    subject,
    onSelectFallbackModel,
  }: ErrorMessageBubbleProps = $props();

  const errorInfo = $derived(getErrorInfo(category));
</script>

<div class="flex justify-start gap-2">
  <div
    class="bg-destructive/10 border-destructive/30 max-w-[65ch] rounded-lg border transition-colors duration-200"
  >
    <div class="flex items-start gap-3 px-5 py-4">
      <span class={`${errorInfo.icon} text-destructive mt-0.5 flex-shrink-0 text-xl`}></span>
      <div class="min-w-0 flex-1">
        <h4 class="text-destructive mb-1 font-semibold">{t(errorInfo.titleKey)}</h4>
        <p class="text-muted-foreground text-sm">{t(errorInfo.messageKey)}</p>
        {#if canRetry}
          <div class="mt-3">
            <Button
              variant="secondary"
              size="sm"
              onclick={() => onRetry?.()}
              disabled={retryDisabled}
              class="gap-2"
            >
              {#if !retryDisabled}
                <span class="i-carbon-restart"></span>
                {t("chat.retryButton")}
              {:else}
                <span class="i-carbon-time"></span>
                {t("chat.retryDisabled")}
              {/if}
            </Button>
          </div>
        {/if}
        {#if showFallbackSelector && failedModelId}
          <FallbackModelSelector
            failedModelId={failedModelId!}
            {subject}
            onSelectModel={(modelId) => onSelectFallbackModel?.(modelId)}
          />
        {/if}
      </div>
    </div>
  </div>
</div>
