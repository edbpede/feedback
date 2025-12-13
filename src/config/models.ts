/**
 * Model configuration for the multi-model selection feature.
 * Models are displayed in the onboarding flow for users to choose from.
 */

import type { TranslationKey } from "@lib/i18n";

export type PricingTier = "budget" | "standard" | "premium";
export type SpeedTier = "fast" | "medium" | "very-fast";

/** Supported AI provider identifiers */
export type AIProvider = "DeepSeek" | "OpenAI" | "Zhipu AI";

export interface ModelConfig {
  /** Unique model identifier sent to the API */
  id: string;
  /** i18n key for the model display name */
  nameKey: TranslationKey;
  /** i18n key for the model description */
  descriptionKey: TranslationKey;
  /** Pricing tier for badge display */
  pricingTier: PricingTier;
  /** Release date for display (e.g., "Dec 2025") */
  releaseDate: string;
  /** Company/organization that created the model */
  provider: AIProvider;
  /** Speed tier for badge display */
  speedTier: SpeedTier;
  /** i18n key for what the model is best suited for */
  bestForKey: TranslationKey;
}

/**
 * Available models for user selection.
 * To add/remove models, modify this array.
 */
export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "TEE/DeepSeek-v3.2",
    nameKey: "onboarding.models.deepseek.name",
    descriptionKey: "onboarding.models.deepseek.description",
    pricingTier: "budget",
    releaseDate: "Dec 2025",
    provider: "DeepSeek",
    speedTier: "fast",
    bestForKey: "onboarding.models.deepseek.bestFor",
  },
  {
    id: "TEE/gpt-oss-120b",
    nameKey: "onboarding.models.gptoss.name",
    descriptionKey: "onboarding.models.gptoss.description",
    pricingTier: "standard",
    releaseDate: "Aug 2025",
    provider: "OpenAI",
    speedTier: "medium",
    bestForKey: "onboarding.models.gptoss.bestFor",
  },
  {
    id: "TEE/glm-4.6",
    nameKey: "onboarding.models.glm.name",
    descriptionKey: "onboarding.models.glm.description",
    pricingTier: "standard",
    releaseDate: "Dec 2025",
    provider: "Zhipu AI",
    speedTier: "very-fast",
    bestForKey: "onboarding.models.glm.bestFor",
  },
] as const;

/** Set of valid model IDs for quick lookup */
export const VALID_MODEL_IDS = new Set(AVAILABLE_MODELS.map((m) => m.id));

/**
 * Get the default model ID from environment or fallback.
 * Note: This only works on the client side with public env vars.
 * For server-side, use NANO_GPT_MODEL from astro:env/server.
 */
export const DEFAULT_MODEL_ID = "TEE/DeepSeek-v3.2";

/**
 * Subject to recommended model mapping.
 * Maps Danish school subjects to the most suitable AI model based on their strengths:
 * - DeepSeek V3.2: Best for math and science (strong reasoning capabilities)
 * - GPT-OSS 120B: Best for writing, language, and text analysis
 * - GLM-4.6: Good for general discussion and quick responses
 */
export const SUBJECT_MODEL_MAP: Record<string, string> = {
  matematik: "TEE/DeepSeek-v3.2",
  naturfag: "TEE/DeepSeek-v3.2",
  dansk: "TEE/gpt-oss-120b",
  engelsk: "TEE/gpt-oss-120b",
  tysk: "TEE/gpt-oss-120b",
  historie: "TEE/gpt-oss-120b",
  samfundsfag: "TEE/gpt-oss-120b",
  kristendomskundskab: "TEE/glm-4.6",
};

/**
 * Get the recommended model for a given subject.
 * Falls back to DEFAULT_MODEL_ID if subject is not mapped.
 */
export function getRecommendedModelForSubject(subject: string): string {
  return SUBJECT_MODEL_MAP[subject] ?? DEFAULT_MODEL_ID;
}

/**
 * Check if a model ID is valid.
 */
export function isValidModel(modelId: string): boolean {
  return VALID_MODEL_IDS.has(modelId);
}

/**
 * Get model config by ID, or undefined if not found.
 */
export function getModelById(modelId: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === modelId);
}

/**
 * Logo paths for each AI provider, with theme variants.
 * - light: Logo for light theme (dark-colored logo)
 * - dark: Logo for dark theme (light-colored logo)
 */
export const PROVIDER_LOGO_PATHS: Record<AIProvider, { light: string; dark: string }> = {
  "DeepSeek": {
    light: "/ai-providers/deepseek.svg",
    dark: "/ai-providers/deepseek.svg",
  },
  "OpenAI": {
    light: "/ai-providers/openai-dark.svg",
    dark: "/ai-providers/openai-light.svg",
  },
  "Zhipu AI": {
    light: "/ai-providers/zhipu-ai-light.svg",
    dark: "/ai-providers/zhipu-ai.svg",
  },
};

/**
 * Get the logo path for a provider based on the current theme.
 */
export function getProviderLogoPath(provider: AIProvider, theme: "light" | "dark"): string {
  return PROVIDER_LOGO_PATHS[provider][theme];
}
