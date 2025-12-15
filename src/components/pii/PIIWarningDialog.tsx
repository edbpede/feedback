import { type Component, For } from "solid-js";
import { t } from "@lib/i18n";
import { Button } from "@components/ui/button";
import type { PIIFinding } from "@lib/types";

interface PIIWarningDialogProps {
  /** PII items the user is choosing to keep */
  keptItems: PIIFinding[];
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Warning dialog shown when user chooses to keep some PII items.
 * Lists the items being kept and requires explicit confirmation.
 */
export const PIIWarningDialog: Component<PIIWarningDialogProps> = (props) => {
  return (
    <div class="space-y-4">
      {/* Warning header */}
      <div class="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
        <span class="i-carbon-warning-filled text-2xl text-amber-500" />
        <div>
          <h3 class="font-semibold text-amber-800 dark:text-amber-300">
            {t("pii.warning.title")}
          </h3>
          <p class="text-sm text-amber-700 dark:text-amber-400">
            {t("pii.warning.description")}
          </p>
        </div>
      </div>

      {/* List of kept items */}
      <div>
        <p class="text-muted-foreground mb-2 text-sm font-medium">{t("pii.warning.items")}</p>
        <ul class="space-y-2">
          <For each={props.keptItems}>
            {(item) => (
              <li class="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-2 text-sm">
                <span class="i-carbon-warning text-amber-500" />
                <span class="font-mono">{item.original}</span>
                <span class="text-muted-foreground">
                  ({t(`pii.categories.${item.category}` as Parameters<typeof t>[0])})
                </span>
              </li>
            )}
          </For>
        </ul>
      </div>

      {/* Action buttons */}
      <div class="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={props.onCancel}>
          <span class="i-carbon-arrow-left mr-1" />
          {t("pii.warning.cancelButton")}
        </Button>
        <Button variant="destructive" onClick={props.onConfirm}>
          <span class="i-carbon-checkmark mr-1" />
          {t("pii.warning.confirmButton")}
        </Button>
      </div>
    </div>
  );
};
