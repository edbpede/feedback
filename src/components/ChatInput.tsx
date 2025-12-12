import { createSignal, type Component } from "solid-js";
import { t } from "@lib/i18n";
import { Textarea } from "@components/ui/textarea";
import { Button } from "@components/ui/button";

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
      class="border-t border-border p-4 bg-card transition-colors duration-200"
    >
      <div class="flex gap-2">
        <Textarea
          value={message()}
          onInput={(e) => setMessage(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("chat.inputPlaceholder")}
          class="flex-1 resize-none min-h-[44px] max-h-32"
          rows="1"
          disabled={props.disabled}
        />
        <Button
          type="submit"
          size="icon"
          class="self-end h-11 w-11 shrink-0"
          disabled={props.disabled || !message().trim()}
        >
          <span class="i-carbon-send text-lg" />
        </Button>
      </div>
    </form>
  );
};
