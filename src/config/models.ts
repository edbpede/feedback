/**
 * Model configuration for the multi-model selection feature.
 * Models are displayed in the onboarding flow for users to choose from.
 */

import type { TranslationKey } from "@lib/i18n";
import type { ModelPath } from "@lib/types";

export type PricingTier = "budget" | "standard" | "premium";
export type SpeedTier = "fast" | "medium" | "very-fast";

/** Supported AI provider identifiers */
export type AIProvider =
  | "DeepSeek"
  | "OpenAI"
  | "Zhipu AI"
  | "Alibaba"
  | "Google"
  | "Anthropic"
  | "xAI";

/** Model path type - TEE (privacy) or commercial */
export type ModelPathType = "tee" | "commercial";

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
  /** Whether this is a TEE (privacy-first) or commercial model */
  pathType: ModelPathType;
}

/**
 * Available models for user selection.
 * To add/remove models, modify this array.
 *
 * Models are categorized by pathType:
 * - "tee": TEE (Trusted Execution Environment) models with hardware encryption
 * - "commercial": Commercial models requiring PII anonymization
 */
export const AVAILABLE_MODELS: ModelConfig[] = [
  // ============================================================================
  // TEE Models (Privacy-First) - Hardware-encrypted, no PII anonymization needed
  // ============================================================================
  {
    id: "TEE/DeepSeek-v3.2",
    nameKey: "onboarding.models.deepseek.name",
    descriptionKey: "onboarding.models.deepseek.description",
    pricingTier: "budget",
    releaseDate: "Dec 2025",
    provider: "DeepSeek",
    speedTier: "fast",
    bestForKey: "onboarding.models.deepseek.bestFor",
    pathType: "tee",
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
    pathType: "tee",
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
    pathType: "tee",
  },
  {
    id: "TEE/qwen3-coder",
    nameKey: "onboarding.models.qwen.name",
    descriptionKey: "onboarding.models.qwen.description",
    pricingTier: "standard",
    releaseDate: "Jul 2025",
    provider: "Alibaba",
    speedTier: "fast",
    bestForKey: "onboarding.models.qwen.bestFor",
    pathType: "tee",
  },
  {
    id: "TEE/gemma-3-27b-it",
    nameKey: "onboarding.models.gemma.name",
    descriptionKey: "onboarding.models.gemma.description",
    pricingTier: "budget",
    releaseDate: "Mar 2025",
    provider: "Google",
    speedTier: "fast",
    bestForKey: "onboarding.models.gemma.bestFor",
    pathType: "tee",
  },

  // ============================================================================
  // Commercial Models (Enhanced Quality) - Require PII anonymization
  // ============================================================================
  {
    id: "gpt-5.1",
    nameKey: "onboarding.models.gpt5.name",
    descriptionKey: "onboarding.models.gpt5.description",
    pricingTier: "premium",
    releaseDate: "Nov 2025",
    provider: "OpenAI",
    speedTier: "medium",
    bestForKey: "onboarding.models.gpt5.bestFor",
    pathType: "commercial",
  },
  {
    id: "x-ai/grok-4.1-fast",
    nameKey: "onboarding.models.grok.name",
    descriptionKey: "onboarding.models.grok.description",
    pricingTier: "budget",
    releaseDate: "Dec 2025",
    provider: "xAI",
    speedTier: "very-fast",
    bestForKey: "onboarding.models.grok.bestFor",
    pathType: "commercial",
  },
  {
    id: "gemini-3-pro-preview",
    nameKey: "onboarding.models.gemini3.name",
    descriptionKey: "onboarding.models.gemini3.description",
    pricingTier: "premium",
    releaseDate: "Dec 2025",
    provider: "Google",
    speedTier: "medium",
    bestForKey: "onboarding.models.gemini3.bestFor",
    pathType: "commercial",
  },
  {
    id: "claude-sonnet-4-5-20250929",
    nameKey: "onboarding.models.claude.name",
    descriptionKey: "onboarding.models.claude.description",
    pricingTier: "premium",
    releaseDate: "Sep 2025",
    provider: "Anthropic",
    speedTier: "medium",
    bestForKey: "onboarding.models.claude.bestFor",
    pathType: "commercial",
  },
];

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
 * - GLM-4.6: Good for general discussion and quick responses
 * Subjects not listed fall back to DEFAULT_MODEL_ID.
 */
export const SUBJECT_MODEL_MAP: Record<string, string> = {
  matematik: "TEE/DeepSeek-v3.2",
  naturfag: "TEE/DeepSeek-v3.2",
  kristendomskundskab: "TEE/glm-4.6",
  dansk: "TEE/gemma-3-27b-it",
  engelsk: "TEE/gemma-3-27b-it",
  tysk: "TEE/gemma-3-27b-it",
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
  DeepSeek: {
    light: "/ai-providers/deepseek.svg",
    dark: "/ai-providers/deepseek.svg",
  },
  OpenAI: {
    light: "/ai-providers/openai-dark.svg",
    dark: "/ai-providers/openai-light.svg",
  },
  "Zhipu AI": {
    light: "/ai-providers/zhipu-ai-light.svg",
    dark: "/ai-providers/zhipu-ai.svg",
  },
  Alibaba: {
    light: "/ai-providers/qwen.svg",
    dark: "/ai-providers/qwen.svg",
  },
  Google: {
    light: "/ai-providers/gemini.svg",
    dark: "/ai-providers/gemini.svg",
  },
  Anthropic: {
    light: "/ai-providers/anthropic-dark.svg",
    dark: "/ai-providers/anthropic-light.svg",
  },
  xAI: {
    light: "/ai-providers/xai-dark.svg",
    dark: "/ai-providers/xai-light.svg",
  },
};

/**
 * Get the logo path for a provider based on the current theme.
 */
export function getProviderLogoPath(provider: AIProvider, theme: "light" | "dark"): string {
  return PROVIDER_LOGO_PATHS[provider][theme];
}

/**
 * Fallback model sort order for when the primary model fails.
 * Order: DeepSeek -> GPT-OSS -> Gemma -> GLM -> Qwen
 */
const FALLBACK_SORT_ORDER = [
  "TEE/DeepSeek-v3.2",
  "TEE/gpt-oss-120b",
  "TEE/gemma-3-27b-it",
  "TEE/glm-4.6",
  "TEE/qwen3-coder",
];

/**
 * Get available models for fallback selection, excluding the failed model.
 * Returns models sorted by fallback priority with the recommended model for the subject.
 */
export function getFallbackModels(
  failedModelId: string,
  subject?: string
): { models: ModelConfig[]; recommendedId: string | null } {
  const filtered = AVAILABLE_MODELS.filter((m) => m.id !== failedModelId).sort(
    (a, b) => FALLBACK_SORT_ORDER.indexOf(a.id) - FALLBACK_SORT_ORDER.indexOf(b.id)
  );

  const recommendedId = subject ? getRecommendedModelForSubject(subject) : null;
  const validRecommendedId = recommendedId !== failedModelId ? recommendedId : null;

  return { models: filtered, recommendedId: validRecommendedId };
}

/**
 * Models that don't support the "system" role and require strict user/assistant alternation.
 * For these models, the system prompt must be merged into the first user message.
 */
const STRICT_ALTERNATION_MODELS = new Set(["TEE/gemma-3-27b-it"]);

/**
 * Check if a model requires strict user/assistant role alternation (no system role support).
 */
export function requiresStrictAlternation(modelId: string): boolean {
  return STRICT_ALTERNATION_MODELS.has(modelId);
}

// ============================================================================
// GDPR Anonymization Feature - Model Path Helpers
// ============================================================================

/**
 * Model ID used for PII detection (always use a TEE model for privacy).
 * DeepSeek V3.2 has strong reasoning capabilities needed for accurate detection.
 */
export const PII_DETECTION_MODEL = "TEE/DeepSeek-v3.2";

/**
 * Default TEE model for privacy-first path.
 */
export const DEFAULT_TEE_MODEL_ID = "TEE/DeepSeek-v3.2";

/**
 * Default commercial model for enhanced-quality path.
 */
export const DEFAULT_COMMERCIAL_MODEL_ID = "gpt-5.1";

/**
 * Check if a model is a TEE (Trusted Execution Environment) model.
 * TEE models have hardware encryption and don't require client-side PII anonymization.
 */
export function isTEEModel(modelId: string): boolean {
  const model = getModelById(modelId);
  return model?.pathType === "tee";
}

/**
 * Check if a model requires PII anonymization before sending data.
 * Commercial (non-TEE) models require anonymization for GDPR compliance.
 */
export function requiresPIIAnonymization(modelId: string): boolean {
  return !isTEEModel(modelId);
}

/**
 * Get models filtered by path type.
 * @param path - The model path ("privacy-first" or "enhanced-quality")
 * @returns Array of models matching the path type
 */
export function getModelsForPath(path: ModelPath): ModelConfig[] {
  const pathType: ModelPathType = path === "privacy-first" ? "tee" : "commercial";
  return AVAILABLE_MODELS.filter((m) => m.pathType === pathType);
}

/**
 * Get the default model ID for a given path.
 */
export function getDefaultModelForPath(path: ModelPath): string {
  return path === "privacy-first" ? DEFAULT_TEE_MODEL_ID : DEFAULT_COMMERCIAL_MODEL_ID;
}
