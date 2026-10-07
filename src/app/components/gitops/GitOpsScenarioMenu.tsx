import { useState } from "react";
import { useLocation } from "react-router";
import {
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
} from "@patternfly/react-core";
import {
  usePrototypeDemo,
  type GitOpsScenario,
} from "../../contexts/PrototypeDemoContext";

const SCENARIO_LABELS: Record<GitOpsScenario, string> = {
  paused: "Paused rollout",
  healthy: "Healthy rollout",
  "scaling-down": "Aborting (scaling down)",
};

const SCENARIO_SHORT_LABELS: Record<GitOpsScenario, string> = {
  paused: "Paused",
  healthy: "Healthy",
  "scaling-down": "Aborting",
};

export default function GitOpsScenarioMenu() {
  const { pathname } = useLocation();
  const { gitopsScenario, setGitopsScenario } = usePrototypeDemo();
  const [isOpen, setIsOpen] = useState(false);

  const show = pathname.startsWith("/gitops");

  if (!show) {
    return null;
  }

  return (
    <div className="ocs-prototype-banner-scenario-menu">
      <span id="ocs-gitops-scenario-label" className="ocs-prototype-banner-scenario-menu__label">
        Rollout scenario
      </span>
      <Select
        aria-labelledby="ocs-gitops-scenario-label"
        isOpen={isOpen}
        selected={gitopsScenario}
        onSelect={(_event, value) => {
          if (typeof value === "string") {
            setGitopsScenario(value as GitOpsScenario);
          }
          setIsOpen(false);
        }}
        onOpenChange={setIsOpen}
        toggle={(toggleRef) => (
          <MenuToggle
            ref={toggleRef}
            className="ocs-prototype-banner-scenario-menu__toggle"
            variant="secondary"
            aria-labelledby="ocs-gitops-scenario-label"
            onClick={() => setIsOpen((open) => !open)}
            isExpanded={isOpen}
          >
            {SCENARIO_SHORT_LABELS[gitopsScenario]}
          </MenuToggle>
        )}
      >
        <SelectList>
          {(Object.keys(SCENARIO_LABELS) as GitOpsScenario[]).map((id) => (
            <SelectOption key={id} value={id}>
              {SCENARIO_LABELS[id]}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    </div>
  );
}
