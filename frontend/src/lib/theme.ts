export type ThemeMode = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "tujjar-dashboard-theme";

const VALID_MODES: ThemeMode[] = ["light", "dark", "system"];

export function isThemeMode(value: string | null): value is ThemeMode {
  return value !== null && (VALID_MODES as string[]).includes(value);
}

/** Resolve a mode (including `system`) to whether dark should apply. */
export function resolveTheme(mode: ThemeMode): boolean {
  if (mode === "system") {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return mode === "dark";
}

/**
 * Apply a theme mode to the document: toggles `.dark` on <html> and
 * persists the choice. Returns whether dark ended up applied.
 */
export function applyDocumentTheme(mode: ThemeMode): boolean {
  const dark = resolveTheme(mode);
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Private browsing / storage disabled: keep the toggle functional anyway.
  }
  return dark;
}

/** Read the persisted mode without throwing. Defaults to `system`. */
export function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeMode(stored)) return stored;
  } catch {
    // ignore
  }
  return "system";
}
