import { createSignal, Switch, Match, type Component } from "solid-js";
import type { OnboardingContext, AttachedFile, ModelPath } from "@lib/types";
import { WelcomeStep } from "./WelcomeStep";
import { ModelPathStep } from "../ModelPathStep";
import { SubjectGradeStep } from "./SubjectGradeStep";
import { AssignmentStep } from "./AssignmentStep";
import { StudentWorkStep } from "./StudentWorkStep";
import { GradePreferenceStep } from "./GradePreferenceStep";
import { ModelSelectionStep } from "./ModelSelectionStep";
import { DEFAULT_MODEL_ID, getDefaultModelForPath } from "@config/models";

interface OnboardingFlowProps {
  onComplete: (context: OnboardingContext) => void;
  onSkip: () => void;
  initialContext?: OnboardingContext | null;
  isEditing?: boolean;
}

const TOTAL_STEPS = 6;

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
  // Use initial context model, or default model for the selected path, or global default
  const getInitialModel = () => {
    if (props.initialContext?.model) return props.initialContext.model;
    const path = props.initialContext?.modelPath ?? "privacy-first";
    return getDefaultModelForPath(path);
  };
  const [model, setModel] = createSignal(getInitialModel());

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
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    // When editing, don't go back to welcome or model path selection (step 0 or 1)
    const minStep = props.isEditing ? 2 : 0;
    setCurrentStep((prev) => Math.max(prev - 1, minStep));
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
            totalSteps={TOTAL_STEPS}
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
            totalSteps={TOTAL_STEPS}
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
            totalSteps={TOTAL_STEPS}
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
            totalSteps={TOTAL_STEPS}
          />
        </Match>

        <Match when={currentStep() === 5}>
          <GradePreferenceStep
            value={wantsGrade()}
            onChange={setWantsGrade}
            onNext={handleNext}
            onBack={handleBack}
            currentStep={4}
            totalSteps={TOTAL_STEPS}
          />
        </Match>

        <Match when={currentStep() === 6}>
          <ModelSelectionStep
            value={model()}
            onChange={setModel}
            onSubmit={handleSubmit}
            onBack={handleBack}
            currentStep={5}
            totalSteps={TOTAL_STEPS}
            subject={subject()}
            modelPath={modelPath()}
          />
        </Match>
      </Switch>
    </div>
  );
};
