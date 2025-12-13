import { For, Show, createEffect, type Component } from "solid-js";
import { MessageBubble } from "@components/MessageBubble";
import { AIProviderLogo } from "@components/AIProviderLogo";
import { Button } from "@components/ui/button";
import { t } from "@lib/i18n";
import { getModelById } from "@config/models";
import type { Message } from "@lib/types";

interface MessageListProps {
  messages: Message[];
  streamingContent: string;
  isLoading: boolean;
  canRetry?: boolean;
  retryDisabled?: boolean;
  onRetry?: () => void;
  /** Model ID for displaying provider logo on assistant messages */
  modelId?: string;
  /** Cost per message by index (assistant messages only) */
  messageCosts?: Map<number, number>;
}

export const MessageList: Component<MessageListProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;

  // Get provider from model ID for loading indicator
  const loadingProvider = () => {
    if (!props.modelId) return null;
    const model = getModelById(props.modelId);
    return model?.provider ?? null;
  };

  // Auto-scroll to bottom when messages change
  createEffect(() => {
    // Access reactive props to track them
    props.messages.length;
    props.streamingContent;

    if (containerRef) {
      containerRef.scrollTop = containerRef.scrollHeight;
    }
  });

  return (
    <div
      ref={containerRef}
      class="flex-1 overflow-y-auto px-4 py-6 space-y-6"
    >
      <Show
        when={props.messages.length > 0}
        fallback={
          <div class="text-center text-muted-foreground mt-8">
            <p class="text-lg mb-2">{t("chat.welcomeTitle")}</p>
            <p class="text-sm">
              {t("chat.welcomeMessage")}
            </p>
          </div>
        }
      >
        {/* Use <For> for keyed lists - gives stable references and fine-grained DOM updates */}
        <For each={props.messages}>
          {(message, index) => (
            <MessageBubble
              message={message}
              isCollapsible={index() === 0 && message.role === "user"}
              modelId={props.modelId}
              costUsd={
                message.role === "assistant"
                  ? props.messageCosts?.get(index())
                  : undefined
              }
            />
          )}
        </For>
      </Show>

      {/* Retry button - shown after error messages */}
      <Show when={props.canRetry && !props.isLoading}>
        <div class="flex justify-start">
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

      {/* Streaming message */}
      <Show when={props.streamingContent}>
        <MessageBubble
          message={{ role: "assistant", content: props.streamingContent }}
          modelId={props.modelId}
        />
      </Show>

      {/* Loading indicator */}
      <Show when={props.isLoading && !props.streamingContent}>
        <div class="flex justify-start gap-2">
          <Show when={loadingProvider()}>
            <div class="flex-shrink-0 mt-1">
              <AIProviderLogo provider={loadingProvider()!} size="sm" class="opacity-60" />
            </div>
          </Show>
          <div class="bg-muted rounded-lg px-5 py-4 transition-colors duration-200">
            <span class="i-carbon-loading animate-spin" />
          </div>
        </div>
      </Show>
    </div>
  );
};
