import type { Component } from "solid-js";
import { marked, type Tokens } from "marked";
import hljs from "highlight.js";
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
}

export const MessageBubble: Component<MessageBubbleProps> = (props) => {
  const isUser = () => props.message.role === "user";
  const htmlContent = () => marked.parse(props.message.content) as string;

  return (
    <div class={`flex ${isUser() ? "justify-end" : "justify-start"}`}>
      <div
        class={`max-w-[80%] rounded-lg px-4 py-2 break-words transition-colors duration-200 prose prose-sm ${
          isUser()
            ? "bg-blue-600 text-white prose-invert"
            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        }`}
        innerHTML={htmlContent()}
      />
    </div>
  );
};
