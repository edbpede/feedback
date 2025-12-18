import { createSignal, createEffect, Show, type Component } from "solid-js";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@components/ui/collapsible";
import { AIProviderLogo } from "@components/AIProviderLogo";
import { CostBadge } from "@components/CostBadge";
import { t } from "@lib/i18n";
import { getModelById } from "@config/models";
import { parseMarkdown, parseMarkdownSync } from "@lib/markdownRenderer";
import type { Message } from "@lib/types";

interface MessageBubbleProps {
  message: Message;
  isCollapsible?: boolean;
  /** Model ID for displaying provider logo on assistant messages */
  modelId?: string;
  /** Cost in USD for this message (assistant messages only) */
  costUsd?: number;
}

export const MessageBubble: Component<MessageBubbleProps> = (props) => {
  const isUser = () => props.message.role === "user";
  const [expanded, setExpanded] = createSignal(false);

  // Async markdown parsing with initial sync fallback
  const [htmlContent, setHtmlContent] = createSignal<string>(
    parseMarkdownSync(props.message.content)
  );

  // Parse markdown when content changes
  createEffect(() => {
    const content = props.message.content;
    parseMarkdown(content).then(setHtmlContent);
  });

  // Get provider from model ID for logo display
  // Prefer message's own modelId (for accurate per-message icons) over the prop
  const provider = () => {
    const modelId = props.message.modelId ?? props.modelId;
    if (!modelId) return null;
    const model = getModelById(modelId);
    return model?.provider ?? null;
  };

  const messageContent = (
    <div
      class={`break-words rounded-lg transition-colors duration-200 ${
        isUser()
          ? "prose prose-sm bg-primary text-primary-foreground prose-invert max-w-[80%] px-4 py-2"
          : "prose prose-ai bg-muted text-foreground max-w-[65ch] px-5 py-4"
      }`}
      innerHTML={htmlContent()}
    />
  );

  // Fallback for non-collapsible messages (with logo for assistant)
  const regularMessage = (
    <>
      <Show when={!isUser() && provider()}>
        <div class="mt-1 flex-shrink-0">
          <AIProviderLogo provider={provider()!} size="sm" class="opacity-60" />
        </div>
      </Show>
      <Show when={!isUser()} fallback={messageContent}>
        <div class="flex flex-col">
          {messageContent}
          <Show when={props.costUsd !== undefined}>
            <div class="ml-1 mt-1">
              <CostBadge costUsd={props.costUsd!} />
            </div>
          </Show>
        </div>
      </Show>
    </>
  );

  return (
    <div class={`flex ${isUser() ? "justify-end" : "justify-start gap-2"}`}>
      <Show when={props.isCollapsible} fallback={regularMessage}>
        <Collapsible
          open={expanded()}
          onOpenChange={setExpanded}
          class="flex max-w-[80%] flex-col items-end"
        >
          <CollapsibleTrigger class="bg-primary/80 text-primary-foreground hover:bg-primary flex items-center gap-2 rounded-lg px-4 py-2 transition-colors">
            <span
              class="i-carbon-chevron-right transition-transform duration-200"
              classList={{ "rotate-90": expanded() }}
            />
            <span class="text-sm">
              {expanded() ? t("chat.hideInitialRequest") : t("chat.showInitialRequest")}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent class="mt-2 flex w-full justify-end">
            {messageContent}
          </CollapsibleContent>
        </Collapsible>
      </Show>
    </div>
  );
};
