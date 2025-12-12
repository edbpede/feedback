import type { Component } from "solid-js";
import type { Message } from "@lib/types";

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: Component<MessageBubbleProps> = (props) => {
  // Derived value - access props.message.role reactively
  const isUser = () => props.message.role === "user";

  return (
    <div class={`flex ${isUser() ? "justify-end" : "justify-start"}`}>
      <div
        class={`max-w-[80%] rounded-lg px-4 py-2 whitespace-pre-wrap break-words ${
          isUser()
            ? "bg-blue-600 text-white"
            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        }`}
      >
        {props.message.content}
      </div>
    </div>
  );
};
