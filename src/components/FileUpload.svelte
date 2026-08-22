<script lang="ts">
import { Button } from "@components/ui";
import { extractTextFromFile } from "@lib/fileParser";
import { t } from "@lib/i18n";

interface AttachedFile {
  name: string;
  content: string;
}

interface FileUploadProps {
  currentFile: AttachedFile | null;
  onFileProcessed: (file: AttachedFile) => void;
  onClear: () => void;
}

let { currentFile, onFileProcessed, onClear }: FileUploadProps = $props();

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

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
    onFileProcessed({ name: file.name, content });
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
  input.value = ""; // Reset for re-selection
};
</script>

<div class="px-4 pb-2">
  {#if !currentFile}
    <!-- biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop is a pointer-only
         enhancement on the wrapper; the keyboard-accessible path is the label + file input
         below. Giving this div an ARIA role would announce interactivity it does not have. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      ondrop={handleDrop}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      class="rounded-lg border-2 border-dashed p-3 text-center text-sm transition-colors duration-200 {isDragging
        ? 'border-primary bg-accent/20'
        : 'border-border'}"
    >
      {#if !isProcessing}
        <label class="text-muted-foreground cursor-pointer">
          <span class="i-carbon-upload mr-1 inline-block"></span>{t("fileUpload.dropzone")} <span
            class="text-primary hover:underline">{t("fileUpload.browse")}</span
          ><input type="file" accept=".docx,.pdf" onchange={handleFileSelect} class="hidden" />
        </label>
      {:else}
        <span class="text-muted-foreground">
          <span class="i-carbon-loading mr-2 inline-block animate-spin"></span>{t("fileUpload.processing")}
        </span>
      {/if}
    </div>
  {:else}
    <div
      class="bg-accent/20 flex items-center gap-2 rounded-lg p-2 transition-colors duration-200"
    >
      <span class="i-carbon-document text-primary"></span>
      <span class="flex-1 truncate text-sm">{currentFile?.name}</span>
      <Button
        variant="ghost"
        size="icon"
        onclick={() => onClear()}
        class="text-muted-foreground hover:text-destructive h-6 w-6"
      >
        <span class="i-carbon-close"></span>
      </Button>
    </div>
  {/if}

  {#if error}
    <p class="text-destructive mt-1 text-xs">{error}</p>
  {/if}
</div>
