import { createSignal, type Component, Show, createEffect } from "solid-js";
import { t } from "@lib/i18n";
import { detectPIIWithFallback } from "@lib/api";
import { Card, CardContent } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Alert, AlertDescription } from "@components/ui/alert";
import type {
  PIIFinding,
  PIIDetectionResult,
  PIIDeclineReason,
  AnonymizationState,
  PIIDetectionStatus,
} from "@lib/types";
import { PIIDetectionLoading } from "./PIIDetectionLoading";
import { PIIFindingsList } from "./PIIFindingsList";
import { PIIDeclineMenu } from "./PIIDeclineMenu";
import { PIIWarningDialog } from "./PIIWarningDialog";

/** State machine states for PII review flow */
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
export const PIIReviewFlow: Component<PIIReviewFlowProps> = (props) => {
  const [state, setState] = createSignal<PIIReviewState>("detecting");
  const [detectionResult, setDetectionResult] = createSignal<PIIDetectionResult | null>(null);
  const [findings, setFindings] = createSignal<PIIFinding[]>([]);
  const [error, setError] = createSignal<string | null>(null);
  const [falsePositiveContext, setFalsePositiveContext] = createSignal("");
  const [detectionStatus, setDetectionStatus] = createSignal<PIIDetectionStatus | null>(null);

  // Run initial detection
  createEffect(() => {
    if (state() === "detecting" || state() === "verification") {
      runDetection();
    }
  });

  async function runDetection() {
    try {
      setError(null);
      setDetectionStatus(null);

      const context = state() === "verification" ? falsePositiveContext() : undefined;

      const result = await detectPIIWithFallback({
        text: props.text,
        context,
        onStatusUpdate: (status) => {
          setDetectionStatus(status);
        },
      });

      setDetectionResult(result);
      setFindings(result.findings.map((f) => ({ ...f, kept: false })));

      if (result.isClean) {
        // No PII found - proceed immediately
        handleAcceptAll();
      } else {
        setState("review");
      }
    } catch (err) {
      console.error("[PIIReviewFlow] Detection error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setState("error");
    }
  }

  function handleAcceptAll() {
    const result = detectionResult();
    if (!result) return;

    const anonymizationState: AnonymizationState = {
      originalText: props.text,
      anonymizedText: result.anonymizedText,
      appliedReplacements: findings().filter((f) => !f.kept),
      skippedItems: findings().filter((f) => f.kept),
    };
    props.onComplete(anonymizationState);
  }

  function handleDeclineSelect(reason: PIIDeclineReason) {
    switch (reason) {
      case "already_removed":
        // Re-run detection to verify
        setState("verification");
        break;
      case "false_positive":
        setState("context-input");
        break;
      case "selective_keep":
        setState("selective-keep");
        break;
    }
  }

  function handleKeepToggle(id: string, kept: boolean) {
    setFindings((prev) => prev.map((f) => (f.id === id ? { ...f, kept } : f)));
  }

  function handleConfirmSelection() {
    const keptItems = findings().filter((f) => f.kept);
    if (keptItems.length > 0) {
      setState("warning");
    } else {
      // All items anonymized
      handleAcceptAll();
    }
  }

  function handleConfirmKeeping() {
    const result = detectionResult();
    if (!result) return;

    const keptItems = findings().filter((f) => f.kept);
    const appliedItems = findings().filter((f) => !f.kept);

    // Build anonymized text excluding kept items
    let anonymizedText = props.text;
    for (const finding of appliedItems) {
      anonymizedText = anonymizedText.split(finding.original).join(finding.replacement);
    }

    const anonymizationState: AnonymizationState = {
      originalText: props.text,
      anonymizedText,
      appliedReplacements: appliedItems,
      skippedItems: keptItems,
    };
    props.onComplete(anonymizationState);
  }

  function handleRetryWithContext() {
    setState("verification");
  }

  function handleRetry() {
    setState("detecting");
  }

  return (
    <Show
      when={state() === "detecting" || state() === "verification"}
      fallback={
        <Card class="w-full max-w-2xl">
          <CardContent class="pt-6">
            {/* Error State */}
            <Show when={state() === "error"}>
              <div class="flex flex-col items-center gap-4 py-8">
                <span class="i-carbon-warning-filled text-4xl text-red-500" />
                <h2 class="text-xl font-semibold">{t("pii.error.title")}</h2>
                <p class="text-muted-foreground text-center">{t("pii.error.description")}</p>
                {error() && (
                  <Alert variant="destructive" class="max-w-md">
                    <AlertDescription>{error()}</AlertDescription>
                  </Alert>
                )}
                <Button onClick={handleRetry}>
                  <span class="i-carbon-renew mr-1" />
                  {t("pii.error.retryButton")}
                </Button>
              </div>
            </Show>

            {/* Review State */}
            <Show when={state() === "review"}>
              <h2 class="mb-2 text-center text-xl font-bold">{t("pii.review.title")}</h2>
              <p class="text-muted-foreground mb-6 text-center">{t("pii.review.description")}</p>

              <PIIFindingsList findings={findings()} />

              <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
                <div class="flex gap-2">
                  <Button variant="ghost" onClick={props.onBack}>
                    <span class="i-carbon-arrow-left mr-1" />
                    {t("onboarding.navigation.back")}
                  </Button>
                  <Button variant="secondary" onClick={() => setState("decline")}>
                    {t("pii.review.declineButton")}
                  </Button>
                </div>
                <Button onClick={handleAcceptAll}>
                  <span class="i-carbon-checkmark mr-1" />
                  {t("pii.review.acceptButton")}
                </Button>
              </div>
            </Show>

            {/* Decline Menu State */}
            <Show when={state() === "decline"}>
              <PIIDeclineMenu onSelect={handleDeclineSelect} onCancel={() => setState("review")} />
            </Show>

            {/* Context Input State */}
            <Show when={state() === "context-input"}>
              <h2 class="mb-2 text-center text-xl font-bold">{t("pii.falsePositive.title")}</h2>

              <div class="mb-6">
                <textarea
                  value={falsePositiveContext()}
                  onInput={(e) => setFalsePositiveContext(e.currentTarget.value)}
                  placeholder={t("pii.falsePositive.placeholder")}
                  class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[120px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                />
              </div>

              <div class="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button variant="secondary" onClick={() => setState("review")}>
                  <span class="i-carbon-arrow-left mr-1" />
                  {t("onboarding.navigation.back")}
                </Button>
                <Button onClick={handleRetryWithContext} disabled={!falsePositiveContext().trim()}>
                  {t("pii.falsePositive.retryButton")}
                  <span class="i-carbon-arrow-right ml-1" />
                </Button>
              </div>
            </Show>

            {/* Selective Keep State */}
            <Show when={state() === "selective-keep"}>
              <h2 class="mb-2 text-center text-xl font-bold">{t("pii.selectiveKeep.title")}</h2>
              <p class="text-muted-foreground mb-6 text-center">
                {t("pii.selectiveKeep.description")}
              </p>

              <PIIFindingsList
                findings={findings()}
                showKeepToggles
                onKeepToggle={handleKeepToggle}
              />

              <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button variant="secondary" onClick={() => setState("review")}>
                  <span class="i-carbon-arrow-left mr-1" />
                  {t("onboarding.navigation.back")}
                </Button>
                <Button onClick={handleConfirmSelection}>
                  {t("pii.selectiveKeep.confirmButton")}
                  <span class="i-carbon-arrow-right ml-1" />
                </Button>
              </div>
            </Show>

            {/* Warning State */}
            <Show when={state() === "warning"}>
              <PIIWarningDialog
                keptItems={findings().filter((f) => f.kept)}
                onConfirm={handleConfirmKeeping}
                onCancel={() => setState("selective-keep")}
              />
            </Show>

            {/* Clean State (no PII found) */}
            <Show when={detectionResult()?.isClean && state() === "review"}>
              <div class="flex flex-col items-center gap-4 py-8">
                <span class="i-carbon-checkmark-filled text-4xl text-emerald-500" />
                <h2 class="text-xl font-semibold">{t("pii.review.noDetections")}</h2>
                <Button onClick={handleAcceptAll}>
                  {t("pii.review.proceedButton")}
                  <span class="i-carbon-arrow-right ml-1" />
                </Button>
              </div>
            </Show>
          </CardContent>
        </Card>
      }
    >
      <PIIDetectionLoading status={detectionStatus()} />
    </Show>
  );
};
