<script lang="ts">
import { Button, Card, CardContent, Textarea } from "@components/ui";
import { t } from "@lib/i18n";
import StepIndicator from "./StepIndicator.svelte";

interface AssignmentStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

let { value, onChange, onNext, onBack, onSkip, currentStep, totalSteps }: AssignmentStepProps =
  $props();
</script>

<Card class="w-full max-w-2xl">
  <CardContent class="pt-6">
    <StepIndicator {totalSteps} {currentStep} />

    <h2 class="mb-2 text-center text-xl font-bold">{t("onboarding.steps.assignment.title")}</h2>
    <p class="text-muted-foreground mb-6 text-center text-sm">
      {t("onboarding.steps.assignment.hint")}
    </p>

    <div class="mb-6">
      <Textarea
        class="min-h-32 resize-y"
        placeholder={t("onboarding.steps.assignment.placeholder")}
        {value}
        oninput={(e) => onChange(e.currentTarget.value)}
        autofocus
      />
    </div>

    <!-- Navigation -->
    <div class="flex items-center justify-between">
      <Button variant="secondary" onclick={() => onBack()}>
        <span class="i-carbon-arrow-left mr-1"></span>
        {t("onboarding.navigation.back")}
      </Button>

      <div class="flex items-center gap-2">
        <Button variant="link" onclick={() => onSkip()} class="text-muted-foreground">
          {t("onboarding.steps.assignment.skipButton")}
        </Button>
        <Button onclick={() => onNext()} disabled={!value.trim()}>
          {t("onboarding.navigation.next")}
          <span class="i-carbon-arrow-right ml-1"></span>
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
