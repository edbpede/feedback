import { createSignal, Show, type Component } from "solid-js";
import { marked, type Tokens } from "marked";
// Import only hljs core and common languages for educational context
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import plaintext from "highlight.js/lib/languages/plaintext";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@components/ui/collapsible";
import { AIProviderLogo } from "@components/AIProviderLogo";
import { t } from "@lib/i18n";
import { getModelById } from "@config/models";
import type { Message } from "@lib/types";

// Register only needed languages for educational context (grades 7-9)
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("json", json);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("md", markdown);
hljs.registerLanguage("plaintext", plaintext);
hljs.registerLanguage("text", plaintext);

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
  /** Model ID for displaying provider logo on assistant messages */
  modelId?: string;
}

export const MessageBubble: Component<MessageBubbleProps> = (props) => {
  const isUser = () => props.message.role === "user";
  const htmlContent = () => marked.parse(props.message.content) as string;
  const [expanded, setExpanded] = createSignal(false);

  // Get provider from model ID for logo display
  const provider = () => {
    if (!props.modelId) return null;
    const model = getModelById(props.modelId);
    return model?.provider ?? null;
  };

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

  // Fallback for non-collapsible messages (with logo for assistant)
  const regularMessage = (
    <>
      <Show when={!isUser() && provider()}>
        <div class="flex-shrink-0 mt-1">
          <AIProviderLogo provider={provider()!} size="sm" class="opacity-60" />
        </div>
      </Show>
      {messageContent}
    </>
  );

  return (
    <div class={`flex ${isUser() ? "justify-end" : "justify-start gap-2"}`}>
      <Show
        when={props.isCollapsible}
        fallback={regularMessage}
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
