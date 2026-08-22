<script lang="ts">
  /**
   * @fileoverview Onboarding step for PII anonymization review.
   * Wraps PIIReviewFlow with step indicator for integration into the onboarding flow.
   * Only shown when user selects the enhanced-quality model path.
   */

  import { PIIReviewFlow } from "@components/pii";
  import type { AnonymizationState } from "@lib/types";
  import StepIndicator from "./StepIndicator.svelte";

  /** Props for the AnonymizationStep component */
  interface AnonymizationStepProps {
    /** Text to analyze for PII (combined student work text and file content) */
    text: string;
    /** Callback when anonymization is complete */
    onComplete: (result: AnonymizationState) => void;
    /** Callback to go back to previous step */
    onBack: () => void;
    /** Current step number (0-indexed) for progress display */
    currentStep: number;
    /** Total number of steps for progress display */
    totalSteps: number;
  }

  /**
   * Wrapper component that integrates PIIReviewFlow into the onboarding flow.
   * Adds StepIndicator for progress display while delegating PII detection
   * and review logic to PIIReviewFlow.
   */
  let { text, onComplete, onBack, currentStep, totalSteps }: AnonymizationStepProps = $props();
</script>

<div class="w-full max-w-2xl space-y-4">
  <!-- Step indicator shown above the PII review -->
  <div class="flex justify-center">
    <StepIndicator {totalSteps} {currentStep} />
  </div>

  <!-- PIIReviewFlow handles its own Card wrapper -->
  <PIIReviewFlow {text} {onComplete} {onBack} />
</div>
