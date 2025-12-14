import { createSignal, Show, type Component } from "solid-js";
import { t } from "@lib/i18n";
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
              <div class="bg-accent/20 flex items-center gap-2 rounded-lg p-3 transition-colors duration-200">
                <span class="i-carbon-document text-primary text-xl" />
                <div class="min-w-0 flex-1">
                  <span class="text-muted-foreground text-sm">
                    {t("onboarding.steps.studentWork.fileAttached")}
                  </span>
                  <p class="truncate font-medium">{props.file?.name}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearFile}
                  title={t("onboarding.steps.studentWork.removeFile")}
                  class="text-muted-foreground hover:text-destructive h-8 w-8"
                >
                  <span class="i-carbon-close text-lg" />
                </Button>
              </div>
            }
          >
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              class={`rounded-lg border-2 border-dashed p-4 text-center transition-colors duration-200 ${
                isDragging() ? "border-primary bg-accent/20" : "border-border"
              }`}
            >
              <Show
                when={!isProcessing()}
                fallback={
                  <span class="text-muted-foreground">
                    <span class="i-carbon-loading mr-2 inline-block animate-spin" />
                    {t("fileUpload.processing")}
                  </span>
                }
              >
                <label class="text-muted-foreground cursor-pointer">
                  <span class="i-carbon-upload mr-1 inline-block" />
                  {t("onboarding.steps.studentWork.uploadLabel")}{" "}
                  <span class="text-primary hover:underline">{t("fileUpload.browse")}</span>
                  <input
                    type="file"
                    accept=".docx,.pdf"
                    onChange={handleFileSelect}
                    class="hidden"
                  />
                </label>
              </Show>
            </div>
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
