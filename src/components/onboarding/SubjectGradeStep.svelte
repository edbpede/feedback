<script lang="ts">
  import { Button, Card, CardContent } from "@components/ui";
  import { t } from "@lib/i18n";
  import StepIndicator from "./StepIndicator.svelte";

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

  // `subject`/`grade` are renamed locally because the {#each} item variables below
  // are named `subject` and `grade`; without the rename they would shadow the props
  // and the selected-state comparisons would silently compare an item with itself.
  let {
    subject: selectedSubject,
    grade: selectedGrade,
    onSubjectChange,
    onGradeChange,
    onNext,
    onBack,
    currentStep,
    totalSteps,
  }: SubjectGradeStepProps = $props();

  const canProceed = $derived(selectedSubject !== "" && selectedGrade !== "");
</script>

<Card class="w-full max-w-2xl">
  <CardContent class="pt-6">
    <StepIndicator {totalSteps} {currentStep} />

    <h2 class="mb-2 text-center text-xl font-bold">
      {t("onboarding.steps.subjectGrade.title")}
    </h2>
    <p class="text-muted-foreground mb-6 text-center">
      {t("onboarding.steps.subjectGrade.description")}
    </p>

    <!-- Subject Selection -->
    <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {#each SUBJECTS as subject (subject.key)}
        <button
          type="button"
          onclick={() => onSubjectChange(subject.key)}
          class={`rounded-lg border-2 p-4 text-center transition-all ${
            selectedSubject === subject.key
              ? "border-primary bg-accent/20"
              : "border-border hover:border-muted-foreground"
          }`}
        >
          <span class="mb-1 block text-2xl">{subject.icon}</span>
          <span class="text-sm font-medium">{t(`onboarding.subjects.${subject.key}`)}</span>
        </button>
      {/each}
    </div>

    <!-- Grade Selection -->
    <div class="mb-8 flex justify-center gap-2">
      {#each GRADES as grade, i (i)}
        <button
          type="button"
          onclick={() => onGradeChange(grade)}
          class={`rounded-full border-2 px-4 py-2 font-medium transition-all ${
            selectedGrade === grade
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:border-muted-foreground"
          }`}
        >
          {t(`onboarding.grades.${grade}`)}
        </button>
      {/each}
    </div>

    <!-- Navigation -->
    <div class="flex justify-between">
      <Button variant="secondary" onclick={() => onBack()}>
        <span class="i-carbon-arrow-left mr-1"></span>
        {t("onboarding.navigation.back")}
      </Button>
      <Button onclick={() => onNext()} disabled={!canProceed}>
        {t("onboarding.navigation.next")}
        <span class="i-carbon-arrow-right ml-1"></span>
      </Button>
    </div>
  </CardContent>
</Card>
