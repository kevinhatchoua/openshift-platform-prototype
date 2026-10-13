import { useEffect, useState } from "react";
import {
  THEME_PREFERENCES_EVENT,
  readThemePreferences,
  setThemePreferences,
  type ThemePreferences,
} from "@/lib/documentTheme";
import ThemePreferencesFields from "./ThemePreferencesFields";

type PatternFlyThemeControlsProps = {
  idPrefix?: string;
};

/**
 * Prototype demo menu: inline color scheme + contrast toggles.
 */
export default function PatternFlyThemeControls({ idPrefix = "theme" }: PatternFlyThemeControlsProps) {
  const [prefs, setPrefs] = useState<ThemePreferences>(() => readThemePreferences());

  useEffect(() => {
    const sync = () => setPrefs(readThemePreferences());
    const onCustom = (ev: Event) => {
      const detail = (ev as CustomEvent<ThemePreferences>).detail;
      if (detail) setPrefs(detail);
      else sync();
    };
    window.addEventListener(THEME_PREFERENCES_EVENT, onCustom as EventListener);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(THEME_PREFERENCES_EVENT, onCustom as EventListener);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = (partial: Partial<ThemePreferences>) => {
    setPrefs(setThemePreferences(partial));
  };

  return <ThemePreferencesFields idPrefix={idPrefix} prefs={prefs} onUpdate={update} />;
}
