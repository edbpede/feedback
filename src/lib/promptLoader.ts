/**
 * Server-side system prompt loader.
 * Loads subject-specific prompts from markdown files with caching.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SUBJECT_PROMPT_MAP, isValidSubject } from "@config/subjectPrompts";
import { SYSTEM_PROMPT } from "@config/systemPrompt";

/** Module-level cache for loaded prompts (persists across warm invocations) */
const promptCache = new Map<string, string>();

/** Base path to docs directory (relative to project root) */
const DOCS_PATH = join(process.cwd(), "docs");

/**
 * Load a subject-specific system prompt, falling back to unified prompt.
 *
 * @param subject - The subject key from onboarding
 * @returns The system prompt content
 */
export async function loadSystemPrompt(subject?: string): Promise<string> {
  // No subject provided - use unified prompt
  if (!subject) {
    return SYSTEM_PROMPT;
  }

  // Invalid subject - use unified prompt
  if (!isValidSubject(subject)) {
    console.warn(`[Prompt Loader] Unknown subject: ${subject}, using fallback`);
    return SYSTEM_PROMPT;
  }

  const promptKey = SUBJECT_PROMPT_MAP[subject];

  // Check cache first
  if (promptCache.has(promptKey)) {
    return promptCache.get(promptKey)!;
  }

  // Load from file
  const filePath = join(DOCS_PATH, `systemprompt-${promptKey}.md`);

  try {
    const content = await readFile(filePath, "utf-8");
    promptCache.set(promptKey, content);
    return content;
  } catch (error) {
    console.warn(
      `[Prompt Loader] Failed to load prompt for ${subject} from ${filePath}:`,
      error instanceof Error ? error.message : error
    );
    return SYSTEM_PROMPT;
  }
}

/**
 * Clear the prompt cache (useful for testing or hot reloading).
 */
export function clearPromptCache(): void {
  promptCache.clear();
}
