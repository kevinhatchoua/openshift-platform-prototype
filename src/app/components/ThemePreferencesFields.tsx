import { Content, Divider, ToggleGroup, ToggleGroupItem } from "@patternfly/react-core";
import {
  resolveDark,
  type ContrastMode,
  type ThemePreferences,
} from "@/lib/documentTheme";

export type ContrastChoice = "traditional" | "glass" | "high-contrast" | "system";

export const CONTRAST_TO_MODE: Record<ContrastChoice, ContrastMode> = {
  traditional: "default",
  glass: "glass",
  "high-contrast": "high-contrast",
  system: "system",
};

const CONTRAST_LABELS: Record<ContrastChoice, string> = {
  traditional: "Traditional",
  glass: "Glass",
  "high-contrast": "High contrast",
  system: "System default",
};

export function contrastModeToChoice(mode: ContrastMode): ContrastChoice {
  if (mode === "glass") return "glass";
  if (mode === "high-contrast") return "high-contrast";
  if (mode === "system") return "system";
  return "traditional";
}

export function colorSchemeForToggle(prefs: ThemePreferences): "light" | "dark" {
  if (prefs.colorScheme === "light") return "light";
  if (prefs.colorScheme === "dark") return "dark";
  return resolveDark(prefs) ? "dark" : "light";
}

export function themePreferencesSummary(prefs: ThemePreferences): string {
  const contrast = CONTRAST_LABELS[contrastModeToChoice(prefs.contrastMode)];
  const color = colorSchemeForToggle(prefs) === "dark" ? "Dark" : "Light";
  return `${contrast} · ${color}`;
}

type ThemePreferencesFieldsProps = {
  idPrefix: string;
  prefs: ThemePreferences;
  onUpdate: (partial: Partial<ThemePreferences>) => void;
};

/** Segmented contrast + color controls (PatternFly theme popover layout). */
export default function ThemePreferencesFields({ idPrefix, prefs, onUpdate }: ThemePreferencesFieldsProps) {
  const contrastChoice = contrastModeToChoice(prefs.contrastMode);
  const colorToggle = colorSchemeForToggle(prefs);

  return (
    <div className="ocs-pf-theme-controls ocs-pf-theme-controls--popover">
      <div className="ocs-pf-theme-controls__section">
        <Content component="p" className="ocs-pf-theme-controls__label" id={`${idPrefix}-contrast`}>
          Contrast mode
        </Content>
        <ToggleGroup aria-labelledby={`${idPrefix}-contrast`} isCompact className="ocs-pf-theme-controls__toggle-row">
          {(Object.entries(CONTRAST_LABELS) as [ContrastChoice, string][]).map(([id, label]) => (
            <ToggleGroupItem
              key={id}
              text={label}
              isSelected={contrastChoice === id}
              onChange={() => onUpdate({ contrastMode: CONTRAST_TO_MODE[id] })}
            />
          ))}
        </ToggleGroup>
      </div>

      <Divider className="ocs-pf-theme-controls__divider" />

      <div className="ocs-pf-theme-controls__section">
        <Content component="p" className="ocs-pf-theme-controls__label" id={`${idPrefix}-color`}>
          Color scheme
        </Content>
        <ToggleGroup aria-labelledby={`${idPrefix}-color`} isCompact className="ocs-pf-theme-controls__toggle-row">
          {(
            [
              ["light", "Light"],
              ["dark", "Dark"],
            ] as const
          ).map(([id, label]) => (
            <ToggleGroupItem
              key={id}
              text={label}
              isSelected={colorToggle === id}
              onChange={() => onUpdate({ colorScheme: id })}
            />
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}
