import { createSignal, createEffect, onMount, batch, Show, type Component } from "solid-js";
import { MessageList } from "@components/MessageList";
import { ChatInput } from "@components/ChatInput";
import { FileUpload } from "@components/FileUpload";
import { LanguageSwitcher } from "@components/LanguageSwitcher";
import { ThemeSwitcher } from "@components/ThemeSwitcher";
import { Logo } from "@components/Logo";
import { Button } from "@components/ui/button";
import { loadMessages, saveMessages, loadMessageCosts, saveMessageCosts } from "@lib/storage";
import { sendMessage, fetchBalance, type RetryPhase } from "@lib/api";
import { t } from "@lib/i18n";
import { calculateCostUsd } from "@config/pricing";
import { BalanceDisplay } from "@components/BalanceDisplay";
import { ApiError, type ErrorCategory } from "@lib/errorUtils";
import type { Message, OnboardingContext, TokenUsage } from "@lib/types";

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

export const ChatWindow: Component<ChatWindowProps> = (props) => {
  const [messages, setMessages] = createSignal<Message[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [attachedFile, setAttachedFile] = createSignal<AttachedFile | null>(null);
  const [streamingContent, setStreamingContent] = createSignal("");

  // Retry state with phase and delay info
  const [retryState, setRetryState] = createSignal<{
    attempt: number;
    max: number;
    phase: RetryPhase;
    delayMs: number;
  } | null>(null);
  const [failedMessage, setFailedMessage] = createSignal<Message | null>(null);
  const [retryDisabledUntil, setRetryDisabledUntil] = createSignal<number>(0);
  const [errorCategory, setErrorCategory] = createSignal<ErrorCategory | null>(null);
  const [retriesExhausted, setRetriesExhausted] = createSignal(false);

  // Track which model is being used for current streaming request
  const [streamingModelId, setStreamingModelId] = createSignal<string | null>(null);

  // Cost tracking state
  const [balance, setBalance] = createSignal<number | null>(null);
  const [balanceLoading, setBalanceLoading] = createSignal(false);
  const [messageCosts, setMessageCosts] = createSignal<Map<number, number>>(new Map());

  // Fetch account balance
  const refreshBalance = async () => {
    setBalanceLoading(true);
    try {
      const result = await fetchBalance();
      if (result) {
        setBalance(result.balance);
      }
    } finally {
      setBalanceLoading(false);
    }
  };

  // Load messages and costs from localStorage on mount, and fetch initial balance
  onMount(() => {
    const saved = loadMessages();
    if (saved.length > 0) {
      setMessages(saved);
    }
    const savedCosts = loadMessageCosts();
    if (savedCosts.size > 0) {
      setMessageCosts(savedCosts);
    }
    refreshBalance();
  });

  // Auto-submit when onboarding completes
  createEffect(() => {
    if (props.autoSubmit && messages().length === 0 && props.onboardingContext && !isLoading()) {
      // Send the greeting message with context
      handleSend("Hej! Giv mig venligst feedback på min opgave");
      props.onAutoSubmitComplete?.();
    }
  });

  // Save messages to localStorage when they change
  createEffect(() => {
    const currentMessages = messages();
    if (currentMessages.length > 0) {
      saveMessages(currentMessages);
    }
  });

  // Save costs to localStorage when they change
  createEffect(() => {
    const currentCosts = messageCosts();
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
    if (isLoading()) return;

    const file = attachedFile();
    let fullContent = content;

    // Prepend onboarding context to first message
    if (messages().length === 0 && props.onboardingContext) {
      const contextText = formatOnboardingContext(props.onboardingContext);
      fullContent = contextText + "\n\n---\n\n" + content;
    }

    if (file) {
      fullContent = `[Attached file: ${file.name}]\n\n${file.content}\n\n---\n\n${fullContent}`;
      setAttachedFile(null);
    }

    const userMessage: Message = { role: "user", content: fullContent };

    // Track which model is being used for streaming indicator
    const currentModel = props.onboardingContext?.model ?? null;
    setStreamingModelId(currentModel);

    // Use batch() to group multiple signal updates into single reactive cycle
    batch(() => {
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamingContent("");
    });

    try {
      let assistantContent = "";
      let messageUsage: TokenUsage | null = null;

      await sendMessage({
        messages: [...messages(), userMessage],
        model: props.onboardingContext?.model,
        subject: props.onboardingContext?.subject,
        onChunk: (chunk) => {
          assistantContent += chunk;
          setStreamingContent(assistantContent);
        },
        onRetry: (attempt, max, phase, delayMs) => {
          setRetryState({ attempt, max, phase, delayMs });
        },
        onUsage: (usage) => {
          messageUsage = usage;
        },
      });

      // Success - clear any failed message and error state
      setFailedMessage(null);
      setErrorCategory(null);

      // Calculate index for the new assistant message
      const newMessageIndex = messages().length;
      const modelId = props.onboardingContext?.model;

      setMessages((prev) => [...prev, { role: "assistant", content: assistantContent, modelId }]);

      // Store cost for this message if usage data received
      if (messageUsage !== null) {
        // Type assertion needed: TypeScript's control flow doesn't track callback assignments
        const usage = messageUsage as TokenUsage;
        const costModelId = modelId ?? "TEE/DeepSeek-v3.2";
        const costUsd = calculateCostUsd(costModelId, usage.prompt_tokens, usage.completion_tokens);

        setMessageCosts((prev) => {
          const newMap = new Map(prev);
          newMap.set(newMessageIndex, costUsd);
          return newMap;
        });
      }

      // Refresh balance after successful message
      refreshBalance();
    } catch (error) {
      // Store failed message for manual retry and set error category
      setFailedMessage(userMessage);
      if (error instanceof ApiError) {
        setErrorCategory(error.category);
        // Set retriesExhausted when error is not retryable (all retries failed)
        setRetriesExhausted(!error.retryable);
      } else {
        setErrorCategory("unknown");
        setRetriesExhausted(true);
      }
    } finally {
      batch(() => {
        setIsLoading(false);
        setStreamingContent("");
        setRetryState(null);
        setStreamingModelId(null);
      });
    }
  };

  // Retry API call without adding new user message (for first message retry)
  const retryApiCall = async (existingMessages: Message[]) => {
    if (isLoading()) return;

    // Track which model is being used for streaming indicator
    const currentModel = props.onboardingContext?.model ?? null;
    setStreamingModelId(currentModel);

    batch(() => {
      setIsLoading(true);
      setStreamingContent("");
    });

    try {
      let assistantContent = "";
      let messageUsage: TokenUsage | null = null;

      await sendMessage({
        messages: existingMessages,
        model: props.onboardingContext?.model,
        subject: props.onboardingContext?.subject,
        onChunk: (chunk) => {
          assistantContent += chunk;
          setStreamingContent(assistantContent);
        },
        onRetry: (attempt, max, phase, delayMs) => {
          setRetryState({ attempt, max, phase, delayMs });
        },
        onUsage: (usage) => {
          messageUsage = usage;
        },
      });

      // Success - clear any failed message and error state
      setFailedMessage(null);
      setErrorCategory(null);

      // Calculate index for the new assistant message
      const newMessageIndex = messages().length;
      const modelId = props.onboardingContext?.model;

      setMessages((prev) => [...prev, { role: "assistant", content: assistantContent, modelId }]);

      // Store cost for this message if usage data received
      if (messageUsage !== null) {
        const usage = messageUsage as TokenUsage;
        const costModelId = modelId ?? "TEE/DeepSeek-v3.2";
        const costUsd = calculateCostUsd(costModelId, usage.prompt_tokens, usage.completion_tokens);

        setMessageCosts((prev) => {
          const newMap = new Map(prev);
          newMap.set(newMessageIndex, costUsd);
          return newMap;
        });
      }

      // Refresh balance after successful message
      refreshBalance();
    } catch (error) {
      // Store failed message for manual retry (the first user message)
      const userMessage = existingMessages[0];
      if (userMessage) {
        setFailedMessage(userMessage);
      }
      if (error instanceof ApiError) {
        setErrorCategory(error.category);
        // Set retriesExhausted when error is not retryable (all retries failed)
        setRetriesExhausted(!error.retryable);
      } else {
        setErrorCategory("unknown");
        setRetriesExhausted(true);
      }
    } finally {
      batch(() => {
        setIsLoading(false);
        setStreamingContent("");
        setRetryState(null);
        setStreamingModelId(null);
      });
    }
  };

  // Retry API call with a specific model override (for fallback model selection)
  const retryApiCallWithModel = async (existingMessages: Message[], modelOverride: string) => {
    if (isLoading()) return;

    // Track which model is being used for streaming indicator
    setStreamingModelId(modelOverride);

    batch(() => {
      setIsLoading(true);
      setStreamingContent("");
    });

    try {
      let assistantContent = "";
      let messageUsage: TokenUsage | null = null;

      await sendMessage({
        messages: existingMessages,
        model: modelOverride,
        subject: props.onboardingContext?.subject,
        onChunk: (chunk) => {
          assistantContent += chunk;
          setStreamingContent(assistantContent);
        },
        onRetry: (attempt, max, phase, delayMs) => {
          setRetryState({ attempt, max, phase, delayMs });
        },
        onUsage: (usage) => {
          messageUsage = usage;
        },
      });

      // Success - clear any failed message and error state
      setFailedMessage(null);
      setErrorCategory(null);
      setRetriesExhausted(false);

      // Calculate index for the new assistant message
      const newMessageIndex = messages().length;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantContent, modelId: modelOverride },
      ]);

      // Store cost for this message if usage data received
      if (messageUsage !== null) {
        const usage = messageUsage as TokenUsage;
        const costUsd = calculateCostUsd(
          modelOverride,
          usage.prompt_tokens,
          usage.completion_tokens
        );

        setMessageCosts((prev) => {
          const newMap = new Map(prev);
          newMap.set(newMessageIndex, costUsd);
          return newMap;
        });
      }

      // Permanently update the model after successful fallback
      props.onModelChange?.(modelOverride);

      // Refresh balance after successful message
      refreshBalance();
    } catch (error) {
      // Store failed message for manual retry (the first user message)
      const userMessage = existingMessages[0];
      if (userMessage) {
        setFailedMessage(userMessage);
      }
      if (error instanceof ApiError) {
        setErrorCategory(error.category);
        setRetriesExhausted(!error.retryable);
      } else {
        setErrorCategory("unknown");
        setRetriesExhausted(true);
      }
    } finally {
      batch(() => {
        setIsLoading(false);
        setStreamingContent("");
        setRetryState(null);
        setStreamingModelId(null);
      });
    }
  };

  const handleRetry = () => {
    const now = Date.now();
    if (now < retryDisabledUntil()) return; // Rate limited

    setRetryDisabledUntil(now + 5000); // 5 second cooldown
    const msg = failedMessage();
    if (msg) {
      // Clear error state
      setFailedMessage(null);
      setErrorCategory(null);
      setRetriesExhausted(false);

      const currentMessages = messages();
      // Check if this is a first message retry (only 1 user message, no assistant response yet)
      const isFirstMessageRetry =
        currentMessages.length === 1 && currentMessages[0].role === "user";

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
    if (now < retryDisabledUntil()) return; // Rate limited

    setRetryDisabledUntil(now + 5000); // 5 second cooldown
    const msg = failedMessage();
    if (msg) {
      // Clear error state
      setFailedMessage(null);
      setErrorCategory(null);
      setRetriesExhausted(false);

      const currentMessages = messages();
      // Check if this is a first message retry (only 1 user message, no assistant response yet)
      const isFirstMessageRetry =
        currentMessages.length === 1 && currentMessages[0].role === "user";

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
    props.onClearOnboarding();
  };

  return (
    <div class="flex h-screen flex-col">
      {/* Header */}
      <header class="border-border bg-card flex items-center justify-between border-b px-4 py-3 transition-colors duration-200">
        <div class="flex items-center gap-2">
          <Logo size="sm" />
          <h1 class="text-lg font-semibold">{t("chat.header")}</h1>
          {/* External links */}
          <div class="ml-2 flex items-center gap-3">
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
          </div>
        </div>
        <div class="flex items-center gap-2">
          <BalanceDisplay balanceUsd={balance()} isLoading={balanceLoading()} />
          <ThemeSwitcher />
          <LanguageSwitcher />
          <Show when={props.onboardingContext}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => props.onEditContext()}
              title={t("chat.editContext")}
            >
              <span class="i-carbon-edit mr-1" />
              {t("chat.editContext")}
            </Button>
          </Show>
          <Button variant="secondary" size="sm" onClick={handleClearConversation}>
            <span class="i-carbon-trash-can mr-1" />
            {t("chat.clearButton")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => props.onLogout()}>
            <span class="i-carbon-logout mr-1" />
            {t("chat.logoutButton")}
          </Button>
        </div>
      </header>

      {/* Retry indicator banner */}
      <Show when={retryState()}>
        <div class="text-muted-foreground bg-muted/50 border-border flex animate-pulse items-center gap-2 border-b px-4 py-2 text-sm">
          <span class="i-carbon-connection-signal" />
          <Show
            when={retryState()!.phase === "quick"}
            fallback={t("chat.retryingBackoff", {
              seconds: String(Math.round(retryState()!.delayMs / 1000)),
            })}
          >
            {t("chat.retryingQuick")}
          </Show>{" "}
          ({retryState()!.attempt}/{retryState()!.max})
        </div>
      </Show>

      {/* Messages */}
      <MessageList
        messages={messages()}
        streamingContent={streamingContent()}
        isLoading={isLoading()}
        errorCategory={errorCategory()}
        canRetry={!!failedMessage()}
        retryDisabled={Date.now() < retryDisabledUntil()}
        onRetry={handleRetry}
        modelId={props.onboardingContext?.model}
        streamingModelId={streamingModelId()}
        messageCosts={messageCosts()}
        showFallbackSelector={retriesExhausted()}
        failedModelId={props.onboardingContext?.model}
        subject={props.onboardingContext?.subject}
        onSelectFallbackModel={handleSelectFallbackModel}
      />

      {/* File Upload */}
      <FileUpload
        currentFile={attachedFile()}
        onFileProcessed={setAttachedFile}
        onClear={() => setAttachedFile(null)}
      />

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading()} />
    </div>
  );
};
