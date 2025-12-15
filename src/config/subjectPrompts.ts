/**
 * Subject-specific system prompt configuration.
 * Re-exports types and utilities from systemPrompts module.
 */

import { SubjectKey, SUBJECT_PROMPTS } from "./systemPrompts";

export type { SubjectKey };

/**
 * Mapping from UI subject key to prompt key.
 * Now points directly to the SUBJECT_PROMPTS keys.
 */
export const SUBJECT_PROMPT_MAP: Record<SubjectKey, string> = {
  dansk: "dansk",
  matematik: "matematik",
  engelsk: "engelsk",
  tysk: "tysk",
  historie: "historie",
  samfundsfag: "samfundsfag",
  fysikkemi: "fysikkemi",
  kristendom: "kristendom",
  geografi: "geografi",
  biologi: "biologi",
  naturteknologi: "naturteknologi",
  billedkunst: "billedkunst",
  naturfag: "fysikkemi", // alias
  kristendomskundskab: "kristendom", // alias
};

/** Set of valid subject keys for O(1) lookup */
const VALID_SUBJECT_KEYS = new Set<string>(Object.keys(SUBJECT_PROMPTS));

/**
 * Check if a string is a valid subject key.
 */
export function isValidSubject(subject: string): subject is SubjectKey {
  return VALID_SUBJECT_KEYS.has(subject);
}
