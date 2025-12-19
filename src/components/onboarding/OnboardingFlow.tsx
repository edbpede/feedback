/**
 * @fileoverview Main onboarding flow orchestrator component.
 * Manages a multi-step wizard for collecting student context before starting a chat.
 * Steps include: Welcome → Model Path → Subject/Grade → Assignment → Student Work →
 * Grade Preference → [Anonymization] → Model Selection.
 *
 * The anonymization step is conditionally shown only for the enhanced-quality path
 * when student work content is present.
 */

import { createSignal, createMemo, Switch, Match, type Component } from "solid-js";
import type { OnboardingContext, AttachedFile, ModelPath, AnonymizationState } from "@lib/types";
import { WelcomeStep } from "./WelcomeStep";
import { ModelPathStep } from "../ModelPathStep";
import { SubjectGradeStep } from "./SubjectGradeStep";
import { AssignmentStep } from "./AssignmentStep";
import { StudentWorkStep } from "./StudentWorkStep";
import { GradePreferenceStep } from "./GradePreferenceStep";
import { AnonymizationStep } from "./AnonymizationStep";
import { ModelSelectionStep } from "./ModelSelectionStep";
import { getDefaultModelForPath } from "@config/models";

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
export const OnboardingFlow: Component<OnboardingFlowProps> = (props) => {
  // Start at step 2 (SubjectGradeStep) when editing, step 0 (WelcomeStep) otherwise
  const [currentStep, setCurrentStep] = createSignal(
    props.isEditing && props.initialContext ? 2 : 0
  );

  // Model path state (privacy-first or enhanced-quality)
  const [modelPath, setModelPath] = createSignal<ModelPath>(
    props.initialContext?.modelPath ?? "privacy-first"
  );

  // Form data with optional initial values for editing
  const [subject, setSubject] = createSignal(props.initialContext?.subject ?? "");
  const [grade, setGrade] = createSignal(props.initialContext?.grade ?? "");
  const [assignmentDescription, setAssignmentDescription] = createSignal(
    props.initialContext?.assignmentDescription ?? ""
  );
  const [studentWork, setStudentWork] = createSignal(props.initialContext?.studentWork ?? "");
  const [studentWorkFile, setStudentWorkFile] = createSignal<AttachedFile | null>(
    props.initialContext?.studentWorkFile ?? null
  );
  const [wantsGrade, setWantsGrade] = createSignal(props.initialContext?.wantsGrade ?? false);

  // Anonymization state for PII review (enhanced-quality path only)
  const [anonymizationState, setAnonymizationState] = createSignal<AnonymizationState | null>(
    props.initialContext?.anonymizationState ?? null
  );

  // Use initial context model, or default model for the selected path, or global default
  const getInitialModel = () => {
    if (props.initialContext?.model) return props.initialContext.model;
    const path = props.initialContext?.modelPath ?? "privacy-first";
    return getDefaultModelForPath(path);
  };
  const [model, setModel] = createSignal(getInitialModel());

  // Check if anonymization step should be shown
  // Only for enhanced-quality (commercial) path AND when there's student work content
  const shouldShowAnonymization = createMemo(() => {
    if (modelPath() !== "enhanced-quality") return false;
    const hasTextContent = (studentWork()?.trim() || "").length > 0;
    const hasFileContent = (studentWorkFile()?.content?.trim() || "").length > 0;
    return hasTextContent || hasFileContent;
  });

  // Dynamic total steps: 7 if showing anonymization, 6 otherwise
  const totalDisplayedSteps = createMemo(() =>
    shouldShowAnonymization() ? BASE_STEPS + 1 : BASE_STEPS
  );

  // Internal step number for model selection (last step)
  const modelSelectionInternalStep = createMemo(() => (shouldShowAnonymization() ? 7 : 6));

  // Combine student work text for PII analysis
  const getTextForAnonymization = () => {
    const text = studentWork()?.trim() || "";
    const fileContent = studentWorkFile()?.content?.trim() || "";
    return [text, fileContent].filter(Boolean).join("\n\n");
  };

  const handleStart = () => {
    setCurrentStep(1);
  };

  const handleModelPathSelect = (path: ModelPath) => {
    setModelPath(path);
    // Update model to default for the selected path
    setModel(getDefaultModelForPath(path));
    setCurrentStep(2);
  };

  const handleNext = () => {
    const current = currentStep();

    // From GradePreference (step 5), go to Anonymization if needed, else ModelSelection
    if (current === 5) {
      setCurrentStep(shouldShowAnonymization() ? 6 : modelSelectionInternalStep());
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, modelSelectionInternalStep()));
  };

  const handleBack = () => {
    // When editing, don't go back to welcome or model path selection (step 0 or 1)
    const minStep = props.isEditing ? 2 : 0;
    const current = currentStep();

    // From ModelSelection, go to Anonymization if it was shown, else GradePreference
    if (current === modelSelectionInternalStep()) {
      setCurrentStep(shouldShowAnonymization() ? 6 : 5);
      return;
    }

    setCurrentStep((prev) => Math.max(prev - 1, minStep));
  };

  // Handle anonymization completion
  const handleAnonymizationComplete = (result: AnonymizationState) => {
    setAnonymizationState(result);
    // Update student work with anonymized text
    setStudentWork(result.anonymizedText);
    // Clear file content if present (was included in anonymization)
    if (studentWorkFile()) {
      setStudentWorkFile({ ...studentWorkFile()!, content: "" });
    }
    // Proceed to model selection
    setCurrentStep(modelSelectionInternalStep());
  };

  const handleSubmit = () => {
    const context: OnboardingContext = {
      subject: subject(),
      grade: grade(),
      assignmentDescription: assignmentDescription(),
      studentWork: studentWork(),
      studentWorkFile: studentWorkFile(),
      wantsGrade: wantsGrade(),
      model: model(),
      modelPath: modelPath(),
      anonymizationState: anonymizationState(),
    };
    props.onComplete(context);
  };

  const handleSkipStep = () => {
    handleNext();
  };

  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject);
  };

  return (
    <div class="flex min-h-screen items-center justify-center p-4">
      <Switch>
        <Match when={currentStep() === 0}>
          <WelcomeStep onStart={handleStart} />
        </Match>

        <Match when={currentStep() === 1}>
          <ModelPathStep
            onContinue={handleModelPathSelect}
            onBack={() => setCurrentStep(0)}
            currentStep={0}
            totalSteps={totalDisplayedSteps()}
            initialPath={modelPath()}
          />
        </Match>

        <Match when={currentStep() === 2}>
          <SubjectGradeStep
            subject={subject()}
            grade={grade()}
            onSubjectChange={handleSubjectChange}
            onGradeChange={setGrade}
            onNext={handleNext}
            onBack={handleBack}
            currentStep={1}
            totalSteps={totalDisplayedSteps()}
          />
        </Match>

        <Match when={currentStep() === 3}>
          <AssignmentStep
            value={assignmentDescription()}
            onChange={setAssignmentDescription}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkipStep}
            currentStep={2}
            totalSteps={totalDisplayedSteps()}
          />
        </Match>

        <Match when={currentStep() === 4}>
          <StudentWorkStep
            value={studentWork()}
            onChange={setStudentWork}
            file={studentWorkFile()}
            onFileChange={setStudentWorkFile}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkipStep}
            currentStep={3}
            totalSteps={totalDisplayedSteps()}
          />
        </Match>

        <Match when={currentStep() === 5}>
          <GradePreferenceStep
            value={wantsGrade()}
            onChange={setWantsGrade}
            onNext={handleNext}
            onBack={handleBack}
            currentStep={4}
            totalSteps={totalDisplayedSteps()}
          />
        </Match>

        {/* Anonymization step - only shown for enhanced-quality path with student work */}
        <Match when={currentStep() === 6 && shouldShowAnonymization()}>
          <AnonymizationStep
            text={getTextForAnonymization()}
            onComplete={handleAnonymizationComplete}
            onBack={() => setCurrentStep(5)}
            currentStep={5}
            totalSteps={totalDisplayedSteps()}
          />
        </Match>

        <Match when={currentStep() === modelSelectionInternalStep()}>
          <ModelSelectionStep
            value={model()}
            onChange={setModel}
            onSubmit={handleSubmit}
            onBack={handleBack}
            currentStep={shouldShowAnonymization() ? 6 : 5}
            totalSteps={totalDisplayedSteps()}
            subject={subject()}
            modelPath={modelPath()}
          />
        </Match>
      </Switch>
    </div>
  );
};
