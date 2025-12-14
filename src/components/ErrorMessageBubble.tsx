import { Show, type Component } from "solid-js";
import { Button } from "@components/ui/button";
import { t } from "@lib/i18n";
import { getErrorInfo, type ErrorCategory } from "@lib/errorUtils";
import { FallbackModelSelector } from "@components/FallbackModelSelector";

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

export const ErrorMessageBubble: Component<ErrorMessageBubbleProps> = (props) => {
  const errorInfo = () => getErrorInfo(props.category);

  return (
    <div class="flex justify-start gap-2">
      <div class="bg-destructive/10 border-destructive/30 max-w-[65ch] rounded-lg border transition-colors duration-200">
        <div class="flex items-start gap-3 px-5 py-4">
          <span class={`${errorInfo().icon} text-destructive mt-0.5 flex-shrink-0 text-xl`} />
          <div class="min-w-0 flex-1">
            <h4 class="text-destructive mb-1 font-semibold">{t(errorInfo().titleKey)}</h4>
            <p class="text-muted-foreground text-sm">{t(errorInfo().messageKey)}</p>
            <Show when={props.canRetry}>
              <div class="mt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => props.onRetry?.()}
                  disabled={props.retryDisabled}
                  class="gap-2"
                >
                  <Show
                    when={!props.retryDisabled}
                    fallback={
                      <>
                        <span class="i-carbon-time" />
                        {t("chat.retryDisabled")}
                      </>
                    }
                  >
                    <span class="i-carbon-restart" />
                    {t("chat.retryButton")}
                  </Show>
                </Button>
              </div>
            </Show>
            <Show when={props.showFallbackSelector && props.failedModelId}>
              <FallbackModelSelector
                failedModelId={props.failedModelId!}
                subject={props.subject}
                onSelectModel={(modelId) => props.onSelectFallbackModel?.(modelId)}
              />
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
};
