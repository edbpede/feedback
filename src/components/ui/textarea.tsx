import type { Component, JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@lib/utils";

export interface TextareaProps extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea: Component<TextareaProps> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <textarea
      class={cn(
        "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        local.class
      )}
      {...others}
    />
  );
};

export { Textarea };
