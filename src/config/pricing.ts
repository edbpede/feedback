/**
 * Pricing configuration for cost tracking.
 * Defines model pricing and currency conversion utilities.
 */

/** Pricing per 1M tokens in USD */
export interface ModelPricing {
  input: number;
  output: number;
}

/** USD to DKK exchange rate */
export const USD_TO_DKK = 7.0;

/**
 * Pricing for each model (per 1M tokens in USD).
 * These are estimates based on NanoGPT pricing - may need adjustment.
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // TEE Models (Privacy-First)
  "TEE/DeepSeek-v3.2": { input: 0.27, output: 1.1 },
  "TEE/gpt-oss-120b": { input: 1.5, output: 2.0 },
  "TEE/glm-4.6": { input: 0.5, output: 1.5 },
  "TEE/qwen3-coder": { input: 1.5, output: 2.0 },
  "TEE/gemma-3-27b-it": { input: 0.2, output: 0.8 },
  // Commercial Models (Enhanced Quality)
  "gpt-5.1": { input: 1.25, output: 10.0 },
  "x-ai/grok-4.1-fast": { input: 0.2, output: 0.5 },
  "gemini-3-pro-preview": { input: 2.0, output: 12.0 },
  "claude-sonnet-4-5-20250929": { input: 2.992, output: 14.994 },
};

/** Default pricing if model not found */
export const DEFAULT_PRICING: ModelPricing = { input: 1.0, output: 2.0 };

/**
 * Calculate cost in USD from token usage.
 */
export function calculateCostUsd(
  modelId: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[modelId] ?? DEFAULT_PRICING;
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Convert USD to DKK.
 */
export function usdToDkk(usd: number): number {
  return usd * USD_TO_DKK;
}

/**
 * Format DKK amount for display (Danish format).
 * Uses comma as decimal separator.
 * For amounts less than 1 kr, shows øre equivalent in parentheses.
 * @example formatDkk(0.05) -> "0,05 kr (5 øre)"
 * @example formatDkk(0.42) -> "0,42 kr (42 øre)"
 * @example formatDkk(1.5) -> "1,50 kr"
 */
export function formatDkk(dkk: number): string {
  const formatted = dkk.toFixed(2).replace(".", ",");
  if (dkk < 1) {
    const oere = Math.round(dkk * 100);
    return `${formatted} kr (${oere} øre)`;
  }
  return `${formatted} kr`;
}

/**
 * Format USD amount for display.
 * @example formatUsd(0.06) -> "$0.06"
 */
export function formatUsd(usd: number): string {
  return `$${usd.toFixed(2)}`;
}
