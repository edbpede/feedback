/**
 * Public entry point for the theme store.
 *
 * The reactive state lives in ./theme.svelte.ts because module-level $state is
 * only legal in .svelte / .svelte.ts files. This shim keeps the "@lib/theme"
 * import path and every call site unchanged.
 */
export {
  AVAILABLE_THEMES,
  DEFAULT_THEME,
  getTheme,
  initTheme,
  isDarkTheme,
  setTheme,
  toggleTheme,
} from "./theme.svelte";
export type { Theme } from "./theme.svelte";
