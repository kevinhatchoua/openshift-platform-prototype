import { ToggleGroup, ToggleGroupItem } from "@patternfly/react-core";
import { usePrototypeDemo, type OlsRelease } from "../../contexts/PrototypeDemoContext";

const RELEASES: OlsRelease[] = ["5.1", "5.2"];

/** Banner control for the masthead Lightspeed bar. 5.1 shows Chat / Troubleshooting; 5.2 does not. */
export default function OlsVersionToggle() {
  const { olsRelease, setOlsRelease } = usePrototypeDemo();

  return (
    <div className="ocs-prototype-banner-scenario-menu">
      <span id="ocs-ols-release-label" className="ocs-prototype-banner-scenario-menu__label">
        OLS
      </span>
      <ToggleGroup aria-labelledby="ocs-ols-release-label" className="ocs-prototype-banner-version-toggle">
        {RELEASES.map((release) => (
          <ToggleGroupItem
            key={release}
            text={release}
            buttonId={`ocs-ols-release-${release}`}
            isSelected={olsRelease === release}
            onChange={(_event, selected) => {
              if (selected) setOlsRelease(release);
            }}
          />
        ))}
      </ToggleGroup>
    </div>
  );
}
