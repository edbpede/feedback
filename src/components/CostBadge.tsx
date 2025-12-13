import { type Component } from "solid-js";
import { formatDkk, usdToDkk } from "@config/pricing";

interface CostBadgeProps {
  /** Cost in USD */
  costUsd: number;
}

export const CostBadge: Component<CostBadgeProps> = (props) => {
  const costDkk = () => usdToDkk(props.costUsd);

  return (
    <span
      class="inline-flex items-center gap-1 text-xs text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
      title={`$${props.costUsd.toFixed(4)} USD`}
    >
      <span class="i-carbon-currency" />
      {formatDkk(costDkk())}
    </span>
  );
};
