import { Show, type Component } from "solid-js";
import { formatUsd, formatDkk, usdToDkk } from "@config/pricing";

interface BalanceDisplayProps {
  /** Balance in USD (null when loading/error) */
  balanceUsd: number | null;
  /** Whether balance is currently being fetched */
  isLoading: boolean;
}

export const BalanceDisplay: Component<BalanceDisplayProps> = (props) => {
  const balanceDkk = () =>
    props.balanceUsd !== null ? usdToDkk(props.balanceUsd) : null;

  return (
    <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span class="i-carbon-wallet" />
      <Show
        when={!props.isLoading && props.balanceUsd !== null}
        fallback={
          <Show
            when={props.isLoading}
            fallback={<span class="text-destructive">--</span>}
          >
            <span class="animate-pulse">...</span>
          </Show>
        }
      >
        <span>
          {formatUsd(props.balanceUsd!)} / {formatDkk(balanceDkk()!)}
        </span>
      </Show>
    </div>
  );
};
