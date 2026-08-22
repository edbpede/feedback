<script lang="ts">
import { cn } from "@lib/utils";
import { Tooltip as TooltipPrimitive } from "bits-ui";
import type { TooltipContentProps } from "bits-ui";

let { class: className, children, ...rest }: TooltipContentProps = $props();
</script>

<TooltipPrimitive.Portal>
  <TooltipPrimitive.Content
    class={cn(
      "border-border bg-popover text-popover-foreground z-50 overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-md",
      "animate-in fade-in-0 zoom-in-95",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
      className
    )}
    {...rest}
  >
    {@render children?.()}
    <TooltipPrimitive.Arrow />
  </TooltipPrimitive.Content>
</TooltipPrimitive.Portal>
