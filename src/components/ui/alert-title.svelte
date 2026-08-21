<script lang="ts">
  import { cn } from "@lib/utils";
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLHeadingElement> {
    children?: Snippet;
  }

  let { class: className, children, ...rest }: Props = $props();
</script>

<h5 class={cn("mb-1 font-medium leading-none tracking-tight", className)} {...rest}>
  {@render children?.()}
</h5>
