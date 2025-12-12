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
      class={`rounded-lg break-words transition-colors duration-200 ${
        isUser()
          ? "max-w-[80%] px-4 py-2 prose prose-sm bg-primary text-primary-foreground prose-invert"
          : "max-w-[65ch] px-5 py-4 prose prose-ai bg-muted text-foreground"
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
        <Collapsible open={expanded()} onOpenChange={setExpanded} class="max-w-[80%] flex flex-col items-end">
          <CollapsibleTrigger
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/80 text-primary-foreground hover:bg-primary transition-colors"
          >
            <span
              class="i-carbon-chevron-right transition-transform duration-200"
              classList={{ "rotate-90": expanded() }}
            />
            <span class="text-sm">
              {expanded() ? t("chat.hideInitialRequest") : t("chat.showInitialRequest")}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent class="mt-2 w-full flex justify-end">
            {messageContent}
          </CollapsibleContent>
        </Collapsible>
      </Show>
    </div>
  );
};
