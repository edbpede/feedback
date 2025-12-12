import { createSignal, Show, type Component } from "solid-js";
import { marked, type Tokens } from "marked";
import hljs from "highlight.js";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@components/ui/collapsible";
import { t } from "@lib/i18n";
import type { Message } from "@lib/types";

// Configure marked with syntax highlighting via custom renderer
const renderer = new marked.Renderer();
renderer.code = ({ text, lang }: Tokens.Code) => {
  const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
  const highlighted = hljs.highlight(text, { language }).value;
  return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
};

marked.setOptions({
  breaks: true,
  gfm: true,
  renderer,
});

interface MessageBubbleProps {
  message: Message;
  isCollapsible?: boolean;
}

export const MessageBubble: Component<MessageBubbleProps> = (props) => {
  const isUser = () => props.message.role === "user";
  const htmlContent = () => marked.parse(props.message.content) as string;
  const [expanded, setExpanded] = createSignal(false);

  const messageContent = (
    <div
      class={`max-w-[80%] rounded-lg px-4 py-2 break-words transition-colors duration-200 prose prose-sm ${
        isUser()
          ? "bg-primary text-primary-foreground prose-invert"
          : "bg-muted text-foreground"
      }`}
      innerHTML={htmlContent()}
    />
  );

  return (
    <div class={`flex ${isUser() ? "justify-end" : "justify-start"}`}>
      <Show
        when={props.isCollapsible}
        fallback={messageContent}
      >
        <Collapsible open={expanded()} onOpenChange={setExpanded} class="max-w-[80%]">
          <CollapsibleTrigger
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            <span
              class="i-carbon-chevron-right transition-transform duration-200"
              classList={{ "rotate-90": expanded() }}
            />
            <span class="text-sm">
              {expanded() ? t("chat.hideInitialFeedback") : t("chat.showInitialFeedback")}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent class="mt-2">
            {messageContent}
          </CollapsibleContent>
        </Collapsible>
      </Show>
    </div>
  );
};
