import { SYSTEM_PROMPT as DEFAULT_PROMPT } from "../systemPrompt";
import { SYSTEM_PROMPT as DANSK } from "./dansk";
import { SYSTEM_PROMPT as MATEMATIK } from "./matematik";
import { SYSTEM_PROMPT as ENGELSK } from "./engelsk";
import { SYSTEM_PROMPT as TYSK } from "./tysk";
import { SYSTEM_PROMPT as HISTORIE } from "./historie";
import { SYSTEM_PROMPT as SAMFUNDSFAG } from "./samfundsfag";
import { SYSTEM_PROMPT as FYSIKKEMI } from "./fysikkemi";
import { SYSTEM_PROMPT as KRISTENDOM } from "./kristendom";
import { SYSTEM_PROMPT as GEOGRAFI } from "./geografi";
import { SYSTEM_PROMPT as BIOLOGI } from "./biologi";
import { SYSTEM_PROMPT as NATURTEKNOLOGI } from "./naturteknologi";
import { SYSTEM_PROMPT as BILLEDKUNST } from "./billedkunst";

export type SubjectKey =
  | "dansk"
  | "matematik"
  | "engelsk"
  | "tysk"
  | "historie"
  | "samfundsfag"
  | "fysikkemi"
  | "kristendom"
  | "geografi"
  | "biologi"
  | "naturteknologi"
  | "billedkunst"
  | "naturfag" // alias for fysikkemi
  | "kristendomskundskab"; // alias for kristendom

export const SUBJECT_PROMPTS: Record<string, string> = {
  dansk: DANSK,
  matematik: MATEMATIK,
  engelsk: ENGELSK,
  tysk: TYSK,
  historie: HISTORIE,
  samfundsfag: SAMFUNDSFAG,
  fysikkemi: FYSIKKEMI,
  kristendom: KRISTENDOM,
  geografi: GEOGRAFI,
  biologi: BIOLOGI,
  naturteknologi: NATURTEKNOLOGI,
  billedkunst: BILLEDKUNST,
  // Aliases
  naturfag: FYSIKKEMI,
  kristendomskundskab: KRISTENDOM,
};

export function getSystemPrompt(subject?: string): string {
  if (!subject) return DEFAULT_PROMPT;
  return SUBJECT_PROMPTS[subject] ?? DEFAULT_PROMPT;
}

export { DEFAULT_PROMPT as SYSTEM_PROMPT };
