import type { Component } from "solid-js";
import { t } from "@lib/i18n";
import type { PIIFinding, PIICategory, PIIConfidence } from "@lib/types";

interface PIIFindingCardProps {
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

/**
 * Card component for displaying a single PII finding.
 * Shows original text, replacement, category, and confidence.
 */
export const PIIFindingCard: Component<PIIFindingCardProps> = (props) => {
  const colors = () => CONFIDENCE_COLORS[props.finding.confidence];

  return (
    <div
      class={`rounded-lg border p-4 transition-all ${
        props.finding.kept
          ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20"
          : "border-border bg-card"
      }`}
    >
      {/* Header with category and confidence */}
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span
            class={`${CATEGORY_ICONS[props.finding.category]} text-muted-foreground text-lg`}
          />
          <span class="text-sm font-medium">
            {t(`pii.categories.${props.finding.category}` as Parameters<typeof t>[0])}
          </span>
        </div>
        <span
          class={`rounded-full px-2 py-0.5 text-xs font-medium ${colors().bg} ${colors().text}`}
        >
          {t(`pii.confidence.${props.finding.confidence}` as Parameters<typeof t>[0])}
        </span>
      </div>

      {/* Original -> Replacement */}
      <div class="mb-3 space-y-2">
        <div class="flex items-start gap-2">
          <span class="text-muted-foreground mt-0.5 text-xs">Fra:</span>
          <span class="rounded bg-red-100 px-2 py-0.5 font-mono text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {props.finding.original}
          </span>
        </div>
        <div class="flex items-center justify-center">
          <span class="i-carbon-arrow-down text-muted-foreground" />
        </div>
        <div class="flex items-start gap-2">
          <span class="text-muted-foreground mt-0.5 text-xs">Til:</span>
          <span class="rounded bg-emerald-100 px-2 py-0.5 font-mono text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            {props.finding.replacement}
          </span>
        </div>
      </div>

      {/* Reasoning */}
      <p class="text-muted-foreground mb-3 text-sm">{props.finding.reasoning}</p>

      {/* Keep toggle (when in selective keep mode) */}
      {props.showKeepToggle && (
        <label class="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/50 p-2">
          <input
            type="checkbox"
            checked={props.finding.kept}
            onChange={(e) => props.onKeepToggle?.(props.finding.id, e.currentTarget.checked)}
            class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span class="text-sm">{t("pii.selectiveKeep.keepLabel")}</span>
        </label>
      )}
    </div>
  );
};
