/**
 * PatternFly 6 theme classes on <html>. Tailwind `dark` is kept in sync for app shell utilities.
 * Project Felt: add `pf-v6-theme-felt` per PatternFly theming docs (replaces legacy redhat class in PF 6.5).
 * Glass mode: add `pf-v6-theme-glass` per PatternFly glass mode handbook.
 * @see https://www.patternfly.org/v6/foundations-and-styles/theming
 * @see https://www.patternfly.org/v6/foundations-and-styles/styles/theming/glass-mode-handbook
 */
export const PF_THEME_FELT_CLASS = "pf-v6-theme-felt";
export const PF_THEME_DARK_CLASS = "pf-v6-theme-dark";
export const PF_THEME_GLASS_CLASS = "pf-v6-theme-glass";

const STORAGE_KEY = "ocp5-cluster-update-experience:theme";

export type ThemePreferences = {
  dark: boolean;
  glass: boolean;
};

const DEFAULT_PREFERENCES: ThemePreferences = {
  dark: true,
  glass: true,
};

function systemPrefersReducedTransparency(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
}

/** User preference + OS accessibility: glass blur only when both allow it. */
export function isGlassEffectEnabled(prefs: ThemePreferences): boolean {
  return prefs.glass && !systemPrefersReducedTransparency();
}

export function readThemePreferences(): ThemePreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<ThemePreferences>;
    return {
      dark: typeof parsed.dark === "boolean" ? parsed.dark : DEFAULT_PREFERENCES.dark,
      glass: typeof parsed.glass === "boolean" ? parsed.glass : DEFAULT_PREFERENCES.glass,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function writeThemePreferences(prefs: ThemePreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Apply PF + Tailwind classes from preferences (idempotent). */
export function applyThemeToDocument(prefs: ThemePreferences): void {
  const root = document.documentElement;
  root.classList.remove("pf-v6-theme-redhat");
  root.classList.add(PF_THEME_FELT_CLASS);

  if (prefs.dark) {
    root.classList.add("dark", PF_THEME_DARK_CLASS);
  } else {
    root.classList.remove("dark", PF_THEME_DARK_CLASS);
  }

  if (isGlassEffectEnabled(prefs)) {
    root.classList.add(PF_THEME_GLASS_CLASS);
    root.classList.remove("no-glass");
  } else {
    root.classList.remove(PF_THEME_GLASS_CLASS);
    root.classList.add("no-glass");
  }
}

/** Call once at startup (before React) so the first paint uses stored or default Dark + Glass. */
export function applyStoredOrDefaultTheme(): void {
  applyThemeToDocument(readThemePreferences());
}

/** Re-apply when OS `prefers-reduced-transparency` changes (PF glass handbook requirement). */
export function initThemePreferenceListeners(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const mq = window.matchMedia("(prefers-reduced-transparency: reduce)");
  const onChange = () => applyThemeToDocument(readThemePreferences());
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** True when PatternFly glass theme is active (use for `Card isGlass`, etc.). */
export function isPatternFlyGlassActive(): boolean {
  const root = document.documentElement;
  return root.classList.contains(PF_THEME_GLASS_CLASS) && !root.classList.contains("no-glass");
}
