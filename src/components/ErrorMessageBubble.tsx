import { Show, type Component } from "solid-js";
import { Button } from "@components/ui/button";
import { t } from "@lib/i18n";
import { getErrorInfo, type ErrorCategory } from "@lib/errorUtils";

interface ErrorMessageBubbleProps {
  category: ErrorCategory;
  canRetry?: boolean;
  retryDisabled?: boolean;
  onRetry?: () => void;
}

export const ErrorMessageBubble: Component<ErrorMessageBubbleProps> = (props) => {
  const errorInfo = () => getErrorInfo(props.category);

  return (
    <div class="flex justify-start gap-2">
      <div
        class="max-w-[65ch] rounded-lg border bg-destructive/10 border-destructive/30 transition-colors duration-200"
      >
        <div class="flex items-start gap-3 px-5 py-4">
          <span
            class={`${errorInfo().icon} text-destructive text-xl flex-shrink-0 mt-0.5`}
          />
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-destructive mb-1">
              {t(errorInfo().titleKey)}
            </h4>
            <p class="text-sm text-muted-foreground">
              {t(errorInfo().messageKey)}
            </p>
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
          </div>
        </div>
      </div>
    </div>
  );
};
