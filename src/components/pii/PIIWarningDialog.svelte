<script lang="ts">
  /**
   * @fileoverview Warning dialog shown when users choose to keep some PII items.
   * Displays a list of items being kept and requires explicit confirmation
   * to ensure users understand the privacy implications.
   */

  import { Button } from "@components/ui";
  import { t } from "@lib/i18n";
  import type { PIIFinding } from "@lib/types";

  /** Props for the PIIWarningDialog component */
  interface PIIWarningDialogProps {
    /** PII items the user is choosing to keep (not anonymize) */
    keptItems: PIIFinding[];
    /** Callback when user confirms keeping the items */
    onConfirm: () => void;
    /** Callback when user cancels and returns to selection */
    onCancel: () => void;
  }

  let { keptItems, onConfirm, onCancel }: PIIWarningDialogProps = $props();
</script>

<div class="space-y-4">
  <!-- Warning header -->
  <div
    class="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20"
  >
    <span class="i-carbon-warning-filled text-2xl text-amber-500"></span>
    <div>
      <h3 class="font-semibold text-amber-800 dark:text-amber-300">{t("pii.warning.title")}</h3>
      <p class="text-sm text-amber-700 dark:text-amber-400">{t("pii.warning.description")}</p>
    </div>
  </div>

  <!-- List of kept items -->
  <div>
    <p class="text-muted-foreground mb-2 text-sm font-medium">{t("pii.warning.items")}</p>
    <ul class="space-y-2">
      {#each keptItems as item (item.id)}
        <li
          class="border-border bg-muted/50 flex items-center gap-2 rounded-md border p-2 text-sm"
        >
          <span class="i-carbon-warning text-amber-500"></span>
          <span class="font-mono">{item.original}</span>
          <span class="text-muted-foreground">
            ({t(`pii.categories.${item.category}` as Parameters<typeof t>[0])})
          </span>
        </li>
      {/each}
    </ul>
  </div>

  <!-- Action buttons -->
  <div class="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end">
    <Button variant="secondary" onclick={onCancel}>
      <span class="i-carbon-arrow-left mr-1"></span>
      {t("pii.warning.cancelButton")}
    </Button>
    <Button variant="destructive" onclick={onConfirm}>
      <span class="i-carbon-checkmark mr-1"></span>
      {t("pii.warning.confirmButton")}
    </Button>
  </div>
</div>
