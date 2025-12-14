import { createSignal, Show, type Component } from "solid-js";
import { t } from "@lib/i18n";
import { cn } from "@lib/utils";
import { StepIndicator } from "./StepIndicator";
import { PrivacyWarning } from "./PrivacyWarning";
import { extractTextFromFile } from "@lib/fileParser";
import type { AttachedFile } from "@lib/types";
import { Card, CardContent } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Textarea } from "@components/ui/textarea";

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

export const StudentWorkStep: Component<StudentWorkStepProps> = (props) => {
  const [isDragging, setIsDragging] = createSignal(false);
  const [isProcessing, setIsProcessing] = createSignal(false);
  const [error, setError] = createSignal("");

  const processFile = async (file: File) => {
    setError("");

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(t("fileUpload.errorUnsupportedType"));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(t("fileUpload.errorFileTooLarge"));
      return;
    }

    setIsProcessing(true);

    try {
      const content = await extractTextFromFile(file);
      props.onFileChange({ name: file.name, content });
    } catch (err) {
      setError(
        `${t("fileUpload.errorExtractionFailed")} ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) processFile(file);
    input.value = "";
  };

  const handleClearFile = () => {
    props.onFileChange(null);
    setError("");
  };

  // Allow proceeding if either file is uploaded OR text is entered
  const canProceed = () => props.file !== null || props.value.trim().length > 0;

  return (
    <Card class="w-full max-w-2xl">
      <CardContent class="pt-6">
        <StepIndicator totalSteps={props.totalSteps} currentStep={props.currentStep} />

        <h2 class="mb-2 text-center text-xl font-bold">
          {t("onboarding.steps.studentWork.title")}
        </h2>
        <p class="text-muted-foreground mb-4 text-center text-sm">
          {t("onboarding.steps.studentWork.hint")}
        </p>

        <PrivacyWarning />

        {/* File Upload Section */}
        <div class="mb-4 mt-4">
          <Show
            when={!props.file}
            fallback={
              <div class="bg-primary/5 border-primary/20 flex items-center gap-3 rounded-xl border p-4 transition-all duration-200">
                <div class="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                  <span class="i-carbon-document text-primary text-xl" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-medium">{props.file?.name}</p>
                  <span class="text-muted-foreground text-sm">
                    {t("onboarding.steps.studentWork.fileAttached")}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearFile}
                  title={t("onboarding.steps.studentWork.removeFile")}
                  class="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 transition-colors"
                >
                  <span class="i-carbon-close text-lg" />
                </Button>
              </div>
            }
          >
            <label
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              class={cn(
                "group relative flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200",
                isDragging()
                  ? "border-primary bg-primary/10 scale-[1.01]"
                  : "border-border hover:border-primary/50 hover:bg-accent/10"
              )}
            >
              <Show
                when={!isProcessing()}
                fallback={
                  <div class="flex flex-col items-center gap-3 py-4">
                    <span class="i-carbon-cloud-upload text-primary animate-pulse text-4xl" />
                    <span class="text-muted-foreground flex items-center gap-2">
                      <span class="i-carbon-loading animate-spin" />
                      {t("fileUpload.processing")}
                    </span>
                  </div>
                }
              >
                {/* Upload icon */}
                <span
                  class={cn(
                    "i-carbon-cloud-upload text-4xl transition-colors duration-200",
                    isDragging()
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-primary/70"
                  )}
                />

                {/* Text content */}
                <div class="space-y-1">
                  <p
                    class={cn(
                      "font-medium transition-colors",
                      isDragging() ? "text-primary" : "text-foreground"
                    )}
                  >
                    {t("onboarding.steps.studentWork.dropLabel")}
                  </p>
                  <p class="text-muted-foreground text-sm">PDF, DOCX • max 10 MB</p>
                </div>

                {/* Browse button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="pointer-events-none mt-1"
                >
                  <span class="i-carbon-folder mr-2" />
                  {t("fileUpload.browse")}
                </Button>

                {/* Hidden file input */}
                <input
                  type="file"
                  accept=".docx,.pdf"
                  onChange={handleFileSelect}
                  class="hidden"
                />
              </Show>
            </label>
          </Show>

          <Show when={error()}>
            <p class="text-destructive mt-1 text-xs">{error()}</p>
          </Show>
        </div>

        {/* Text Area for additional notes */}
        <div class="mb-6">
          <Textarea
            class="min-h-32 resize-y"
            placeholder={t("onboarding.steps.studentWork.placeholder")}
            value={props.value}
            onInput={(e) => props.onChange(e.currentTarget.value)}
          />
        </div>

        {/* Navigation */}
        <div class="flex items-center justify-between">
          <Button variant="secondary" onClick={() => props.onBack()}>
            <span class="i-carbon-arrow-left mr-1" />
            {t("onboarding.navigation.back")}
          </Button>

          <div class="flex items-center gap-2">
            <Button variant="link" onClick={() => props.onSkip()} class="text-muted-foreground">
              {t("onboarding.steps.studentWork.skipButton")}
            </Button>
            <Button onClick={() => props.onNext()} disabled={!canProceed()}>
              {t("onboarding.navigation.next")}
              <span class="i-carbon-arrow-right ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
