<script lang="ts">
import BalanceDisplay from "@components/BalanceDisplay.svelte";
import ChatInput from "@components/ChatInput.svelte";
import FileUpload from "@components/FileUpload.svelte";
import LanguageSwitcher from "@components/LanguageSwitcher.svelte";
import Logo from "@components/Logo.svelte";
import MessageList from "@components/MessageList.svelte";
import ThemeSwitcher from "@components/ThemeSwitcher.svelte";
import { Button } from "@components/ui";
import { calculateCostUsd } from "@config/pricing";
import { fetchBalance, type RetryPhase, sendMessage } from "@lib/api";
import { ApiError, type ErrorCategory } from "@lib/errorUtils";
import { t } from "@lib/i18n";
import { loadMessageCosts, loadMessages, saveMessageCosts, saveMessages } from "@lib/storage";
import type { Message, OnboardingContext, TokenUsage } from "@lib/types";
import { onMount } from "svelte";

interface ChatWindowProps {
  onLogout: () => void;
  onboardingContext: OnboardingContext | null;
  onClearOnboarding: () => void;
  onEditContext: () => void;
  autoSubmit?: boolean;
  onAutoSubmitComplete?: () => void;
  /** Callback when model is changed (e.g., after successful fallback) */
  onModelChange?: (modelId: string) => void;
}

interface AttachedFile {
  name: string;
  content: string;
}

let {
  onLogout,
  onboardingContext,
  onClearOnboarding,
  onEditContext,
  autoSubmit,
  onAutoSubmitComplete,
  onModelChange,
}: ChatWindowProps = $props();

let messages = $state<Message[]>([]);
let isLoading = $state(false);
let attachedFile = $state<AttachedFile | null>(null);
let streamingContent = $state("");

// Retry state with phase and delay info
let retryState = $state<{
  attempt: number;
  max: number;
  phase: RetryPhase;
  delayMs: number;
} | null>(null);
let failedMessage = $state<Message | null>(null);
let retryDisabledUntil = $state<number>(0);
let errorCategory = $state<ErrorCategory | null>(null);
let retriesExhausted = $state(false);

// Track which model is being used for current streaming request
let streamingModelId = $state<string | null>(null);

// Cost tracking state
let balance = $state<number | null>(null);
let balanceLoading = $state(false);
let messageCosts = $state<Map<number, number>>(new Map());

// Fetch account balance
const refreshBalance = async () => {
  balanceLoading = true;
  try {
    const result = await fetchBalance();
    if (result) {
      balance = result.balance;
    }
  } finally {
    balanceLoading = false;
  }
};

// Load messages and costs from localStorage on mount, and fetch initial balance
onMount(() => {
  const saved = loadMessages();
  if (saved.length > 0) {
    messages = saved;
  }
  const savedCosts = loadMessageCosts();
  if (savedCosts.size > 0) {
    messageCosts = savedCosts;
  }
  refreshBalance();
});

// Auto-submit when onboarding completes
$effect(() => {
  if (autoSubmit && messages.length === 0 && onboardingContext && !isLoading) {
    // Send the greeting message with context
    handleSend("Hej! Giv mig venligst feedback på min opgave");
    onAutoSubmitComplete?.();
  }
});

// Save messages to localStorage when they change
$effect(() => {
  const currentMessages = messages;
  if (currentMessages.length > 0) {
    saveMessages(currentMessages);
  }
});

// Save costs to localStorage when they change
$effect(() => {
  const currentCosts = messageCosts;
  if (currentCosts.size > 0) {
    saveMessageCosts(currentCosts);
  }
});

const formatOnboardingContext = (ctx: OnboardingContext): string => {
  const parts = [];
  if (ctx.subject || ctx.grade) {
    parts.push(`**Fag:** ${ctx.subject}${ctx.grade ? `, ${ctx.grade}` : ""}`);
  }
  if (ctx.assignmentDescription) {
    parts.push(`**Opgave:** ${ctx.assignmentDescription}`);
  }
  // Include file content if present
  if (ctx.studentWorkFile) {
    parts.push(`[Vedhæftet fil: ${ctx.studentWorkFile.name}]\n\n${ctx.studentWorkFile.content}`);
  }
  if (ctx.studentWork) {
    parts.push(`**Mit arbejde indtil nu:**\n${ctx.studentWork}`);
  }
  parts.push(`**Vejledende karakter:** ${ctx.wantsGrade ? "Ja" : "Nej"}`);
  return parts.join("\n\n");
};

const handleSend = async (content: string) => {
  // Prevent multiple submissions while loading
  if (isLoading) return;

  const file = attachedFile;
  let fullContent = content;

  // Prepend onboarding context to first message
  if (messages.length === 0 && onboardingContext) {
    const contextText = formatOnboardingContext(onboardingContext);
    fullContent = contextText + "\n\n---\n\n" + content;
  }

  if (file) {
    fullContent = `[Attached file: ${file.name}]\n\n${file.content}\n\n---\n\n${fullContent}`;
    attachedFile = null;
  }

  const userMessage: Message = { role: "user", content: fullContent };

  // Track which model is being used for streaming indicator
  const currentModel = onboardingContext?.model ?? null;
  streamingModelId = currentModel;

  // Svelte 5 groups these updates into a single reactive cycle on its own; Solid needed an
  // explicit batch wrapper here
  messages = [...messages, userMessage];
  isLoading = true;
  streamingContent = "";

  try {
    let assistantContent = "";
    let messageUsage: TokenUsage | null = null;

    await sendMessage({
      messages: [...messages, userMessage],
      model: onboardingContext?.model,
      subject: onboardingContext?.subject,
      onChunk: (chunk) => {
        assistantContent += chunk;
        streamingContent = assistantContent;
      },
      onRetry: (attempt, max, phase, delayMs) => {
        retryState = { attempt, max, phase, delayMs };
      },
      onUsage: (usage) => {
        messageUsage = usage;
      },
    });

    // Success - clear any failed message and error state
    failedMessage = null;
    errorCategory = null;

    // Calculate index for the new assistant message
    const newMessageIndex = messages.length;
    const modelId = onboardingContext?.model;

    messages = [...messages, { role: "assistant", content: assistantContent, modelId }];

    // Store cost for this message if usage data received
    if (messageUsage !== null) {
      // Type assertion needed: TypeScript's control flow doesn't track callback assignments
      const usage = messageUsage as TokenUsage;
      const costModelId = modelId ?? "TEE/DeepSeek-v3.2";
      const costUsd = calculateCostUsd(costModelId, usage.prompt_tokens, usage.completion_tokens);

      const newMap = new Map(messageCosts);
      newMap.set(newMessageIndex, costUsd);
      messageCosts = newMap;
    }

    // Refresh balance after successful message
    refreshBalance();
  } catch (error) {
    // Store failed message for manual retry and set error category
    failedMessage = userMessage;
    if (error instanceof ApiError) {
      errorCategory = error.category;
      // Set retriesExhausted when error is not retryable (all retries failed)
      retriesExhausted = !error.retryable;
    } else {
      errorCategory = "unknown";
      retriesExhausted = true;
    }
  } finally {
    isLoading = false;
    streamingContent = "";
    retryState = null;
    streamingModelId = null;
  }
};

// Retry API call without adding new user message (for first message retry)
const retryApiCall = async (existingMessages: Message[]) => {
  if (isLoading) return;

  // Track which model is being used for streaming indicator
  const currentModel = onboardingContext?.model ?? null;
  streamingModelId = currentModel;

  isLoading = true;
  streamingContent = "";

  try {
    let assistantContent = "";
    let messageUsage: TokenUsage | null = null;

    await sendMessage({
      messages: existingMessages,
      model: onboardingContext?.model,
      subject: onboardingContext?.subject,
      onChunk: (chunk) => {
        assistantContent += chunk;
        streamingContent = assistantContent;
      },
      onRetry: (attempt, max, phase, delayMs) => {
        retryState = { attempt, max, phase, delayMs };
      },
      onUsage: (usage) => {
        messageUsage = usage;
      },
    });

    // Success - clear any failed message and error state
    failedMessage = null;
    errorCategory = null;

    // Calculate index for the new assistant message
    const newMessageIndex = messages.length;
    const modelId = onboardingContext?.model;

    messages = [...messages, { role: "assistant", content: assistantContent, modelId }];

    // Store cost for this message if usage data received
    if (messageUsage !== null) {
      const usage = messageUsage as TokenUsage;
      const costModelId = modelId ?? "TEE/DeepSeek-v3.2";
      const costUsd = calculateCostUsd(costModelId, usage.prompt_tokens, usage.completion_tokens);

      const newMap = new Map(messageCosts);
      newMap.set(newMessageIndex, costUsd);
      messageCosts = newMap;
    }

    // Refresh balance after successful message
    refreshBalance();
  } catch (error) {
    // Store failed message for manual retry (the first user message)
    const userMessage = existingMessages[0];
    if (userMessage) {
      failedMessage = userMessage;
    }
    if (error instanceof ApiError) {
      errorCategory = error.category;
      // Set retriesExhausted when error is not retryable (all retries failed)
      retriesExhausted = !error.retryable;
    } else {
      errorCategory = "unknown";
      retriesExhausted = true;
    }
  } finally {
    isLoading = false;
    streamingContent = "";
    retryState = null;
    streamingModelId = null;
  }
};

// Retry API call with a specific model override (for fallback model selection)
const retryApiCallWithModel = async (existingMessages: Message[], modelOverride: string) => {
  if (isLoading) return;

  // Track which model is being used for streaming indicator
  streamingModelId = modelOverride;

  isLoading = true;
  streamingContent = "";

  try {
    let assistantContent = "";
    let messageUsage: TokenUsage | null = null;

    await sendMessage({
      messages: existingMessages,
      model: modelOverride,
      subject: onboardingContext?.subject,
      onChunk: (chunk) => {
        assistantContent += chunk;
        streamingContent = assistantContent;
      },
      onRetry: (attempt, max, phase, delayMs) => {
        retryState = { attempt, max, phase, delayMs };
      },
      onUsage: (usage) => {
        messageUsage = usage;
      },
    });

    // Success - clear any failed message and error state
    failedMessage = null;
    errorCategory = null;
    retriesExhausted = false;

    // Calculate index for the new assistant message
    const newMessageIndex = messages.length;

    messages = [
      ...messages,
      { role: "assistant", content: assistantContent, modelId: modelOverride },
    ];

    // Store cost for this message if usage data received
    if (messageUsage !== null) {
      const usage = messageUsage as TokenUsage;
      const costUsd = calculateCostUsd(modelOverride, usage.prompt_tokens, usage.completion_tokens);

      const newMap = new Map(messageCosts);
      newMap.set(newMessageIndex, costUsd);
      messageCosts = newMap;
    }

    // Permanently update the model after successful fallback
    onModelChange?.(modelOverride);

    // Refresh balance after successful message
    refreshBalance();
  } catch (error) {
    // Store failed message for manual retry (the first user message)
    const userMessage = existingMessages[0];
    if (userMessage) {
      failedMessage = userMessage;
    }
    if (error instanceof ApiError) {
      errorCategory = error.category;
      retriesExhausted = !error.retryable;
    } else {
      errorCategory = "unknown";
      retriesExhausted = true;
    }
  } finally {
    isLoading = false;
    streamingContent = "";
    retryState = null;
    streamingModelId = null;
  }
};

const handleRetry = () => {
  const now = Date.now();
  if (now < retryDisabledUntil) return; // Rate limited

  retryDisabledUntil = now + 5000; // 5 second cooldown
  const msg = failedMessage;
  if (msg) {
    // Clear error state
    failedMessage = null;
    errorCategory = null;
    retriesExhausted = false;

    const currentMessages = messages;
    // Check if this is a first message retry (only 1 user message, no assistant response yet)
    const isFirstMessageRetry = currentMessages.length === 1 && currentMessages[0].role === "user";

    if (isFirstMessageRetry) {
      // First message retry: keep original message and retry API
      retryApiCall([currentMessages[0]]);
    } else {
      // Regular retry: resend the last user message
      handleSend(msg.content);
    }
  }
};

// Handle selection of a fallback model after retries exhausted
const handleSelectFallbackModel = (modelId: string) => {
  const now = Date.now();
  if (now < retryDisabledUntil) return; // Rate limited

  retryDisabledUntil = now + 5000; // 5 second cooldown
  const msg = failedMessage;
  if (msg) {
    // Clear error state
    failedMessage = null;
    errorCategory = null;
    retriesExhausted = false;

    const currentMessages = messages;
    // Check if this is a first message retry (only 1 user message, no assistant response yet)
    const isFirstMessageRetry = currentMessages.length === 1 && currentMessages[0].role === "user";

    if (isFirstMessageRetry) {
      // First message retry: keep original message and retry API with fallback model
      retryApiCallWithModel([currentMessages[0]], modelId);
    } else {
      // Regular retry with fallback model - we need to resend the last user message
      // But use the fallback model for this one request
      retryApiCallWithModel([...currentMessages, msg], modelId);
    }
  }
};

const handleClearConversation = () => {
  onClearOnboarding();
};
</script>

<div class="flex h-screen flex-col">
  <!-- Header -->
  <header
    class="border-border bg-card flex items-center justify-between border-b px-4 py-3 transition-colors duration-200"
  >
    <div class="flex items-center gap-2">
      <Logo size="sm" />
      <h1 class="text-lg font-semibold">{t("chat.header")}</h1>
      <!-- External links -->
      <div class="ml-2 flex items-center gap-3">
        <!-- biome-ignore-start lint/a11y/useAnchorContent: Biome 2.5.6 does not honour
             aria-label on an anchor whose only child is aria-hidden; the accessible name of
             each icon link comes from its aria-label. -->
        <a
          href="/"
          class="focus-visible:ring-ring rounded opacity-50 transition-opacity duration-200 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2"
          aria-label="EDB Pede - Homepage"
        >
          <img src="/icons/edbpede.svg" alt="" class="h-5 w-5" aria-hidden="true" />
        </a>
        <a
          href="https://github.com/edbpede/feedback"
          target="_blank"
          rel="noopener noreferrer"
          class="focus-visible:ring-ring rounded opacity-50 transition-opacity duration-200 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2"
          aria-label="GitHub Repository"
        >
          <img src="/icons/github.svg" alt="" class="h-5 w-5" aria-hidden="true" />
        </a>
        <a
          href="https://kutt.it/Hrtu2H"
          target="_blank"
          rel="noopener noreferrer"
          class="focus-visible:ring-ring rounded opacity-50 transition-opacity duration-200 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2"
          aria-label="Support/Donate"
        >
          <img src="/icons/donate.svg" alt="" class="h-5 w-5" aria-hidden="true" />
        </a>
        <a
          href="https://www.gnu.org/licenses/agpl-3.0.en.html"
          target="_blank"
          rel="noopener noreferrer"
          class="focus-visible:ring-ring rounded opacity-50 transition-opacity duration-200 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2"
          aria-label="AGPL-3.0 License"
        >
          <img src="/icons/agpl.svg" alt="" class="h-5 w-auto" aria-hidden="true" />
        </a>
        <!-- biome-ignore-end lint/a11y/useAnchorContent: end of icon-link row -->
      </div>
    </div>
    <div class="flex items-center gap-2">
      <BalanceDisplay balanceUsd={balance} isLoading={balanceLoading} />
      <ThemeSwitcher />
      <LanguageSwitcher />
      {#if onboardingContext}
        <Button
          variant="secondary"
          size="sm"
          onclick={() => onEditContext()}
          title={t("chat.editContext")}
        >
          <span class="i-carbon-edit mr-1"></span>{t("chat.editContext")}
        </Button>
      {/if}
      <Button variant="secondary" size="sm" onclick={handleClearConversation}>
        <span class="i-carbon-trash-can mr-1"></span>{t("chat.clearButton")}
      </Button>
      <Button variant="secondary" size="sm" onclick={() => onLogout()}>
        <span class="i-carbon-logout mr-1"></span>{t("chat.logoutButton")}
      </Button>
    </div>
  </header>

  <!-- Retry indicator banner -->
  {#if retryState}
    <div
      class="text-muted-foreground bg-muted/50 border-border flex animate-pulse items-center gap-2 border-b px-4 py-2 text-sm"
    >
      <!-- Spacing is load-bearing: the Solid source had the label flush against the span and an
           explicit JSX {" "} before "(". Keep {#if} on the </span> line and "(" on its own line. -->
      <span class="i-carbon-connection-signal"></span>{#if retryState!.phase === "quick"}{t(
          "chat.retryingQuick"
        )}{:else}{t("chat.retryingBackoff", {
          seconds: String(Math.round(retryState!.delayMs / 1000)),
        })}{/if}
      ({retryState!.attempt}/{retryState!.max})
    </div>
  {/if}

  <!-- Messages -->
  <MessageList
    {messages}
    {streamingContent}
    {isLoading}
    {errorCategory}
    canRetry={!!failedMessage}
    retryDisabled={Date.now() < retryDisabledUntil}
    onRetry={handleRetry}
    modelId={onboardingContext?.model}
    {streamingModelId}
    {messageCosts}
    showFallbackSelector={retriesExhausted}
    failedModelId={onboardingContext?.model}
    subject={onboardingContext?.subject}
    onSelectFallbackModel={handleSelectFallbackModel}
  />

  <!-- File Upload -->
  <FileUpload
    currentFile={attachedFile}
    onFileProcessed={(file) => {
      attachedFile = file;
    }}
    onClear={() => {
      attachedFile = null;
    }}
  />

  <!-- Input -->
  <ChatInput onSend={handleSend} disabled={isLoading} />
</div>
