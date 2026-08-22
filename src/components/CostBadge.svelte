<script lang="ts">
import { formatDkk, usdToDkk } from "@config/pricing";

interface Props {
  /** Cost in USD */
  costUsd: number;
}

let { costUsd }: Props = $props();
const costDkk = $derived(usdToDkk(costUsd));
</script>

<span
  class="text-muted-foreground inline-flex items-center gap-1 text-xs opacity-60 transition-opacity hover:opacity-100"
  title={`$${costUsd.toFixed(4)} USD`}
>
  <span class="i-carbon-currency"></span>{formatDkk(costDkk)}
</span>
