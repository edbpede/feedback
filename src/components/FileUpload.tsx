import { createSignal, Show, type Component } from "solid-js";
import { extractTextFromFile } from "@lib/fileParser";

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
      setError("Only DOCX and PDF files are supported.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than 10MB.");
      return;
    }

    setIsProcessing(true);

    try {
      const content = await extractTextFromFile(file);
      props.onFileProcessed({ name: file.name, content });
    } catch (err) {
      setError(
        `Failed to extract text: ${err instanceof Error ? err.message : "Unknown error"}`
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
          <div class="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span class="i-carbon-document text-blue-600" />
            <span class="flex-1 text-sm truncate">{props.currentFile?.name}</span>
            <button
              type="button"
              onClick={() => props.onClear()}
              class="text-gray-500 hover:text-red-500"
            >
              <span class="i-carbon-close" />
            </button>
          </div>
        }
      >
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          class={`border-2 border-dashed rounded-lg p-3 text-center text-sm transition-colors ${
            isDragging()
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600"
          }`}
        >
          <Show
            when={!isProcessing()}
            fallback={
              <span class="text-gray-500">
                <span class="i-carbon-loading animate-spin inline-block mr-2" />
                Processing...
              </span>
            }
          >
            <label class="cursor-pointer text-gray-500 dark:text-gray-400">
              <span class="i-carbon-upload inline-block mr-1" />
              Drop DOCX/PDF here or{" "}
              <span class="text-blue-600 hover:underline">browse</span>
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
        <p class="text-red-600 dark:text-red-400 text-xs mt-1">{error()}</p>
      </Show>
    </div>
  );
};
