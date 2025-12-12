import type { Component, JSX, ParentComponent } from "solid-js";
import { splitProps } from "solid-js";
import { Collapsible as CollapsiblePrimitive } from "@kobalte/core/collapsible";
import { cn } from "@lib/utils";

const Collapsible = CollapsiblePrimitive;

interface CollapsibleTriggerProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  class?: string;
}

const CollapsibleTrigger: ParentComponent<CollapsibleTriggerProps> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <CollapsiblePrimitive.Trigger
      class={cn(
        "flex items-center gap-2 text-sm font-medium transition-colors",
        "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        local.class
      )}
      {...others}
    >
      {local.children}
    </CollapsiblePrimitive.Trigger>
  );
};

interface CollapsibleContentProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string;
}

const CollapsibleContent: ParentComponent<CollapsibleContentProps> = (props) => {
  const [local, others] = splitProps(props, ["class", "children"]);
  return (
    <CollapsiblePrimitive.Content
      class={cn(
        "overflow-hidden transition-all data-[expanded]:animate-collapsible-down data-[closed]:animate-collapsible-up",
        local.class
      )}
      {...others}
    >
      {local.children}
    </CollapsiblePrimitive.Content>
  );
};

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
