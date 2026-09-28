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
  type OlmMigrationScenario,
} from "../../contexts/PrototypeDemoContext";

const SCENARIO_LABELS: Record<OlmMigrationScenario, string> = {
  interactive: "Interactive (fixture data)",
  "preview-success": "Migration successful",
  "preview-failed-rollback": "Migration failed (auto-rollback)",
  "preview-errors": "Migration errors & incomplete",
};

const SCENARIO_SHORT_LABELS: Record<OlmMigrationScenario, string> = {
  interactive: "Interactive",
  "preview-success": "Successful",
  "preview-failed-rollback": "Failed (auto-rollback)",
  "preview-errors": "Errors & incomplete",
};

export default function OlmMigrationScenarioMenu() {
  const { pathname } = useLocation();
  const { olmMigrationScenario, setOlmMigrationScenario } = usePrototypeDemo();
  const [isOpen, setIsOpen] = useState(false);

  const show = pathname.startsWith("/ecosystem/installed-operators");

  if (!show) {
    return null;
  }

  return (
    <div className="ocs-olm-migration-scenario-menu">
      <span id="ocs-olm-migration-scenario-label" className="ocs-olm-migration-scenario-menu__label">
        Migration scenario
      </span>
      <Select
        aria-labelledby="ocs-olm-migration-scenario-label"
        isOpen={isOpen}
        selected={olmMigrationScenario}
        onSelect={(_event, value) => {
          if (typeof value === "string") {
            setOlmMigrationScenario(value as OlmMigrationScenario);
          }
          setIsOpen(false);
        }}
        onOpenChange={setIsOpen}
        toggle={(toggleRef) => (
          <MenuToggle
            ref={toggleRef}
            className="ocs-olm-migration-scenario-menu__toggle"
            variant="secondary"
            aria-labelledby="ocs-olm-migration-scenario-label"
            onClick={() => setIsOpen((open) => !open)}
            isExpanded={isOpen}
          >
            {SCENARIO_SHORT_LABELS[olmMigrationScenario]}
          </MenuToggle>
        )}
      >
      <SelectList>
        {(Object.keys(SCENARIO_LABELS) as OlmMigrationScenario[]).map((id) => (
          <SelectOption key={id} value={id}>
            {SCENARIO_LABELS[id]}
          </SelectOption>
        ))}
      </SelectList>
    </Select>
    </div>
  );
}
