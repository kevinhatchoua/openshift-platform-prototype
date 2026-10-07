import { useEffect, useState } from "react";
import { Dropdown, DropdownItem, DropdownList, MenuToggle, type MenuToggleElement } from "@patternfly/react-core";
import {
  THEME_PREFERENCES_EVENT,
  readThemePreferences,
  setThemePreferences,
  type ThemePreferences,
} from "@/lib/documentTheme";
import ThemePreferencesFields, { themePreferencesSummary } from "./ThemePreferencesFields";

type ThemePreferencesDropdownProps = {
  idPrefix?: string;
};

/**
 * User Preferences: PatternFly Dropdown with theme panel (contrast + color scheme).
 */
export default function ThemePreferencesDropdown({ idPrefix = "user-pref-theme" }: ThemePreferencesDropdownProps) {
  const [open, setOpen] = useState(false);
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

  const toggleId = `${idPrefix}-toggle`;

  return (
    <span className="pf-v6-c-form-control ocs-user-preferences__field ocs-user-preferences__theme-shell">
      <Dropdown
        className="ocs-theme-preferences-dropdown"
        isOpen={open}
        onOpenChange={setOpen}
        shouldFocusToggleOnSelect={false}
        shouldFocusFirstItemOnOpen={false}
        onOpenChangeKeys={["Escape"]}
        popperProps={{ direction: "down", position: "start" }}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            id={toggleId}
            isExpanded={open}
            isFullWidth
            isInForm
            onClick={() => setOpen((v) => !v)}
            className="ocs-user-preferences__theme-toggle"
            aria-label="Theme"
          >
            {themePreferencesSummary(prefs)}
          </MenuToggle>
        )}
        ouiaId="UserPreferencesThemeDropdown"
      >
        <DropdownList aria-label="Theme settings">
          <DropdownItem
            itemId="theme-preferences-panel"
            component="div"
            className="ocs-theme-preferences-dropdown__panel"
            onClick={(event: React.MouseEvent) => event.stopPropagation()}
          >
            <div
              role="presentation"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <ThemePreferencesFields idPrefix={idPrefix} prefs={prefs} onUpdate={update} />
            </div>
          </DropdownItem>
        </DropdownList>
      </Dropdown>
    </span>
  );
}
