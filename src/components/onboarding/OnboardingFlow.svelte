<script lang="ts">
/**
 * @fileoverview Main onboarding flow orchestrator component.
 * Manages a multi-step wizard for collecting student context before starting a chat.
 * Steps include: Welcome → Model Path → Subject/Grade → Assignment → Student Work →
 * Grade Preference → [Anonymization] → Model Selection.
 *
 * The anonymization step is conditionally shown only for the enhanced-quality path
 * when student work content is present.
 */

import ModelPathStep from "@components/ModelPathStep.svelte";
import { getDefaultModelForPath } from "@config/models";
import type { AnonymizationState, AttachedFile, ModelPath, OnboardingContext } from "@lib/types";
import AnonymizationStep from "./AnonymizationStep.svelte";
import AssignmentStep from "./AssignmentStep.svelte";
import GradePreferenceStep from "./GradePreferenceStep.svelte";
import ModelSelectionStep from "./ModelSelectionStep.svelte";
import StudentWorkStep from "./StudentWorkStep.svelte";
import SubjectGradeStep from "./SubjectGradeStep.svelte";
import WelcomeStep from "./WelcomeStep.svelte";

/** Props for the OnboardingFlow component */
interface OnboardingFlowProps {
  /** Callback when onboarding is completed with collected context */
  onComplete: (context: OnboardingContext) => void;
  /** Callback when user skips onboarding entirely */
  onSkip: () => void;
  /** Pre-populated context for editing existing onboarding data */
  initialContext?: OnboardingContext | null;
  /** Whether this is an edit flow (skips welcome/model path steps) */
  isEditing?: boolean;
}

/** Base number of displayed steps (without anonymization) */
const BASE_STEPS = 6;

/**
 * Multi-step onboarding wizard for collecting student context.
 * Dynamically adjusts step count based on whether anonymization is needed.
 */
let { onComplete, onSkip, initialContext, isEditing }: OnboardingFlowProps = $props();

// `initialContext` and `isEditing` seed the wizard once, at setup, and the one-shot
// reads below are deliberate: the Solid original read `props.initialContext` inside each
// createSignal initializer, which also ran only at setup. Making any of these $derived
// would snap the user's edits back to the initial context. (`isEditing` is still read
// live inside handleBack -- only this seeding read is fixed.)

// Start at step 2 (SubjectGradeStep) when editing, step 0 (WelcomeStep) otherwise
// svelte-ignore state_referenced_locally
let currentStep = $state(isEditing && initialContext ? 2 : 0);

// Model path state (privacy-first or enhanced-quality)
// svelte-ignore state_referenced_locally
let modelPath = $state<ModelPath>(initialContext?.modelPath ?? "privacy-first");

// Form data with optional initial values for editing
// svelte-ignore state_referenced_locally
let subject = $state(initialContext?.subject ?? "");
// svelte-ignore state_referenced_locally
let grade = $state(initialContext?.grade ?? "");
// svelte-ignore state_referenced_locally
let assignmentDescription = $state(initialContext?.assignmentDescription ?? "");
// svelte-ignore state_referenced_locally
let studentWork = $state(initialContext?.studentWork ?? "");
// svelte-ignore state_referenced_locally
let studentWorkFile = $state<AttachedFile | null>(initialContext?.studentWorkFile ?? null);
// svelte-ignore state_referenced_locally
let wantsGrade = $state(initialContext?.wantsGrade ?? false);

// Anonymization state for PII review (enhanced-quality path only)
// svelte-ignore state_referenced_locally
let anonymizationState = $state<AnonymizationState | null>(
  initialContext?.anonymizationState ?? null
);

// Use initial context model, or default model for the selected path, or global default
const getInitialModel = () => {
  if (initialContext?.model) return initialContext.model;
  const path = initialContext?.modelPath ?? "privacy-first";
  return getDefaultModelForPath(path);
};
let model = $state(getInitialModel());

// Check if anonymization step should be shown
// Only for enhanced-quality (commercial) path AND when there's student work content
const shouldShowAnonymization = $derived.by(() => {
  if (modelPath !== "enhanced-quality") return false;
  const hasTextContent = (studentWork?.trim() || "").length > 0;
  const hasFileContent = (studentWorkFile?.content?.trim() || "").length > 0;
  return hasTextContent || hasFileContent;
});

// Dynamic total steps: 7 if showing anonymization, 6 otherwise
const totalDisplayedSteps = $derived(shouldShowAnonymization ? BASE_STEPS + 1 : BASE_STEPS);

// Internal step number for model selection (last step)
const modelSelectionInternalStep = $derived(shouldShowAnonymization ? 7 : 6);

// Combine student work text for PII analysis
const getTextForAnonymization = () => {
  const text = studentWork?.trim() || "";
  const fileContent = studentWorkFile?.content?.trim() || "";
  return [text, fileContent].filter(Boolean).join("\n\n");
};

const handleStart = () => {
  currentStep = 1;
};

const handleModelPathSelect = (path: ModelPath) => {
  modelPath = path;
  // Update model to default for the selected path
  model = getDefaultModelForPath(path);
  currentStep = 2;
};

const handleNext = () => {
  const current = currentStep;

  // From GradePreference (step 5), go to Anonymization if needed, else ModelSelection
  if (current === 5) {
    currentStep = shouldShowAnonymization ? 6 : modelSelectionInternalStep;
    return;
  }

  currentStep = Math.min(current + 1, modelSelectionInternalStep);
};

const handleBack = () => {
  // When editing, don't go back to welcome or model path selection (step 0 or 1)
  const minStep = isEditing ? 2 : 0;
  const current = currentStep;

  // From ModelSelection, go to Anonymization if it was shown, else GradePreference
  if (current === modelSelectionInternalStep) {
    currentStep = shouldShowAnonymization ? 6 : 5;
    return;
  }

  currentStep = Math.max(current - 1, minStep);
};

// Handle anonymization completion
const handleAnonymizationComplete = (result: AnonymizationState) => {
  anonymizationState = result;
  // Update student work with anonymized text
  studentWork = result.anonymizedText;
  // Clear file content if present (was included in anonymization)
  if (studentWorkFile) {
    studentWorkFile = { ...studentWorkFile, content: "" };
  }
  // Proceed to model selection
  currentStep = modelSelectionInternalStep;
};

const handleSubmit = () => {
  const context: OnboardingContext = {
    subject: subject,
    grade: grade,
    assignmentDescription: assignmentDescription,
    studentWork: studentWork,
    studentWorkFile: studentWorkFile,
    wantsGrade: wantsGrade,
    model: model,
    modelPath: modelPath,
    anonymizationState: anonymizationState,
  };
  onComplete(context);
};

const handleSkipStep = () => {
  handleNext();
};

const handleSubjectChange = (newSubject: string) => {
  subject = newSubject;
};
</script>

<div class="flex min-h-screen items-center justify-center p-4">
  {#if currentStep === 0}
    <WelcomeStep onStart={handleStart} />
  {:else if currentStep === 1}
    <ModelPathStep
      onContinue={handleModelPathSelect}
      onBack={() => {
        currentStep = 0;
      }}
      currentStep={0}
      totalSteps={totalDisplayedSteps}
      initialPath={modelPath}
    />
  {:else if currentStep === 2}
    <SubjectGradeStep
      subject={subject}
      grade={grade}
      onSubjectChange={handleSubjectChange}
      onGradeChange={(newGrade) => {
        grade = newGrade;
      }}
      onNext={handleNext}
      onBack={handleBack}
      currentStep={1}
      totalSteps={totalDisplayedSteps}
    />
  {:else if currentStep === 3}
    <AssignmentStep
      value={assignmentDescription}
      onChange={(newValue) => {
        assignmentDescription = newValue;
      }}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipStep}
      currentStep={2}
      totalSteps={totalDisplayedSteps}
    />
  {:else if currentStep === 4}
    <StudentWorkStep
      value={studentWork}
      onChange={(newValue) => {
        studentWork = newValue;
      }}
      file={studentWorkFile}
      onFileChange={(newFile) => {
        studentWorkFile = newFile;
      }}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkipStep}
      currentStep={3}
      totalSteps={totalDisplayedSteps}
    />
  {:else if currentStep === 5}
    <GradePreferenceStep
      value={wantsGrade}
      onChange={(newValue) => {
        wantsGrade = newValue;
      }}
      onNext={handleNext}
      onBack={handleBack}
      currentStep={4}
      totalSteps={totalDisplayedSteps}
    />
  {:else if currentStep === 6 && shouldShowAnonymization}
    <!-- Anonymization step - only shown for enhanced-quality path with student work -->
    <AnonymizationStep
      text={getTextForAnonymization()}
      onComplete={handleAnonymizationComplete}
      onBack={() => {
        currentStep = 5;
      }}
      currentStep={5}
      totalSteps={totalDisplayedSteps}
    />
  {:else if currentStep === modelSelectionInternalStep}
    <ModelSelectionStep
      value={model}
      onChange={(newValue) => {
        model = newValue;
      }}
      onSubmit={handleSubmit}
      onBack={handleBack}
      currentStep={shouldShowAnonymization ? 6 : 5}
      totalSteps={totalDisplayedSteps}
      subject={subject}
      modelPath={modelPath}
    />
  {/if}
</div>
