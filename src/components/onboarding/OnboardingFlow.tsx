import { createSignal, Switch, Match, type Component } from "solid-js";
import type { OnboardingContext, AttachedFile, ModelPath } from "@lib/types";
import { WelcomeStep } from "./WelcomeStep";
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
  /** Selected model path (privacy-first or enhanced-quality) */
  modelPath?: ModelPath | null;
}

const TOTAL_STEPS = 5;

export const OnboardingFlow: Component<OnboardingFlowProps> = (props) => {
  // Start at step 1 (SubjectGradeStep) when editing, step 0 (WelcomeStep) otherwise
  const [currentStep, setCurrentStep] = createSignal(
    props.isEditing && props.initialContext ? 1 : 0
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
    if (props.modelPath) return getDefaultModelForPath(props.modelPath);
    return DEFAULT_MODEL_ID;
  };
  const [model, setModel] = createSignal(getInitialModel());

  const handleStart = () => {
    setCurrentStep(1);
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    // When editing, don't go back to welcome screen (step 0)
    const minStep = props.isEditing ? 1 : 0;
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
          <SubjectGradeStep
            subject={subject()}
            grade={grade()}
            onSubjectChange={handleSubjectChange}
            onGradeChange={setGrade}
            onNext={handleNext}
            onBack={handleBack}
            currentStep={0}
            totalSteps={TOTAL_STEPS}
          />
        </Match>

        <Match when={currentStep() === 2}>
          <AssignmentStep
            value={assignmentDescription()}
            onChange={setAssignmentDescription}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkipStep}
            currentStep={1}
            totalSteps={TOTAL_STEPS}
          />
        </Match>

        <Match when={currentStep() === 3}>
          <StudentWorkStep
            value={studentWork()}
            onChange={setStudentWork}
            file={studentWorkFile()}
            onFileChange={setStudentWorkFile}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkipStep}
            currentStep={2}
            totalSteps={TOTAL_STEPS}
          />
        </Match>

        <Match when={currentStep() === 4}>
          <GradePreferenceStep
            value={wantsGrade()}
            onChange={setWantsGrade}
            onNext={handleNext}
            onBack={handleBack}
            currentStep={3}
            totalSteps={TOTAL_STEPS}
          />
        </Match>

        <Match when={currentStep() === 5}>
          <ModelSelectionStep
            value={model()}
            onChange={setModel}
            onSubmit={handleSubmit}
            onBack={handleBack}
            currentStep={4}
            totalSteps={TOTAL_STEPS}
            subject={subject()}
            modelPath={props.modelPath}
          />
        </Match>
      </Switch>
    </div>
  );
};
