import { createSignal, type Component } from "solid-js";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export const ChatInput: Component<ChatInputProps> = (props) => {
  const [message, setMessage] = createSignal("");

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const trimmed = message().trim();
    if (trimmed && !props.disabled) {
      props.onSend(trimmed);
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      class="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800"
    >
      <div class="flex gap-2">
        <textarea
          value={message()}
          onInput={(e) => setMessage(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Ctrl+Enter to send)"
          class="input-base flex-1 resize-none min-h-[44px] max-h-32"
          rows="1"
          disabled={props.disabled}
        />
        <button
          type="submit"
          class="btn-primary self-end"
          disabled={props.disabled || !message().trim()}
        >
          <span class="i-carbon-send" />
        </button>
      </div>
    </form>
  );
};
