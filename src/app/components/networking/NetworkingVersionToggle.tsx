import { useLocation } from "react-router";
import { ToggleGroup, ToggleGroupItem } from "@patternfly/react-core";
import { usePrototypeDemo, type NetworkingRelease } from "../../contexts/PrototypeDemoContext";

const RELEASES: NetworkingRelease[] = ["5.1", "5.2"];

/** Banner control for comparing networking 5.1 and 5.2 on networking routes. */
export default function NetworkingVersionToggle() {
  const { pathname } = useLocation();
  const { networkingRelease, setNetworkingRelease } = usePrototypeDemo();

  if (!pathname.startsWith("/networking")) {
    return null;
  }

  return (
    <div className="ocs-prototype-banner-scenario-menu">
      <span id="ocs-networking-release-label" className="ocs-prototype-banner-scenario-menu__label">
        Version
      </span>
      <ToggleGroup aria-labelledby="ocs-networking-release-label" className="ocs-prototype-banner-version-toggle">
        {RELEASES.map((release) => (
          <ToggleGroupItem
            key={release}
            text={release}
            buttonId={`ocs-networking-release-${release}`}
            isSelected={networkingRelease === release}
            onChange={(_event, selected) => {
              if (selected) setNetworkingRelease(release);
            }}
          />
        ))}
      </ToggleGroup>
    </div>
  );
}
