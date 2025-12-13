/**
 * Model configuration for the multi-model selection feature.
 * Models are displayed in the onboarding flow for users to choose from.
 */

export type PricingTier = "budget" | "standard" | "premium";
export type SpeedTier = "fast" | "medium" | "very-fast";

export interface ModelConfig {
  /** Unique model identifier sent to the API */
  id: string;
  /** i18n key for the model display name */
  nameKey: string;
  /** i18n key for the model description */
  descriptionKey: string;
  /** Pricing tier for badge display */
  pricingTier: PricingTier;
  /** Release date for display (e.g., "Dec 2025") */
  releaseDate: string;
  /** Company/organization that created the model */
  provider: string;
  /** Speed tier for badge display */
  speedTier: SpeedTier;
  /** i18n key for what the model is best suited for */
  bestForKey: string;
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
