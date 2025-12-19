/**
 * @fileoverview Menu component for selecting why the user disagrees with PII detection.
 * Part of the PII review flow, allowing users to explain false positives or keep specific items.
 */

import type { Component } from "solid-js";
import { t } from "@lib/i18n";
import { Button } from "@components/ui/button";
import type { PIIDeclineReason } from "@lib/types";

/** Props for the PIIDeclineMenu component */
interface PIIDeclineMenuProps {
  /** Callback when user selects a decline reason */
  onSelect: (reason: PIIDeclineReason) => void;
  /** Callback when user cancels and returns to review */
  onCancel: () => void;
}

/** Configuration for a decline option in the menu */
interface DeclineOption {
  /** The decline reason type */
  reason: PIIDeclineReason;
  /** UnoCSS icon class name */
  icon: string;
  /** i18n translation key for the label */
  labelKey: string;
}

const DECLINE_OPTIONS: DeclineOption[] = [
  {
    reason: "already_removed",
    icon: "i-carbon-checkmark-outline",
    labelKey: "pii.decline.alreadyRemoved",
  },
  {
    reason: "false_positive",
    icon: "i-carbon-warning-alt",
    labelKey: "pii.decline.falsePositive",
  },
  {
    reason: "selective_keep",
    icon: "i-carbon-checkbox-checked",
    labelKey: "pii.decline.selectiveKeep",
  },
];

/**
 * Menu component for selecting why the user disagrees with PII detection.
 * Offers three options: already removed, false positive, or selective keep.
 */
export const PIIDeclineMenu: Component<PIIDeclineMenuProps> = (props) => {
  return (
    <div class="space-y-4">
      <h3 class="text-center text-lg font-semibold">{t("pii.decline.title")}</h3>

      <div class="space-y-2">
        {DECLINE_OPTIONS.map((option) => (
          <button
            type="button"
            onClick={() => props.onSelect(option.reason)}
            class="hover:border-primary hover:bg-accent/50 border-border flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all"
          >
            <span class={`${option.icon} text-muted-foreground text-xl`} />
            <span class="font-medium">{t(option.labelKey as Parameters<typeof t>[0])}</span>
            <span class="i-carbon-chevron-right text-muted-foreground ml-auto" />
          </button>
        ))}
      </div>

      <div class="flex justify-center pt-2">
        <Button variant="ghost" onClick={props.onCancel}>
          {t("onboarding.navigation.cancel")}
        </Button>
      </div>
    </div>
  );
};
