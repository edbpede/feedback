import { createSignal, createMemo } from "solid-js";
import type { Locale, Translations, TranslationKey } from "./types";

// Import locale files
import da from "./locales/da.json";
import en from "./locales/en.json";

/** Available locales mapped to their translations */
const locales: Record<Locale, Translations> = { da, en };

/** Default locale */
export const DEFAULT_LOCALE: Locale = "da";

/** LocalStorage key for persisting language preference */
const STORAGE_KEY = "preferred-language";

/** Available locale codes */
export const AVAILABLE_LOCALES: Locale[] = ["da", "en"];

/**
 * Get initial locale from localStorage or default
 */
function getInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && AVAILABLE_LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }
  return DEFAULT_LOCALE;
}

/** Current locale signal */
const [currentLocale, setCurrentLocaleInternal] = createSignal<Locale>(DEFAULT_LOCALE);

/** Flag to track if initialized on client */
let isInitialized = false;

/**
 * Initialize locale from localStorage (call in onMount)
 */
export function initLocale(): void {
  if (isInitialized) return;
  isInitialized = true;

  const initial = getInitialLocale();
  setCurrentLocaleInternal(initial);
  updateHtmlLang(initial);
}

/**
 * Update the html lang attribute
 */
function updateHtmlLang(locale: Locale): void {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
}

/**
 * Set the current locale and persist to localStorage
 */
export function setLocale(locale: Locale): void {
  setCurrentLocaleInternal(locale);
  updateHtmlLang(locale);

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, locale);
  }
}

/**
 * Get the current locale (reactive)
 */
export function getLocale(): Locale {
  return currentLocale();
}

/**
 * Get a nested value from an object using dot notation path
 */
function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return path; // Return key as fallback
    }
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "string" ? current : path;
}

/**
 * Get translation for a key with optional interpolation (reactive)
 * @param key - Translation key in dot notation
 * @param params - Optional object with values to interpolate (replaces {{key}} patterns)
 */
export function t(key: TranslationKey, params?: Record<string, string>): string {
  const locale = currentLocale();
  const translations = locales[locale];
  let result = getNestedValue(translations, key);

  // Interpolate {{key}} patterns if params provided
  if (params) {
    for (const [paramKey, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), value);
    }
  }

  return result;
}

/**
 * Create a reactive translation accessor
 * Use this when you need to pass translation to a component that expects a getter
 */
export function useTranslation(key: TranslationKey): () => string {
  return createMemo(() => t(key));
}

/**
 * Get all translations for current locale (reactive)
 */
export function getTranslations(): Translations {
  return locales[currentLocale()];
}

// Re-export types
export type { Locale, Translations, TranslationKey };
