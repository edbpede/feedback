<script lang="ts">
  import { cn } from "@lib/utils";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLParagraphElement> {
    children?: Snippet;
  }

  let { class: className, children, ...rest }: Props = $props();
</script>

<p class={cn("text-muted-foreground text-sm", className)} {...rest}>
  {@render children?.()}
</p>
