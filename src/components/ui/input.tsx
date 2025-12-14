import type { Component, JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "@lib/utils";

export interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {}

const Input: Component<InputProps> = (props) => {
  const [local, others] = splitProps(props, ["class", "type"]);
  return (
    <input
      type={local.type}
      class={cn(
        "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        local.class
      )}
      {...others}
    />
  );
};

export { Input };
