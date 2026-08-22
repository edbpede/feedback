<script lang="ts">
import { Tooltip as TooltipPrimitive } from "bits-ui";
import type { TooltipRootProps } from "bits-ui";

// bits-ui requires a Tooltip.Provider ancestor: TooltipRootState.create() reads
// TooltipProviderContext and THROWS when it is unset. Kobalte needed no provider,
// so the provider is folded into this wrapper and every call site stays unchanged.
// Props (children included) are forwarded whole so the Root's public type is preserved.
let props: TooltipRootProps = $props();
</script>

<TooltipPrimitive.Provider>
  <TooltipPrimitive.Root {...props} />
</TooltipPrimitive.Provider>
