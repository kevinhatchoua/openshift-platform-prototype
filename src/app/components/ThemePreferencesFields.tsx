import { Content, Divider, ToggleGroup, ToggleGroupItem } from "@patternfly/react-core";
import { COLOR_SCHEME_SELECT_OPTIONS, CONTRAST_MODE_SELECT_OPTIONS } from "./themePreferenceOptions";
import type { ColorScheme, ContrastMode, ThemePreferences } from "@/lib/documentTheme";

type ThemePreferencesFieldsProps = {
  idPrefix: string;
  prefs: ThemePreferences;
  onUpdate: (partial: Partial<ThemePreferences>) => void;
};

/** Segmented contrast + color controls (demo menu popover layout). */
export default function ThemePreferencesFields({ idPrefix, prefs, onUpdate }: ThemePreferencesFieldsProps) {
  return (
    <div className="ocs-pf-theme-controls ocs-pf-theme-controls--popover">
      <div className="ocs-pf-theme-controls__section">
        <Content component="p" className="ocs-pf-theme-controls__label" id={`${idPrefix}-contrast`}>
          Contrast mode
        </Content>
        <ToggleGroup aria-labelledby={`${idPrefix}-contrast`} isCompact className="ocs-pf-theme-controls__toggle-row">
          {CONTRAST_MODE_SELECT_OPTIONS.map(({ value, label }) => (
            <ToggleGroupItem
              key={value}
              text={label}
              isSelected={prefs.contrastMode === value}
              onChange={() => onUpdate({ contrastMode: value as ContrastMode })}
            />
          ))}
        </ToggleGroup>
        {prefs.contrastMode === "system" ? (
          <Content component="small" className="ocs-pf-theme-controls__hint pf-v6-u-mt-sm">
            Matches your operating system&apos;s contrast setting.
          </Content>
        ) : null}
      </div>

      <Divider className="ocs-pf-theme-controls__divider" />

      <div className="ocs-pf-theme-controls__section">
        <Content component="p" className="ocs-pf-theme-controls__label" id={`${idPrefix}-color`}>
          Color scheme
        </Content>
        <ToggleGroup aria-labelledby={`${idPrefix}-color`} isCompact className="ocs-pf-theme-controls__toggle-row">
          {COLOR_SCHEME_SELECT_OPTIONS.map(({ value, label }) => (
            <ToggleGroupItem
              key={value}
              text={label}
              isSelected={prefs.colorScheme === value}
              onChange={() => onUpdate({ colorScheme: value as ColorScheme })}
            />
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}
