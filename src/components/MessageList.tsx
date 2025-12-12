import { For, Show, createEffect, type Component } from "solid-js";
import { MessageBubble } from "@components/MessageBubble";
import type { Message } from "@lib/types";

interface MessageListProps {
  messages: Message[];
  streamingContent: string;
  isLoading: boolean;
}

export const MessageList: Component<MessageListProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;

  // Auto-scroll to bottom when messages change
  createEffect(() => {
    // Access reactive props to track them
    props.messages.length;
    props.streamingContent;

    if (containerRef) {
      containerRef.scrollTop = containerRef.scrollHeight;
    }
  });

  return (
    <div
      ref={containerRef}
      class="flex-1 overflow-y-auto p-4 space-y-4"
    >
      <Show
        when={props.messages.length > 0}
        fallback={
          <div class="text-center text-gray-500 dark:text-gray-400 mt-8">
            <p class="text-lg mb-2">Welcome!</p>
            <p class="text-sm">
              Upload your assignment and ask for feedback.
            </p>
          </div>
        }
      >
        {/* Use <For> for keyed lists - gives stable references and fine-grained DOM updates */}
        <For each={props.messages}>
          {(message) => <MessageBubble message={message} />}
        </For>
      </Show>

      {/* Streaming message */}
      <Show when={props.streamingContent}>
        <MessageBubble
          message={{ role: "assistant", content: props.streamingContent }}
        />
      </Show>

      {/* Loading indicator */}
      <Show when={props.isLoading && !props.streamingContent}>
        <div class="flex justify-start">
          <div class="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
            <span class="i-carbon-loading animate-spin" />
          </div>
        </div>
      </Show>
    </div>
  );
};
