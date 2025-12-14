import type { Component } from "solid-js";
import { For } from "solid-js";
import { t } from "@lib/i18n";
import { StepIndicator } from "./StepIndicator";
import { Card, CardContent } from "@components/ui/card";
import { Button } from "@components/ui/button";

interface SubjectGradeStepProps {
  subject: string;
  grade: string;
  onSubjectChange: (subject: string) => void;
  onGradeChange: (grade: string) => void;
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

const SUBJECTS = [
  { key: "dansk", icon: "📚" },
  { key: "matematik", icon: "🔢" },
  { key: "engelsk", icon: "🇬🇧" },
  { key: "tysk", icon: "🇩🇪" },
  { key: "historie", icon: "🏛️" },
  { key: "samfundsfag", icon: "🌍" },
  { key: "naturfag", icon: "🔬" },
  { key: "kristendomskundskab", icon: "✝️" },
] as const;

const GRADES = ["grade7", "grade8", "grade9"] as const;

export const SubjectGradeStep: Component<SubjectGradeStepProps> = (props) => {
  const canProceed = () => props.subject !== "" && props.grade !== "";

  return (
    <Card class="w-full max-w-2xl">
      <CardContent class="pt-6">
        <StepIndicator totalSteps={props.totalSteps} currentStep={props.currentStep} />

        <h2 class="mb-2 text-center text-xl font-bold">
          {t("onboarding.steps.subjectGrade.title")}
        </h2>
        <p class="text-muted-foreground mb-6 text-center">
          {t("onboarding.steps.subjectGrade.description")}
        </p>

        {/* Subject Selection */}
        <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <For each={SUBJECTS}>
            {(subject) => (
              <button
                type="button"
                onClick={() => props.onSubjectChange(subject.key)}
                class={`rounded-lg border-2 p-4 text-center transition-all ${
                  props.subject === subject.key
                    ? "border-primary bg-accent/20"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <span class="mb-1 block text-2xl">{subject.icon}</span>
                <span class="text-sm font-medium">{t(`onboarding.subjects.${subject.key}`)}</span>
              </button>
            )}
          </For>
        </div>

        {/* Grade Selection */}
        <div class="mb-8 flex justify-center gap-2">
          <For each={GRADES}>
            {(grade) => (
              <button
                type="button"
                onClick={() => props.onGradeChange(grade)}
                class={`rounded-full border-2 px-4 py-2 font-medium transition-all ${
                  props.grade === grade
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                {t(`onboarding.grades.${grade}`)}
              </button>
            )}
          </For>
        </div>

        {/* Navigation */}
        <div class="flex justify-between">
          <Button variant="secondary" onClick={() => props.onBack()}>
            <span class="i-carbon-arrow-left mr-1" />
            {t("onboarding.navigation.back")}
          </Button>
          <Button onClick={() => props.onNext()} disabled={!canProceed()}>
            {t("onboarding.navigation.next")}
            <span class="i-carbon-arrow-right ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
