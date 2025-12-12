import {
  createSignal,
  createEffect,
  onMount,
  batch,
  type Component,
} from "solid-js";
import { MessageList } from "@components/MessageList";
import { ChatInput } from "@components/ChatInput";
import { FileUpload } from "@components/FileUpload";
import { loadMessages, saveMessages, clearMessages } from "@lib/storage";
import { sendMessage } from "@lib/api";
import type { Message } from "@lib/types";

interface ChatWindowProps {
  onLogout: () => void;
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

  // Save messages to localStorage when they change
  createEffect(() => {
    const currentMessages = messages();
    if (currentMessages.length > 0) {
      saveMessages(currentMessages);
    }
  });

  const handleSend = async (content: string) => {
    const file = attachedFile();
    let fullContent = content;

    if (file) {
      fullContent = `[Attached file: ${file.name}]\n\n${file.content}\n\n---\n\n${content}`;
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
          content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
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
    clearMessages();
    setMessages([]);
  };

  return (
    <div class="flex flex-col h-screen">
      {/* Header */}
      <header class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h1 class="text-lg font-semibold">Student Feedback Bot</h1>
        <div class="flex gap-2">
          <button
            type="button"
            onClick={handleClearConversation}
            class="btn-secondary text-sm"
          >
            <span class="i-carbon-trash-can mr-1" />
            Clear
          </button>
          <button
            type="button"
            onClick={() => props.onLogout()}
            class="btn-secondary text-sm"
          >
            <span class="i-carbon-logout mr-1" />
            Logout
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
