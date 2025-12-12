import { createSignal, Show, type Component } from "solid-js";
import { extractTextFromFile } from "@lib/fileParser";
import { t } from "@lib/i18n";
import { Button } from "@components/ui/button";

interface AttachedFile {
  name: string;
  content: string;
}

interface FileUploadProps {
  currentFile: AttachedFile | null;
  onFileProcessed: (file: AttachedFile) => void;
  onClear: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const FileUpload: Component<FileUploadProps> = (props) => {
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
      props.onFileProcessed({ name: file.name, content });
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
    input.value = ""; // Reset for re-selection
  };

  return (
    <div class="px-4 pb-2">
      <Show
        when={!props.currentFile}
        fallback={
          <div class="flex items-center gap-2 p-2 bg-accent/20 rounded-lg transition-colors duration-200">
            <span class="i-carbon-document text-primary" />
            <span class="flex-1 text-sm truncate">{props.currentFile?.name}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => props.onClear()}
              class="h-6 w-6 text-muted-foreground hover:text-destructive"
            >
              <span class="i-carbon-close" />
            </Button>
          </div>
        }
      >
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          class={`border-2 border-dashed rounded-lg p-3 text-center text-sm transition-colors duration-200 ${
            isDragging()
              ? "border-primary bg-accent/20"
              : "border-border"
          }`}
        >
          <Show
            when={!isProcessing()}
            fallback={
              <span class="text-muted-foreground">
                <span class="i-carbon-loading animate-spin inline-block mr-2" />
                {t("fileUpload.processing")}
              </span>
            }
          >
            <label class="cursor-pointer text-muted-foreground">
              <span class="i-carbon-upload inline-block mr-1" />
              {t("fileUpload.dropzone")}{" "}
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
        <p class="text-destructive text-xs mt-1">{error()}</p>
      </Show>
    </div>
  );
};
