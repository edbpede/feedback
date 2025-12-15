import type { Component } from "solid-js";
import type { AnonymizationState } from "@lib/types";
import { PIIReviewFlow } from "@components/pii";
import { StepIndicator } from "./StepIndicator";

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
export const AnonymizationStep: Component<AnonymizationStepProps> = (props) => {
  return (
    <div class="w-full max-w-2xl space-y-4">
      {/* Step indicator shown above the PII review */}
      <div class="flex justify-center">
        <StepIndicator totalSteps={props.totalSteps} currentStep={props.currentStep} />
      </div>

      {/* PIIReviewFlow handles its own Card wrapper */}
      <PIIReviewFlow
        text={props.text}
        onComplete={props.onComplete}
        onBack={props.onBack}
      />
    </div>
  );
};
