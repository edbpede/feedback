<script lang="ts">
/**
 * @fileoverview Card component for displaying a single PII finding.
 * Shows the detected text, proposed replacement, category, confidence level,
 * and optionally a toggle to keep the original text.
 */

import { t } from "@lib/i18n";
import type { PIICategory, PIIConfidence, PIIFinding } from "@lib/types";

/** Props for the PIIFindingCard component */
interface PIIFindingCardProps {
  /** The PII finding to display */
  finding: PIIFinding;
  /** Show checkbox for selective keep mode */
  showKeepToggle?: boolean;
  /** Callback when keep toggle changes */
  onKeepToggle?: (id: string, kept: boolean) => void;
}

/** Icon mapping for each PII category */
const CATEGORY_ICONS: Record<PIICategory, string> = {
  name: "i-carbon-user",
  place: "i-carbon-location",
  institution: "i-carbon-building",
  contact: "i-carbon-phone",
  other: "i-carbon-information",
};

/** Color classes for confidence levels */
const CONFIDENCE_COLORS: Record<PIIConfidence, { bg: string; text: string; border: string }> = {
  high: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
  },
  medium: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  low: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
};

let { finding, showKeepToggle, onKeepToggle }: PIIFindingCardProps = $props();

const colors = $derived(CONFIDENCE_COLORS[finding.confidence]);
</script>

<div
  class="rounded-lg border p-4 transition-all {finding.kept
    ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20'
    : 'border-border bg-card'}"
>
  <!-- Header with category and confidence -->
  <div class="mb-3 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="{CATEGORY_ICONS[finding.category]} text-muted-foreground text-lg"></span>
      <span class="text-sm font-medium">
        {t(`pii.categories.${finding.category}` as Parameters<typeof t>[0])}
      </span>
    </div>
    <span class="rounded-full px-2 py-0.5 text-xs font-medium {colors.bg} {colors.text}">
      {t(`pii.confidence.${finding.confidence}` as Parameters<typeof t>[0])}
    </span>
  </div>

  <!-- Original -> Replacement -->
  <div class="mb-3 space-y-2">
    <div class="flex items-start gap-2">
      <span class="text-muted-foreground mt-0.5 text-xs">{t("pii.findingCard.from")}</span>
      <span
        class="rounded bg-red-100 px-2 py-0.5 font-mono text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400"
      >
        {finding.original}
      </span>
    </div>
    <div class="flex items-center justify-center">
      <span class="i-carbon-arrow-down text-muted-foreground"></span>
    </div>
    <div class="flex items-start gap-2">
      <span class="text-muted-foreground mt-0.5 text-xs">{t("pii.findingCard.to")}</span>
      <span
        class="rounded bg-emerald-100 px-2 py-0.5 font-mono text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      >
        {finding.replacement}
      </span>
    </div>
  </div>

  <!-- Reasoning -->
  <p class="text-muted-foreground mb-3 text-sm">{finding.reasoning}</p>

  <!-- Keep toggle (when in selective keep mode) -->
  {#if showKeepToggle}
    <label
      class="border-border bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md border p-2"
    >
      <input
        type="checkbox"
        checked={finding.kept}
        onchange={(e) => onKeepToggle?.(finding.id, e.currentTarget.checked)}
        class="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
      />
      <span class="text-sm">{t("pii.selectiveKeep.keepLabel")}</span>
    </label>
  {/if}
</div>
