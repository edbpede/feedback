<script lang="ts">
import AIProviderLogo from "@components/AIProviderLogo.svelte";
import CostBadge from "@components/CostBadge.svelte";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@components/ui";
import { getModelById } from "@config/models";
import { t } from "@lib/i18n";
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

let { message, isCollapsible, modelId, costUsd }: MessageBubbleProps = $props();

const isUser = $derived(message.role === "user");
let expanded = $state(false);

// Async markdown parsing with initial sync fallback.
// The one-shot read of message.content is deliberate and mirrors the Solid original
// (createSignal(parseMarkdownSync(props.message.content))): this is only a first-paint
// placeholder, and the $effect below owns every subsequent update. Making it $derived
// would discard the async parse results the effect writes.
// svelte-ignore state_referenced_locally
let htmlContent = $state<string>(parseMarkdownSync(message.content));

// Track parse sequence to prevent race conditions
let parseSequence = 0;

// Parse markdown when content changes
$effect(() => {
  const content = message.content;
  const currentSequence = ++parseSequence;
  parseMarkdown(content).then((html) => {
    // Only update if this is still the latest parse
    if (currentSequence === parseSequence) {
      htmlContent = html;
    }
  });
});

// Get provider from model ID for logo display
// Prefer message's own modelId (for accurate per-message icons) over the prop
const provider = $derived.by(() => {
  const id = message.modelId ?? modelId;
  if (!id) return null;
  const model = getModelById(id);
  return model?.provider ?? null;
});
</script>

{#snippet messageContent()}
  <div
    class="break-words rounded-lg transition-colors duration-200 {isUser
      ? 'prose prose-sm bg-primary text-primary-foreground prose-invert max-w-[80%] px-4 py-2'
      : 'prose prose-ai bg-muted text-foreground max-w-[65ch] px-5 py-4'}"
  >
    {@html htmlContent}
  </div>
{/snippet}

<!-- Fallback for non-collapsible messages (with logo for assistant) -->
{#snippet regularMessage()}
  {#if !isUser && provider}
    <div class="mt-1 flex-shrink-0">
      <AIProviderLogo provider={provider!} size="sm" class="opacity-60" />
    </div>
  {/if}
  {#if !isUser}
    <div class="flex flex-col">
      {@render messageContent()}
      {#if costUsd !== undefined}
        <div class="ml-1 mt-1">
          <CostBadge costUsd={costUsd!} />
        </div>
      {/if}
    </div>
  {:else}
    {@render messageContent()}
  {/if}
{/snippet}

<div class="flex {isUser ? 'justify-end' : 'justify-start gap-2'}">
  {#if isCollapsible}
    <Collapsible
      open={expanded}
      onOpenChange={(v) => (expanded = v)}
      class="flex max-w-[80%] flex-col items-end"
    >
      <CollapsibleTrigger
        class="bg-primary/80 text-primary-foreground hover:bg-primary flex items-center gap-2 rounded-lg px-4 py-2 transition-colors"
      >
        <!--
          Written as a ternary rather than class:rotate-90={expanded}. UnoCSS scans raw
          source text and its default extractor does not understand Svelte's class:
          directive, so the directive form silently dropped rotate-90 from the emitted
          stylesheet. Verified in the built CSS.
        -->
        <span
          class="i-carbon-chevron-right transition-transform duration-200 {expanded
            ? 'rotate-90'
            : ''}"
        ></span>
        <span class="text-sm">
          {expanded ? t("chat.hideInitialRequest") : t("chat.showInitialRequest")}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent class="mt-2 flex w-full justify-end">
        {@render messageContent()}
      </CollapsibleContent>
    </Collapsible>
  {:else}
    {@render regularMessage()}
  {/if}
</div>
