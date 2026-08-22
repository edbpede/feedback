<script lang="ts">
  import AIProviderLogo from "@components/AIProviderLogo.svelte";
  import ErrorMessageBubble from "@components/ErrorMessageBubble.svelte";
  import MessageBubble from "@components/MessageBubble.svelte";
  import { getModelById } from "@config/models";
  import type { ErrorCategory } from "@lib/errorUtils";
  import { t } from "@lib/i18n";
  import type { Message } from "@lib/types";

  interface MessageListProps {
    messages: Message[];
    streamingContent: string;
    isLoading: boolean;
    /** Error category to display error bubble */
    errorCategory?: ErrorCategory | null;
    canRetry?: boolean;
    retryDisabled?: boolean;
    onRetry?: () => void;
    /** Model ID for displaying provider logo on assistant messages */
    modelId?: string;
    /** Model ID being used for the current streaming request */
    streamingModelId?: string | null;
    /** Cost per message by index (assistant messages only) */
    messageCosts?: Map<number, number>;
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
    messages,
    streamingContent,
    isLoading,
    errorCategory,
    canRetry,
    retryDisabled,
    onRetry,
    modelId,
    streamingModelId,
    messageCosts,
    showFallbackSelector,
    failedModelId,
    subject,
    onSelectFallbackModel,
  }: MessageListProps = $props();

  let containerRef: HTMLDivElement | undefined;

  // Get provider from model ID for loading/streaming indicator
  // Prefer streamingModelId (current request) over modelId (default)
  const streamingProvider = $derived.by(() => {
    const id = streamingModelId ?? modelId;
    if (!id) return null;
    const model = getModelById(id);
    return model?.provider ?? null;
  });

  // Auto-scroll to bottom when messages change
  $effect(() => {
    // Access reactive props to track them
    messages.length;
    streamingContent;

    if (containerRef) {
      containerRef.scrollTop = containerRef.scrollHeight;
    }
  });
</script>

<div bind:this={containerRef} class="flex-1 space-y-6 overflow-y-auto px-4 py-6">
  {#if messages.length > 0}
    <!-- Use {#each} for keyed lists - gives stable references and fine-grained DOM updates -->
    {#each messages as message, index (index)}
      <MessageBubble
        {message}
        isCollapsible={index === 0 && message.role === "user"}
        {modelId}
        costUsd={message.role === "assistant" ? messageCosts?.get(index) : undefined}
      />
    {/each}
  {:else}
    <div class="text-muted-foreground mt-8 text-center">
      <p class="mb-2 text-lg">{t("chat.welcomeTitle")}</p>
      <p class="text-sm">{t("chat.welcomeMessage")}</p>
    </div>
  {/if}

  <!-- Error message bubble - shown when error occurs -->
  {#if errorCategory && !isLoading}
    <ErrorMessageBubble
      category={errorCategory!}
      {canRetry}
      {retryDisabled}
      {onRetry}
      {showFallbackSelector}
      {failedModelId}
      {subject}
      {onSelectFallbackModel}
    />
  {/if}

  <!-- Streaming message -->
  {#if streamingContent}
    <MessageBubble
      message={{ role: "assistant", content: streamingContent }}
      modelId={streamingModelId ?? modelId}
    />
  {/if}

  <!-- Loading indicator -->
  {#if isLoading && !streamingContent}
    <div class="flex justify-start gap-2">
      {#if streamingProvider}
        <div class="mt-1 flex-shrink-0">
          <AIProviderLogo provider={streamingProvider!} size="sm" class="opacity-60" />
        </div>
      {/if}
      <div class="bg-muted rounded-lg px-5 py-4 transition-colors duration-200">
        <span class="i-carbon-loading animate-spin"></span>
      </div>
    </div>
  {/if}
</div>
