import { MenuToggle, Select, SelectList, SelectOption } from "@patternfly/react-core";
import { useState } from "react";
import {
  CONSOLE_PROJECTS,
  type ConsoleProject,
  useConsoleProject,
} from "../contexts/ConsoleProjectContext";

/** OCP namespace bar: `Project: <name> ▾` above breadcrumbs, not a secondary button. */
export default function NamespaceBar() {
  const { project, setProject } = useConsoleProject();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="ocs-ocp-namespace-bar-strip">
      <Select
        isOpen={isOpen}
        selected={project}
        onSelect={(_e, value) => {
          setProject(String(value) as ConsoleProject);
          setIsOpen(false);
        }}
        onOpenChange={setIsOpen}
        toggle={(toggleRef) => (
          <MenuToggle
            ref={toggleRef}
            variant="plainText"
            className="ocs-ocp-namespace-toggle"
            onClick={() => setIsOpen((open) => !open)}
            isExpanded={isOpen}
            aria-label="Project"
          >
            Project: {project}
          </MenuToggle>
        )}
      >
        <SelectList>
          {CONSOLE_PROJECTS.map((option) => (
            <SelectOption key={option} value={option}>
              {option}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    </div>
  );
}

export { CONSOLE_PROJECTS };
