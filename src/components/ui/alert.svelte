<script lang="ts">
  import { cn } from "@lib/utils";
  import { alertVariants, type AlertProps } from "./alert-variants";

  let { class: className, variant, children, ...rest }: AlertProps = $props();
</script>

<div role="alert" class={cn(alertVariants({ variant }), className)} {...rest}>
  {@render children?.()}
</div>
