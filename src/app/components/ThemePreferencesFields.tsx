import { Content, Divider, ToggleGroup, ToggleGroupItem } from "@patternfly/react-core";
import {
  isColorSchemeFollowsSystem,
  type ColorScheme,
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

type ColorSchemeChoice = Exclude<ColorScheme, "system">;

const COLOR_SCHEME_LABELS: Record<ColorSchemeChoice, string> = {
  light: "Light",
  dark: "Dark",
};

const COLOR_SCHEME_ORDER: ColorSchemeChoice[] = ["light", "dark"];

export function themePreferencesSummary(prefs: ThemePreferences): string {
  const contrast = CONTRAST_LABELS[contrastModeToChoice(prefs.contrastMode)];
  const color = isColorSchemeFollowsSystem(prefs)
    ? CONTRAST_LABELS.system
    : prefs.colorScheme === "light" || prefs.colorScheme === "dark"
      ? COLOR_SCHEME_LABELS[prefs.colorScheme]
      : COLOR_SCHEME_LABELS.dark;
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
  const colorSchemeDisabled = isColorSchemeFollowsSystem(prefs);

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
        <ToggleGroup
          aria-labelledby={`${idPrefix}-color`}
          aria-describedby={colorSchemeDisabled ? `${idPrefix}-color-hint` : undefined}
          isCompact
          className="ocs-pf-theme-controls__toggle-row"
        >
          {COLOR_SCHEME_ORDER.map((id) => (
            <ToggleGroupItem
              key={id}
              text={COLOR_SCHEME_LABELS[id]}
              isDisabled={colorSchemeDisabled}
              isSelected={!colorSchemeDisabled && prefs.colorScheme === id}
              onChange={() => onUpdate({ colorScheme: id })}
            />
          ))}
        </ToggleGroup>
        {colorSchemeDisabled ? (
          <Content
            component="small"
            className="ocs-pf-theme-controls__hint pf-v6-u-mt-sm"
            id={`${idPrefix}-color-hint`}
          >
            Color scheme follows your system setting while contrast mode is System default.
          </Content>
        ) : null}
      </div>
    </div>
  );
}
