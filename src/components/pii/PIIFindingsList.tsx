import { type Component, For, Show } from "solid-js";
import { t } from "@lib/i18n";
import type { PIIFinding } from "@lib/types";
import { PIIFindingCard } from "./PIIFindingCard";

interface PIIFindingsListProps {
  findings: PIIFinding[];
  /** Show checkboxes for selective keep mode */
  showKeepToggles?: boolean;
  /** Callback when keep toggle changes */
  onKeepToggle?: (id: string, kept: boolean) => void;
}

/**
 * List component for displaying all PII findings.
 * Shows empty state when no findings exist.
 */
export const PIIFindingsList: Component<PIIFindingsListProps> = (props) => {
  return (
    <Show
      when={props.findings.length > 0}
      fallback={
        <div class="flex flex-col items-center justify-center gap-4 py-8">
          <span class="i-carbon-checkmark-filled text-4xl text-emerald-500" />
          <p class="text-muted-foreground">{t("pii.review.noDetections")}</p>
        </div>
      }
    >
      <div class="space-y-4">
        <For each={props.findings}>
          {(finding) => (
            <PIIFindingCard
              finding={finding}
              showKeepToggle={props.showKeepToggles}
              onKeepToggle={props.onKeepToggle}
            />
          )}
        </For>
      </div>
    </Show>
  );
};
