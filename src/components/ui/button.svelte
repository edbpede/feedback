<script lang="ts">
import { cn } from "@lib/utils";
import { buttonVariants, type ButtonProps } from "./button-variants";

let { variant, size, class: className, children, ...rest }: ButtonProps = $props();
</script>

<button class={cn(buttonVariants({ variant, size }), className)} {...rest}>
  {@render children?.()}
</button>
