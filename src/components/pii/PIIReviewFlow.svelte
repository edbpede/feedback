<script lang="ts">
/**
 * @fileoverview Main orchestrator component for the PII (Personal Identifiable Information) review flow.
 * Implements a state machine to guide users through detecting, reviewing, and optionally
 * declining PII anonymization before sending student work to commercial AI models.
 *
 * The flow states are:
 * - detecting: Initial PII scan using TEE model
 * - review: Display detected PII items for user approval
 * - decline: Show menu of decline reasons
 * - verification: Re-run detection after user claims they removed PII
 * - context-input: Gather user context for false positive reports
 * - selective-keep: Allow user to mark specific items to keep
 * - warning: Final confirmation when keeping PII items
 * - error: Display error state with retry option
 */

import { Alert, AlertDescription, Button, Card, CardContent } from "@components/ui";
import { detectPIIWithFallback } from "@lib/api";
import { t } from "@lib/i18n";
import type {
  AnonymizationState,
  PIIDeclineReason,
  PIIDetectionResult,
  PIIDetectionStatus,
  PIIFinding,
} from "@lib/types";
import PIIDeclineMenu from "./PIIDeclineMenu.svelte";
import PIIDetectionLoading from "./PIIDetectionLoading.svelte";
import PIIFindingsList from "./PIIFindingsList.svelte";
import PIIWarningDialog from "./PIIWarningDialog.svelte";

/**
 * State machine states for the PII review flow.
 * Each state corresponds to a distinct UI view or processing phase.
 */
type PIIReviewState =
  | "detecting"
  | "review"
  | "decline"
  | "verification"
  | "context-input"
  | "selective-keep"
  | "warning"
  | "error";

interface PIIReviewFlowProps {
  /** Text to analyze for PII */
  text: string;
  /** Callback when user accepts anonymization and proceeds */
  onComplete: (result: AnonymizationState) => void;
  /** Callback when user wants to go back */
  onBack: () => void;
}

/**
 * Main orchestrator component for the PII review flow.
 * Manages state machine for detection -> review -> confirmation.
 */
let { text, onComplete, onBack }: PIIReviewFlowProps = $props();

let reviewState = $state<PIIReviewState>("detecting");
let detectionResult = $state<PIIDetectionResult | null>(null);
let findings = $state<PIIFinding[]>([]);
let error = $state<string | null>(null);
let falsePositiveContext = $state("");
let detectionStatus = $state<PIIDetectionStatus | null>(null);

// Run initial detection with AbortController to prevent race conditions
$effect(() => {
  if (reviewState !== "detecting" && reviewState !== "verification") return;

  const controller = new AbortController();
  runDetection(controller.signal);

  // Abort any in-flight request when effect re-runs
  return () => controller.abort();
});

async function runDetection(signal?: AbortSignal) {
  try {
    error = null;
    detectionStatus = null;

    const context = reviewState === "verification" ? falsePositiveContext : undefined;

    const result = await detectPIIWithFallback({
      text,
      context,
      onStatusUpdate: (status) => {
        // Don't update if aborted
        if (signal?.aborted) return;
        detectionStatus = status;
      },
    });

    // Don't process result if aborted
    if (signal?.aborted) return;

    detectionResult = result;
    findings = result.findings.map((f) => ({ ...f, kept: false }));

    if (result.isClean) {
      // No PII found - proceed immediately
      handleAcceptAll();
    } else {
      reviewState = "review";
    }
  } catch (err) {
    // Ignore abort errors
    if (err instanceof Error && err.name === "AbortError") return;
    if (signal?.aborted) return;

    console.error("[PIIReviewFlow] Detection error:", err);
    error = err instanceof Error ? err.message : "Unknown error";
    reviewState = "error";
  }
}

function handleAcceptAll() {
  const result = detectionResult;
  if (!result) return;

  const anonymizationState: AnonymizationState = {
    originalText: text,
    anonymizedText: result.anonymizedText,
    appliedReplacements: findings.filter((f) => !f.kept),
    skippedItems: findings.filter((f) => f.kept),
  };
  onComplete(anonymizationState);
}

function handleDeclineSelect(reason: PIIDeclineReason) {
  switch (reason) {
    case "already_removed":
      // Re-run detection to verify
      reviewState = "verification";
      break;
    case "false_positive":
      reviewState = "context-input";
      break;
    case "selective_keep":
      reviewState = "selective-keep";
      break;
  }
}

function handleKeepToggle(id: string, kept: boolean) {
  findings = findings.map((f) => (f.id === id ? { ...f, kept } : f));
}

function handleConfirmSelection() {
  const keptItems = findings.filter((f) => f.kept);
  if (keptItems.length > 0) {
    reviewState = "warning";
  } else {
    // All items anonymized
    handleAcceptAll();
  }
}

function handleConfirmKeeping() {
  const result = detectionResult;
  if (!result) return;

  const keptItems = findings.filter((f) => f.kept);
  const appliedItems = findings.filter((f) => !f.kept);

  // Start from fully anonymized text and undo kept items
  let anonymizedText = result.anonymizedText;
  for (const finding of keptItems) {
    anonymizedText = anonymizedText.split(finding.replacement).join(finding.original);
  }

  const anonymizationState: AnonymizationState = {
    originalText: text,
    anonymizedText,
    appliedReplacements: appliedItems,
    skippedItems: keptItems,
  };
  onComplete(anonymizationState);
}

function handleRetryWithContext() {
  reviewState = "verification";
}

function handleRetry() {
  reviewState = "detecting";
}
</script>

{#if reviewState === "detecting" || reviewState === "verification"}
  <PIIDetectionLoading status={detectionStatus} />
{:else}
  <Card class="w-full max-w-2xl">
    <CardContent class="pt-6">
      <!-- Error State -->
      {#if reviewState === "error"}
        <div class="flex flex-col items-center gap-4 py-8">
          <span class="i-carbon-warning-filled text-4xl text-red-500"></span>
          <h2 class="text-xl font-semibold">{t("pii.error.title")}</h2>
          <p class="text-muted-foreground text-center">{t("pii.error.description")}</p>
          {#if error}
            <Alert variant="destructive" class="max-w-md">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          {/if}
          <Button onclick={handleRetry}>
            <span class="i-carbon-renew mr-1"></span>
            {t("pii.error.retryButton")}
          </Button>
        </div>
      {/if}

      <!-- Review State -->
      {#if reviewState === "review"}
        <h2 class="mb-2 text-center text-xl font-bold">{t("pii.review.title")}</h2>
        <p class="text-muted-foreground mb-6 text-center">{t("pii.review.description")}</p>

        <PIIFindingsList {findings} />

        <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <div class="flex gap-2">
            <Button variant="ghost" onclick={onBack}>
              <span class="i-carbon-arrow-left mr-1"></span>
              {t("onboarding.navigation.back")}
            </Button>
            <Button variant="secondary" onclick={() => (reviewState = "decline")}>
              {t("pii.review.declineButton")}
            </Button>
          </div>
          <Button onclick={handleAcceptAll}>
            <span class="i-carbon-checkmark mr-1"></span>
            {t("pii.review.acceptButton")}
          </Button>
        </div>
      {/if}

      <!-- Decline Menu State -->
      {#if reviewState === "decline"}
        <PIIDeclineMenu onSelect={handleDeclineSelect} onCancel={() => (reviewState = "review")} />
      {/if}

      <!-- Context Input State -->
      {#if reviewState === "context-input"}
        <h2 class="mb-2 text-center text-xl font-bold">{t("pii.falsePositive.title")}</h2>

        <div class="mb-6">
          <textarea
            value={falsePositiveContext}
            oninput={(e) => (falsePositiveContext = e.currentTarget.value)}
            placeholder={t("pii.falsePositive.placeholder")}
            aria-label={t("pii.falsePositive.title")}
            class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[120px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          ></textarea>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="secondary" onclick={() => (reviewState = "review")}>
            <span class="i-carbon-arrow-left mr-1"></span>
            {t("onboarding.navigation.back")}
          </Button>
          <Button onclick={handleRetryWithContext} disabled={!falsePositiveContext.trim()}>
            {t("pii.falsePositive.retryButton")}
            <span class="i-carbon-arrow-right ml-1"></span>
          </Button>
        </div>
      {/if}

      <!-- Selective Keep State -->
      {#if reviewState === "selective-keep"}
        <h2 class="mb-2 text-center text-xl font-bold">{t("pii.selectiveKeep.title")}</h2>
        <p class="text-muted-foreground mb-6 text-center">
          {t("pii.selectiveKeep.description")}
        </p>

        <PIIFindingsList {findings} showKeepToggles onKeepToggle={handleKeepToggle} />

        <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="secondary" onclick={() => (reviewState = "review")}>
            <span class="i-carbon-arrow-left mr-1"></span>
            {t("onboarding.navigation.back")}
          </Button>
          <Button onclick={handleConfirmSelection}>
            {t("pii.selectiveKeep.confirmButton")}
            <span class="i-carbon-arrow-right ml-1"></span>
          </Button>
        </div>
      {/if}

      <!-- Warning State -->
      {#if reviewState === "warning"}
        <PIIWarningDialog
          keptItems={findings.filter((f) => f.kept)}
          onConfirm={handleConfirmKeeping}
          onCancel={() => (reviewState = "selective-keep")}
        />
      {/if}
    </CardContent>
  </Card>
{/if}
