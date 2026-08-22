<script lang="ts">
/**
 * @fileoverview List component for displaying all detected PII findings.
 * Renders a scrollable list of PIIFindingCard components with optional
 * keep toggles for selective anonymization.
 */

import { t } from "@lib/i18n";
import type { PIIFinding } from "@lib/types";
import PIIFindingCard from "./PIIFindingCard.svelte";

/** Props for the PIIFindingsList component */
interface PIIFindingsListProps {
  /** Array of PII findings to display */
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
let { findings, showKeepToggles, onKeepToggle }: PIIFindingsListProps = $props();
</script>

{#if findings.length > 0}
  <div class="space-y-4">
    {#each findings as finding (finding.id)}
      <PIIFindingCard {finding} showKeepToggle={showKeepToggles} {onKeepToggle} />
    {/each}
  </div>
{:else}
  <div class="flex flex-col items-center justify-center gap-4 py-8">
    <span class="i-carbon-checkmark-filled text-4xl text-emerald-500"></span>
    <p class="text-muted-foreground">{t("pii.review.noDetections")}</p>
  </div>
{/if}
