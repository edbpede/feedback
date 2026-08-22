<script lang="ts">
import { cn } from "@lib/utils";
import { Collapsible as CollapsiblePrimitive } from "bits-ui";
import type { CollapsibleTriggerProps } from "bits-ui";

let { class: className, children, ...rest }: CollapsibleTriggerProps = $props();
</script>

<CollapsiblePrimitive.Trigger
  class={cn(
    "flex items-center gap-2 text-sm font-medium transition-colors",
    "hover:text-foreground focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    className
  )}
  {...rest}
>
  {@render children?.()}
</CollapsiblePrimitive.Trigger>
