/**
 * Public entry point for the i18n store.
 *
 * The reactive state lives in ./i18n.svelte.ts because module-level $state is
 * only legal in .svelte / .svelte.ts files. This shim keeps the "@lib/i18n"
 * import path and every call site unchanged.
 */
export {
  AVAILABLE_LOCALES,
  DEFAULT_LOCALE,
  getLocale,
  getTranslations,
  initLocale,
  setLocale,
  t,
} from "./i18n.svelte";

// Re-export types
export type { Locale, TranslationKey, Translations } from "./types";
