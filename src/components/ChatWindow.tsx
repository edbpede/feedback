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
import { loadMessages, saveMessages, clearMessages } from "@lib/storage";
import { sendMessage } from "@lib/api";
import { t } from "@lib/i18n";
import type { Message, OnboardingContext } from "@lib/types";

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

  // Load messages from localStorage on mount
  onMount(() => {
    const saved = loadMessages();
    if (saved.length > 0) {
      setMessages(saved);
    }
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

      await sendMessage([...messages(), userMessage], (chunk) => {
        assistantContent += chunk;
        setStreamingContent(assistantContent);
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantContent },
      ]);
    } catch (error) {
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
      });
    }
  };

  const handleClearConversation = () => {
    props.onClearOnboarding();
  };

  return (
    <div class="flex flex-col h-screen">
      {/* Header */}
      <header class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-200">
        <h1 class="text-lg font-semibold">{t("chat.header")}</h1>
        <div class="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
          <Show when={props.onboardingContext}>
            <button
              type="button"
              onClick={() => props.onEditContext()}
              class="btn-secondary text-sm"
              title={t("chat.editContext")}
            >
              <span class="i-carbon-edit mr-1" />
              {t("chat.editContext")}
            </button>
          </Show>
          <button
            type="button"
            onClick={handleClearConversation}
            class="btn-secondary text-sm"
          >
            <span class="i-carbon-trash-can mr-1" />
            {t("chat.clearButton")}
          </button>
          <button
            type="button"
            onClick={() => props.onLogout()}
            class="btn-secondary text-sm"
          >
            <span class="i-carbon-logout mr-1" />
            {t("chat.logoutButton")}
          </button>
        </div>
      </header>

      {/* Messages */}
      <MessageList
        messages={messages()}
        streamingContent={streamingContent()}
        isLoading={isLoading()}
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
