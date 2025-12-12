import { createSignal, Switch, Match, type Component } from "solid-js";
import type { OnboardingContext } from "@lib/types";
import { WelcomeStep } from "./WelcomeStep";
import { SubjectGradeStep } from "./SubjectGradeStep";
import { AssignmentStep } from "./AssignmentStep";
import { StudentWorkStep } from "./StudentWorkStep";
import { GradePreferenceStep } from "./GradePreferenceStep";

interface OnboardingFlowProps {
  onComplete: (context: OnboardingContext) => void;
  onSkip: () => void;
  initialContext?: OnboardingContext | null;
}

const TOTAL_STEPS = 4;

export const OnboardingFlow: Component<OnboardingFlowProps> = (props) => {
  const [currentStep, setCurrentStep] = createSignal(0);

  // Form data with optional initial values for editing
  const [subject, setSubject] = createSignal(props.initialContext?.subject ?? "");
  const [grade, setGrade] = createSignal(props.initialContext?.grade ?? "");
  const [assignmentDescription, setAssignmentDescription] = createSignal(
    props.initialContext?.assignmentDescription ?? ""
  );
  const [studentWork, setStudentWork] = createSignal(
    props.initialContext?.studentWork ?? ""
  );
  const [wantsGrade, setWantsGrade] = createSignal(
    props.initialContext?.wantsGrade ?? true
  );

  const handleStart = () => {
    setCurrentStep(1);
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    const context: OnboardingContext = {
      subject: subject(),
      grade: grade(),
      assignmentDescription: assignmentDescription(),
      studentWork: studentWork(),
      wantsGrade: wantsGrade(),
    };
    props.onComplete(context);
  };

  const handleSkipStep = () => {
    handleNext();
  };

  return (
    <div class="flex items-center justify-center min-h-screen p-4">
      <Switch>
        <Match when={currentStep() === 0}>
          <WelcomeStep onStart={handleStart} onSkip={() => props.onSkip()} />
        </Match>

        <Match when={currentStep() === 1}>
          <SubjectGradeStep
            subject={subject()}
            grade={grade()}
            onSubjectChange={setSubject}
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
            onSubmit={handleSubmit}
            onBack={handleBack}
            currentStep={3}
            totalSteps={TOTAL_STEPS}
          />
        </Match>
      </Switch>
    </div>
  );
};
