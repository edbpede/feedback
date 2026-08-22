<script lang="ts">
import { cn } from "@lib/utils";
import type { HTMLTextareaAttributes } from "svelte/elements";

let { class: className, ...rest }: HTMLTextareaAttributes = $props();
</script>

<textarea
  class={cn(
    "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  {...rest}
></textarea>
