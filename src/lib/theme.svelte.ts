/** Supported theme modes */
export type Theme = "dark" | "light";

/** Default theme - dark mode as requested */
export const DEFAULT_THEME: Theme = "dark";

/** LocalStorage key for persisting theme preference */
const STORAGE_KEY = "theme-preference";

/** Available themes */
export const AVAILABLE_THEMES: Theme[] = ["dark", "light"];

/**
 * Get initial theme from localStorage or default
 */
function getInitialTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && AVAILABLE_THEMES.includes(stored as Theme)) {
    return stored as Theme;
  }
  return DEFAULT_THEME;
}

/** Current theme state */
let currentTheme = $state<Theme>(DEFAULT_THEME);

/** Flag to track if initialized on client */
let isInitialized = false;

/**
 * Apply the theme to the document element
 * Uses the `.dark` class, the shadcn/UnoCSS convention: it is what the
 * hand-written dark palette rule in src/styles/globals.css selects on, what the
 * `dark:` variant compiles against, and what the anti-FOUC inline script in
 * src/pages/index.astro sets before this island hydrates
 */
function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/**
 * Initialize theme from localStorage (call in onMount)
 * This syncs the state with what the inline script already applied.
 *
 * Re-applying is redundant on the happy path and idempotent, but it is what
 * makes the theme recoverable: if the inline script never ran — a stale CSP
 * hash in vercel.json blocks it outright — the stored preference would
 * otherwise never be applied at all, leaving the wrong theme up for the whole
 * session instead of for the moment before this island hydrates.
 */
export function initTheme(): void {
  if (isInitialized) return;
  isInitialized = true;

  const initial = getInitialTheme();
  currentTheme = initial;
  applyTheme(initial);
}

/**
 * Set the current theme and persist to localStorage
 */
export function setTheme(theme: Theme): void {
  currentTheme = theme;
  applyTheme(theme);

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, theme);
  }
}

/**
 * Toggle between dark and light themes
 */
export function toggleTheme(): void {
  const current = currentTheme;
  const next: Theme = current === "dark" ? "light" : "dark";
  setTheme(next);
}

/**
 * Get the current theme (reactive)
 */
export function getTheme(): Theme {
  return currentTheme;
}

/**
 * Check if current theme is dark (reactive)
 */
export function isDarkTheme(): boolean {
  return currentTheme === "dark";
}
