import type en from "./locales/en.json";

/** Supported locale codes */
export type Locale = "da" | "en";

/** Translation structure derived from English (source) locale */
export type Translations = typeof en;

/** Flatten nested object keys into dot notation for type-safe access */
export type FlattenKeys<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? FlattenKeys<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`
        : never;
    }[keyof T]
  : never;

/** All valid translation keys in dot notation */
export type TranslationKey = FlattenKeys<Translations>;
