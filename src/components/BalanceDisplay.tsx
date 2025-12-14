import { Show, type Component } from "solid-js";
import { formatDkk, usdToDkk } from "@config/pricing";
import { Tooltip, TooltipTrigger, TooltipContent } from "@components/ui/tooltip";
import { t } from "@lib/i18n";

interface BalanceDisplayProps {
  /** Balance in USD (null when loading/error) */
  balanceUsd: number | null;
  /** Whether balance is currently being fetched */
  isLoading: boolean;
}

export const BalanceDisplay: Component<BalanceDisplayProps> = (props) => {
  const balanceDkk = () => (props.balanceUsd !== null ? usdToDkk(props.balanceUsd) : null);

  return (
    <Tooltip>
      <TooltipTrigger
        as="div"
        class="text-muted-foreground flex cursor-help items-center gap-1.5 text-sm"
      >
        <span class="i-carbon-wallet" />
        <Show
          when={!props.isLoading && props.balanceUsd !== null}
          fallback={
            <Show when={props.isLoading} fallback={<span class="text-destructive">--</span>}>
              <span class="animate-pulse">...</span>
            </Show>
          }
        >
          <span>{formatDkk(balanceDkk()!)}</span>
        </Show>
      </TooltipTrigger>
      <TooltipContent class="max-w-xs">{t("balance.tooltip")}</TooltipContent>
    </Tooltip>
  );
};
