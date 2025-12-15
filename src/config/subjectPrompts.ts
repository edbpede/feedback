/**
 * Subject-specific system prompt configuration.
 * Maps UI subject keys to prompt markdown files in /docs/.
 */

/** Valid subject keys from SubjectGradeStep */
export type SubjectKey =
  | "dansk"
  | "matematik"
  | "engelsk"
  | "tysk"
  | "historie"
  | "samfundsfag"
  | "naturfag"
  | "kristendomskundskab";

/**
 * Mapping from UI subject key to prompt filename (without path and extension).
 * Files are located at /docs/systemprompt-{value}.md
 */
export const SUBJECT_PROMPT_MAP: Record<SubjectKey, string> = {
  dansk: "dansk",
  matematik: "matematik",
  engelsk: "engelsk",
  tysk: "tysk",
  historie: "historie",
  samfundsfag: "samfundsfag",
  naturfag: "fysikkemi", // Maps to fysikkemi as primary naturfag
  kristendomskundskab: "kristendom",
};

/** Set of valid subject keys for O(1) lookup */
const VALID_SUBJECT_KEYS = new Set<string>(Object.keys(SUBJECT_PROMPT_MAP));

/**
 * Check if a string is a valid subject key.
 */
export function isValidSubject(subject: string): subject is SubjectKey {
  return VALID_SUBJECT_KEYS.has(subject);
}
