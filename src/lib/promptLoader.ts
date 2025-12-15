/**
 * Server-side system prompt loader.
 * Loads subject-specific prompts from TypeScript modules.
 */
import { getSystemPrompt } from "@config/systemPrompts";

/**
 * Load a subject-specific system prompt, falling back to unified prompt.
 *
 * @param subject - The subject key from onboarding
 * @returns The system prompt content
 */
export function loadSystemPrompt(subject?: string): string {
  return getSystemPrompt(subject);
}

/**
 * Clear the prompt cache (no-op - kept for backwards compatibility).
 * With static imports, no caching is needed.
 */
export function clearPromptCache(): void {
  // No-op - prompts are now bundled at build time
}
