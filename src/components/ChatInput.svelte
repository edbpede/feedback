<script lang="ts">
import { Button, Textarea } from "@components/ui";
import { t } from "@lib/i18n";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

let { onSend, disabled }: ChatInputProps = $props();

let message = $state("");

const handleSubmit = (e: Event) => {
  e.preventDefault();
  const trimmed = message.trim();
  if (trimmed && !disabled) {
    onSend(trimmed);
    message = "";
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    handleSubmit(e);
  }
};
</script>

<form
  onsubmit={handleSubmit}
  class="border-border bg-card border-t p-4 transition-colors duration-200"
>
  <div class="flex gap-2">
    <Textarea
      value={message}
      oninput={(e) => {
        message = e.currentTarget.value;
      }}
      onkeydown={handleKeyDown}
      placeholder={t("chat.inputPlaceholder")}
      class="max-h-32 min-h-[44px] flex-1 resize-none"
      rows={1}
      {disabled}
    />
    <Button
      type="submit"
      size="icon"
      class="h-11 w-11 shrink-0 self-end"
      disabled={disabled || !message.trim()}
    >
      <span class="i-carbon-send text-lg"></span>
    </Button>
  </div>
</form>
