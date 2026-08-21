<script lang="ts">
  import { cn } from "@lib/utils";
  import { Collapsible as CollapsiblePrimitive } from "bits-ui";
  import type { CollapsibleContentProps } from "bits-ui";

  let { class: className, children, ...rest }: CollapsibleContentProps = $props();
</script>

<CollapsiblePrimitive.Content
  class={cn(
    "data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden transition-all",
    className
  )}
  {...rest}
>
  {@render children?.()}
</CollapsiblePrimitive.Content>
