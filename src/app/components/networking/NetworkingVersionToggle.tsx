import { ToggleGroup, ToggleGroupItem } from "@patternfly/react-core";
import { usePrototypeDemo, type NetworkingRelease } from "../../contexts/PrototypeDemoContext";

const RELEASES: NetworkingRelease[] = ["5.1", "5.2"];

/** Single prototype Version control: networking 5.1/5.2 and masthead OLS bar behavior. */
export default function NetworkingVersionToggle() {
  const { networkingRelease, setNetworkingRelease } = usePrototypeDemo();

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
