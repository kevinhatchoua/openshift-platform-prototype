import { useEffect, useState } from "react";
import {
  Content,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Title,
} from "@patternfly/react-core";
import {
  COLOR_SCHEME_SELECT_OPTIONS,
  CONTRAST_MODE_SELECT_OPTIONS,
} from "./themePreferenceOptions";
import {
  THEME_PREFERENCES_EVENT,
  readThemePreferences,
  setThemePreferences,
  type ColorScheme,
  type ContrastMode,
  type ThemePreferences,
} from "@/lib/documentTheme";

type ThemePreferencesSectionProps = {
  idPrefix?: string;
};

/**
 * User Preferences: Theme fieldset with contrast + color scheme FormSelects.
 */
export default function ThemePreferencesSection({ idPrefix = "user-pref-theme" }: ThemePreferencesSectionProps) {
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

  const updateContrast = (_e: unknown, value: string) => {
    setPrefs(setThemePreferences({ contrastMode: value as ContrastMode }));
  };

  const updateColorScheme = (_e: unknown, value: string) => {
    setPrefs(setThemePreferences({ colorScheme: value as ColorScheme }));
  };

  return (
    <fieldset className="ocs-user-preferences__theme-section" aria-labelledby={`${idPrefix}-legend`}>
      <Title headingLevel="h2" size="md" id={`${idPrefix}-legend`} className="ocs-user-preferences__theme-section-title">
        Theme
      </Title>

      <FormGroup label="Contrast mode" fieldId={`${idPrefix}-contrast`}>
        <FormSelect
          id={`${idPrefix}-contrast`}
          className="ocs-user-preferences__field"
          value={prefs.contrastMode}
          onChange={updateContrast}
          aria-label="Contrast mode"
        >
          {CONTRAST_MODE_SELECT_OPTIONS.map(({ value, label }) => (
            <FormSelectOption key={value} value={value} label={label} />
          ))}
        </FormSelect>
        {prefs.contrastMode === "system" ? (
          <Content component="small" className="pf-v6-u-mt-sm">
            Matches your operating system&apos;s contrast setting.
          </Content>
        ) : null}
      </FormGroup>

      <FormGroup label="Color scheme" fieldId={`${idPrefix}-color-scheme`}>
        <FormSelect
          id={`${idPrefix}-color-scheme`}
          className="ocs-user-preferences__field"
          value={prefs.colorScheme}
          onChange={updateColorScheme}
          aria-label="Color scheme"
        >
          {COLOR_SCHEME_SELECT_OPTIONS.map(({ value, label }) => (
            <FormSelectOption key={value} value={value} label={label} />
          ))}
        </FormSelect>
        <Content component="small" className="pf-v6-u-mt-sm">
          Console will appear as per the selected color scheme.
        </Content>
      </FormGroup>
    </fieldset>
  );
}
