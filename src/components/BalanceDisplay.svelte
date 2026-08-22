<script lang="ts">
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui";
import { formatDkk, usdToDkk } from "@config/pricing";
import { t } from "@lib/i18n";

interface BalanceDisplayProps {
  /** Balance in USD (null when loading/error) */
  balanceUsd: number | null;
  /** Whether balance is currently being fetched */
  isLoading: boolean;
}

let { balanceUsd, isLoading }: BalanceDisplayProps = $props();

const balanceDkk = $derived(balanceUsd !== null ? usdToDkk(balanceUsd) : null);
</script>

<Tooltip>
  <!--
    The Kobalte source rendered this trigger as a div via its polymorphic `as` prop.
    bits-ui has no such prop, so the element is supplied through the `child` snippet;
    the spread carries the ARIA wiring and event handlers that open the tooltip.
    Rendering the default button element instead would change the DOM and the a11y tree.
  -->
  <TooltipTrigger>
    {#snippet child({ props })}
      <div {...props} class="text-muted-foreground flex cursor-help items-center gap-1.5 text-sm">
        <span class="i-carbon-wallet"></span>
        {#if !isLoading && balanceUsd !== null}
          <span>{formatDkk(balanceDkk!)}</span>
        {:else}
          {#if isLoading}
            <span class="animate-pulse">...</span>
          {:else}
            <span class="text-destructive">--</span>
          {/if}
        {/if}
      </div>
    {/snippet}
  </TooltipTrigger>
  <TooltipContent class="max-w-xs">{t("balance.tooltip")}</TooltipContent>
</Tooltip>
