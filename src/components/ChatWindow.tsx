import {
  createSignal,
  createEffect,
  onMount,
  batch,
  Show,
  type Component,
} from "solid-js";
import { MessageList } from "@components/MessageList";
import { ChatInput } from "@components/ChatInput";
import { FileUpload } from "@components/FileUpload";
import { LanguageSwitcher } from "@components/LanguageSwitcher";
import { ThemeSwitcher } from "@components/ThemeSwitcher";
import { Logo } from "@components/Logo";
import { Button } from "@components/ui/button";
import {
  loadMessages,
  saveMessages,
  loadMessageCosts,
  saveMessageCosts,
} from "@lib/storage";
import { sendMessage, fetchBalance } from "@lib/api";
import { t } from "@lib/i18n";
import { calculateCostUsd } from "@config/pricing";
import { BalanceDisplay } from "@components/BalanceDisplay";
import type { Message, OnboardingContext, TokenUsage } from "@lib/types";

interface ChatWindowProps {
  onLogout: () => void;
  onboardingContext: OnboardingContext | null;
  onClearOnboarding: () => void;
  onEditContext: () => void;
  autoSubmit?: boolean;
  onAutoSubmitComplete?: () => void;
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

  // Retry state
  const [retryState, setRetryState] = createSignal<{ attempt: number; max: number } | null>(null);
  const [failedMessage, setFailedMessage] = createSignal<Message | null>(null);
  const [retryDisabledUntil, setRetryDisabledUntil] = createSignal<number>(0);

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
        onChunk: (chunk) => {
          assistantContent += chunk;
          setStreamingContent(assistantContent);
        },
        onRetry: (attempt, max) => {
          setRetryState({ attempt, max });
        },
        onUsage: (usage) => {
          messageUsage = usage;
        },
      });

      // Success - clear any failed message state
      setFailedMessage(null);

      // Calculate index for the new assistant message
      const newMessageIndex = messages().length;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantContent },
      ]);

      // Store cost for this message if usage data received
      if (messageUsage !== null) {
        // Type assertion needed: TypeScript's control flow doesn't track callback assignments
        const usage = messageUsage as TokenUsage;
        const modelId = props.onboardingContext?.model ?? "TEE/DeepSeek-v3.2";
        const costUsd = calculateCostUsd(
          modelId,
          usage.prompt_tokens,
          usage.completion_tokens
        );

        setMessageCosts((prev) => {
          const newMap = new Map(prev);
          newMap.set(newMessageIndex, costUsd);
          return newMap;
        });
      }

      // Refresh balance after successful message
      refreshBalance();
    } catch (error) {
      // Store failed message for manual retry
      setFailedMessage(userMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `${t("chat.errorPrefix")} ${error instanceof Error ? error.message : t("chat.failedToGetResponse")}`,
        },
      ]);
    } finally {
      batch(() => {
        setIsLoading(false);
        setStreamingContent("");
        setRetryState(null);
      });
    }
  };

  const handleRetry = () => {
    const now = Date.now();
    if (now < retryDisabledUntil()) return; // Rate limited

    setRetryDisabledUntil(now + 5000); // 5 second cooldown
    const msg = failedMessage();
    if (msg) {
      setFailedMessage(null);
      // Remove last error message and retry
      setMessages((prev) => prev.slice(0, -1));
      // Re-send the original message content
      handleSend(msg.content);
    }
  };

  const handleClearConversation = () => {
    props.onClearOnboarding();
  };

  return (
    <div class="flex flex-col h-screen">
      {/* Header */}
      <header class="flex items-center justify-between px-4 py-3 border-b border-border bg-card transition-colors duration-200">
        <div class="flex items-center gap-2">
          <Logo size="sm" />
          <h1 class="text-lg font-semibold">{t("chat.header")}</h1>
        </div>
        <div class="flex items-center gap-2">
          <BalanceDisplay
            balanceUsd={balance()}
            isLoading={balanceLoading()}
          />
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
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClearConversation}
          >
            <span class="i-carbon-trash-can mr-1" />
            {t("chat.clearButton")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => props.onLogout()}
          >
            <span class="i-carbon-logout mr-1" />
            {t("chat.logoutButton")}
          </Button>
        </div>
      </header>

      {/* Retry indicator banner */}
      <Show when={retryState()}>
        <div class="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground bg-muted/50 border-b border-border animate-pulse">
          <span class="i-carbon-connection-signal" />
          {t("chat.reconnecting")} ({retryState()!.attempt}/{retryState()!.max})
        </div>
      </Show>

      {/* Messages */}
      <MessageList
        messages={messages()}
        streamingContent={streamingContent()}
        isLoading={isLoading()}
        canRetry={!!failedMessage()}
        retryDisabled={Date.now() < retryDisabledUntil()}
        onRetry={handleRetry}
        modelId={props.onboardingContext?.model}
        messageCosts={messageCosts()}
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
