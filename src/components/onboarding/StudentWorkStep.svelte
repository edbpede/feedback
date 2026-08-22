<script lang="ts">
import { Button, Card, CardContent, Textarea } from "@components/ui";
import { extractTextFromFile } from "@lib/fileParser";
import { t } from "@lib/i18n";
import type { AttachedFile } from "@lib/types";
import { cn } from "@lib/utils";
import PrivacyWarning from "./PrivacyWarning.svelte";
import StepIndicator from "./StepIndicator.svelte";

interface StudentWorkStepProps {
  value: string;
  onChange: (value: string) => void;
  file: AttachedFile | null;
  onFileChange: (file: AttachedFile | null) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// `file` is renamed locally because the handlers below declare their own `file`
// bindings for the incoming File object; the rename keeps the two unambiguous.
let {
  value,
  onChange,
  file: attachedFile,
  onFileChange,
  onNext,
  onBack,
  onSkip,
  currentStep,
  totalSteps,
}: StudentWorkStepProps = $props();

let isDragging = $state(false);
let isProcessing = $state(false);
let error = $state("");

const processFile = async (file: File) => {
  error = "";

  if (!ACCEPTED_TYPES.includes(file.type)) {
    error = t("fileUpload.errorUnsupportedType");
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    error = t("fileUpload.errorFileTooLarge");
    return;
  }

  isProcessing = true;

  try {
    const content = await extractTextFromFile(file);
    onFileChange({ name: file.name, content });
  } catch (err) {
    error = `${t("fileUpload.errorExtractionFailed")} ${err instanceof Error ? err.message : "Unknown error"}`;
  } finally {
    isProcessing = false;
  }
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  isDragging = false;
  const file = e.dataTransfer?.files[0];
  if (file) processFile(file);
};

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  isDragging = true;
};

const handleDragLeave = () => {
  isDragging = false;
};

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) processFile(file);
  input.value = "";
};

const handleClearFile = () => {
  onFileChange(null);
  error = "";
};

// Allow proceeding if either file is uploaded OR text is entered
const canProceed = $derived(attachedFile !== null || value.trim().length > 0);
</script>

<Card class="w-full max-w-2xl">
  <CardContent class="pt-6">
    <StepIndicator {totalSteps} {currentStep} />

    <h2 class="mb-2 text-center text-xl font-bold">
      {t("onboarding.steps.studentWork.title")}
    </h2>
    <p class="text-muted-foreground mb-4 text-center text-sm">
      {t("onboarding.steps.studentWork.hint")}
    </p>

    <PrivacyWarning />

    <!-- File Upload Section -->
    <div class="mb-4 mt-4">
      {#if !attachedFile}
        <label
          ondrop={handleDrop}
          ondragover={handleDragOver}
          ondragleave={handleDragLeave}
          class={cn(
            "group relative flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200",
            isDragging
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-accent/10"
          )}
        >
          {#if !isProcessing}
            <!-- Upload icon -->
            <span
              class={cn(
                "i-carbon-cloud-upload text-4xl transition-colors duration-200",
                isDragging ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"
              )}
            ></span>

            <!-- Text content -->
            <div class="space-y-1">
              <p
                class={cn(
                  "font-medium transition-colors",
                  isDragging ? "text-primary" : "text-foreground"
                )}
              >
                {t("onboarding.steps.studentWork.dropLabel")}
              </p>
              <p class="text-muted-foreground text-sm">PDF, DOCX • max 10 MB</p>
            </div>

            <!-- Browse button (styled span allows click to pass through to parent label) -->
            <span
              class="border-input bg-background hover:bg-accent hover:text-accent-foreground mt-1 inline-flex h-8 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors"
            >
              <span class="i-carbon-folder"></span>
              {t("fileUpload.browse")}
            </span>

            <!-- Hidden file input -->
            <input type="file" accept=".docx,.pdf" onchange={handleFileSelect} class="hidden" />
          {:else}
            <div class="flex flex-col items-center gap-3 py-4">
              <span class="i-carbon-cloud-upload text-primary animate-pulse text-4xl"></span>
              <span class="text-muted-foreground flex items-center gap-2">
                <span class="i-carbon-loading animate-spin"></span>
                {t("fileUpload.processing")}
              </span>
            </div>
          {/if}
        </label>
      {:else}
        <div
          class="bg-primary/5 border-primary/20 flex items-center gap-3 rounded-xl border p-4 transition-all duration-200"
        >
          <div
            class="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          >
            <span class="i-carbon-document text-primary text-xl"></span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium">{attachedFile?.name}</p>
            <span class="text-muted-foreground text-sm">
              {t("onboarding.steps.studentWork.fileAttached")}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onclick={handleClearFile}
            title={t("onboarding.steps.studentWork.removeFile")}
            class="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 transition-colors"
          >
            <span class="i-carbon-close text-lg"></span>
          </Button>
        </div>
      {/if}

      {#if error}
        <p class="text-destructive mt-1 text-xs">{error}</p>
      {/if}
    </div>

    <!-- Text Area for additional notes -->
    <div class="mb-6">
      <Textarea
        class="min-h-32 resize-y"
        placeholder={t("onboarding.steps.studentWork.placeholder")}
        {value}
        oninput={(e) => onChange(e.currentTarget.value)}
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
          {t("onboarding.steps.studentWork.skipButton")}
        </Button>
        <Button onclick={() => onNext()} disabled={!canProceed}>
          {t("onboarding.navigation.next")}
          <span class="i-carbon-arrow-right ml-1"></span>
        </Button>
      </div>
    </div>
  </CardContent>
</Card>
