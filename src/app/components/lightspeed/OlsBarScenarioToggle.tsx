import { ToggleGroup, ToggleGroupItem } from "@patternfly/react-core";
import { usePrototypeDemo, type OlsBarMode } from "../../contexts/PrototypeDemoContext";

const MODES: { id: OlsBarMode; label: string }[] = [
  { id: "always", label: "Always on" },
  { id: "icon", label: "Icon" },
];

/** Prototype control for the masthead Lightspeed prompt: persistent field or icon-triggered. */
export default function OlsBarScenarioToggle() {
  const { olsBar, setOlsBar } = usePrototypeDemo();

  return (
    <div className="ocs-prototype-banner-scenario-menu">
      <span id="ocs-ols-bar-label" className="ocs-prototype-banner-scenario-menu__label">
        OLS bar
      </span>
      <ToggleGroup aria-labelledby="ocs-ols-bar-label" className="ocs-prototype-banner-version-toggle">
        {MODES.map((mode) => (
          <ToggleGroupItem
            key={mode.id}
            text={mode.label}
            buttonId={`ocs-ols-bar-${mode.id}`}
            isSelected={olsBar === mode.id}
            onChange={(_event, selected) => {
              if (selected) setOlsBar(mode.id);
            }}
          />
        ))}
      </ToggleGroup>
    </div>
  );
}
