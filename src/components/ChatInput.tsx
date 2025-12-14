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
      class="border-border bg-card border-t p-4 transition-colors duration-200"
    >
      <div class="flex gap-2">
        <Textarea
          value={message()}
          onInput={(e) => setMessage(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("chat.inputPlaceholder")}
          class="max-h-32 min-h-[44px] flex-1 resize-none"
          rows="1"
          disabled={props.disabled}
        />
        <Button
          type="submit"
          size="icon"
          class="h-11 w-11 shrink-0 self-end"
          disabled={props.disabled || !message().trim()}
        >
          <span class="i-carbon-send text-lg" />
        </Button>
      </div>
    </form>
  );
};
