import type { JSX, ParentComponent } from "solid-js";
import { splitProps } from "solid-js";
import { Tooltip as TooltipPrimitive } from "@kobalte/core/tooltip";
import { cn } from "@lib/utils";

const Tooltip = TooltipPrimitive;

const TooltipTrigger = TooltipPrimitive.Trigger;

interface TooltipContentProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
}

const TooltipContent: ParentComponent<TooltipContentProps> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        class={cn(
          "border-border bg-popover text-popover-foreground z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-md",
          "animate-in fade-in-0 zoom-in-95",
          "data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95",
          local.class
        )}
        {...others}
      >
        {local.children}
        <TooltipPrimitive.Arrow />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
};

export { Tooltip, TooltipTrigger, TooltipContent };
