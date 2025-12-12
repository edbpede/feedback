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

        <h2 class="text-xl font-bold mb-2 text-center">
          {t("onboarding.steps.subjectGrade.title")}
        </h2>
        <p class="text-muted-foreground mb-6 text-center">
          {t("onboarding.steps.subjectGrade.description")}
        </p>

        {/* Subject Selection */}
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <For each={SUBJECTS}>
            {(subject) => (
              <button
                type="button"
                onClick={() => props.onSubjectChange(subject.key)}
                class={`p-4 rounded-lg border-2 transition-all text-center ${
                  props.subject === subject.key
                    ? "border-primary bg-accent/20"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <span class="block text-2xl mb-1">{subject.icon}</span>
                <span class="text-sm font-medium">
                  {t(`onboarding.subjects.${subject.key}`)}
                </span>
              </button>
            )}
          </For>
        </div>

        {/* Grade Selection */}
        <div class="flex justify-center gap-2 mb-8">
          <For each={GRADES}>
            {(grade) => (
              <button
                type="button"
                onClick={() => props.onGradeChange(grade)}
                class={`px-4 py-2 rounded-full border-2 transition-all font-medium ${
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
