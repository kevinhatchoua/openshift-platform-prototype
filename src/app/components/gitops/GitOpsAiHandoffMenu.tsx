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
  type GitOpsAiHandoff,
} from "../../contexts/PrototypeDemoContext";

const HANDOFF_LABELS: Record<GitOpsAiHandoff, string> = {
  "agentic-run": "Agentic run details (GITOPS-11005)",
  lightspeed: "OpenShift Lightspeed first",
};

const HANDOFF_SHORT: Record<GitOpsAiHandoff, string> = {
  "agentic-run": "Agentic run",
  lightspeed: "OLS first",
};

export default function GitOpsAiHandoffMenu() {
  const { pathname } = useLocation();
  const { gitopsAiHandoff, setGitopsAiHandoff } = usePrototypeDemo();
  const [isOpen, setIsOpen] = useState(false);

  if (!pathname.startsWith("/gitops") && !pathname.startsWith("/agentic-runs")) {
    return null;
  }

  return (
    <div className="ocs-prototype-banner-scenario-menu">
      <span id="ocs-gitops-ai-handoff-label" className="ocs-prototype-banner-scenario-menu__label">
        AI handoff
      </span>
      <Select
        aria-labelledby="ocs-gitops-ai-handoff-label"
        isOpen={isOpen}
        selected={gitopsAiHandoff}
        onSelect={(_event, value) => {
          if (typeof value === "string") {
            setGitopsAiHandoff(value as GitOpsAiHandoff);
          }
          setIsOpen(false);
        }}
        onOpenChange={setIsOpen}
        toggle={(toggleRef) => (
          <MenuToggle
            ref={toggleRef}
            className="ocs-prototype-banner-scenario-menu__toggle"
            variant="secondary"
            aria-labelledby="ocs-gitops-ai-handoff-label"
            onClick={() => setIsOpen((open) => !open)}
            isExpanded={isOpen}
          >
            {HANDOFF_SHORT[gitopsAiHandoff]}
          </MenuToggle>
        )}
      >
        <SelectList>
          {(Object.keys(HANDOFF_LABELS) as GitOpsAiHandoff[]).map((id) => (
            <SelectOption key={id} value={id}>
              {HANDOFF_LABELS[id]}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    </div>
  );
}