import { useState } from "react";
import { useLocation } from "react-router";
import {
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
} from "@patternfly/react-core";
import type { NetworkingNmstateScenario } from "../../constants/networkingNmstate";
import { usePrototypeDemo } from "../../contexts/PrototypeDemoContext";

const SCENARIO_LABELS: Record<NetworkingNmstateScenario, string> = {
  installed: "NMState operator installed",
  "missing-operator": "NMState operator missing",
};

const SCENARIO_SHORT_LABELS: Record<NetworkingNmstateScenario, string> = {
  installed: "Installed",
  "missing-operator": "Missing",
};

export default function NetworkingScenarioMenu() {
  const { pathname } = useLocation();
  const { networkingNmstateScenario, setNetworkingNmstateScenario } = usePrototypeDemo();
  const [isOpen, setIsOpen] = useState(false);

  if (!pathname.startsWith("/networking")) {
    return null;
  }

  return (
    <div className="ocs-prototype-banner-scenario-menu">
      <span id="ocs-networking-nmstate-scenario-label" className="ocs-prototype-banner-scenario-menu__label">
        NMState dependency
      </span>
      <Select
        aria-labelledby="ocs-networking-nmstate-scenario-label"
        isOpen={isOpen}
        selected={networkingNmstateScenario}
        onSelect={(_event, value) => {
          if (typeof value === "string") {
            setNetworkingNmstateScenario(value as NetworkingNmstateScenario);
          }
          setIsOpen(false);
        }}
        onOpenChange={setIsOpen}
        toggle={(toggleRef) => (
          <MenuToggle
            ref={toggleRef}
            className="ocs-prototype-banner-scenario-menu__toggle"
            variant="secondary"
            aria-labelledby="ocs-networking-nmstate-scenario-label"
            onClick={() => setIsOpen((open) => !open)}
            isExpanded={isOpen}
          >
            {SCENARIO_SHORT_LABELS[networkingNmstateScenario]}
          </MenuToggle>
        )}
      >
        <SelectList>
          {(Object.keys(SCENARIO_LABELS) as NetworkingNmstateScenario[]).map((id) => (
            <SelectOption key={id} value={id}>
              {SCENARIO_LABELS[id]}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    </div>
  );
}