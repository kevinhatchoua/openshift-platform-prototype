import { useEffect, useState } from "react";
import { Content, ToggleGroup, ToggleGroupItem } from "@patternfly/react-core";
import {
  THEME_PREFERENCES_EVENT,
  isColorSchemeFollowsSystem,
  readThemePreferences,
  setThemePreferences,
  type ColorScheme,
  type ContrastMode,
  type ThemePreferences,
} from "@/lib/documentTheme";

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

  const colorSchemeDisabled = isColorSchemeFollowsSystem(prefs);

  return (
    <div className="ocs-pf-theme-controls">
      <div className="ocs-pf-theme-controls__section">
        <Content component="p" className="ocs-pf-theme-controls__label" id={`${idPrefix}-color`}>
          Color scheme
        </Content>
        <ToggleGroup aria-labelledby={`${idPrefix}-color`} isCompact>
          {(
            [
              ["light", "Light"],
              ["dark", "Dark"],
            ] as [Exclude<ColorScheme, "system">, string][]
          ).map(([id, label]) => (
            <ToggleGroupItem
              key={id}
              text={label}
              isDisabled={colorSchemeDisabled}
              isSelected={!colorSchemeDisabled && prefs.colorScheme === id}
              onChange={() => update({ colorScheme: id })}
            />
          ))}
        </ToggleGroup>
      </div>

      <div className="ocs-pf-theme-controls__section">
        <Content component="p" className="ocs-pf-theme-controls__label" id={`${idPrefix}-contrast`}>
          Contrast mode
        </Content>
        <ToggleGroup aria-labelledby={`${idPrefix}-contrast`} isCompact>
          {(
            [
              ["system", "System"],
              ["default", "Default"],
              ["high-contrast", "High contrast"],
              ["glass", "Glass"],
            ] as [ContrastMode, string][]
          ).map(([id, label]) => (
            <ToggleGroupItem
              key={id}
              text={label}
              isSelected={prefs.contrastMode === id}
              onChange={() => update({ contrastMode: id })}
            />
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}
