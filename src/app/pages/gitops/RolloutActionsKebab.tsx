import { useState, type MouseEvent } from "react";
import {
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  MenuToggle,
} from "@patternfly/react-core";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import { RhAiExperienceIcon } from "@/components/icons/RhAiExperienceIcon";
import type { DomainAction, GitOpsHealth } from "./gitopsData";
import { GITOPS_VIEW_AGENTIC_RUN_LABEL } from "./gitopsAgenticCopy";
import { actionStateFor } from "./gitopsData";
import { usePrototypeDemo } from "../../contexts/PrototypeDemoContext";

type RolloutActionsKebabProps = {
  ns: string;
  name: string;
  seedStatus?: GitOpsHealth;
  onAction: (action: DomainAction) => void;
  ariaLabel?: string;
  variant?: "plain" | "secondary";
  agenticOnSelect?: () => void;
};

export default function RolloutActionsKebab({
  ns,
  name,
  seedStatus,
  onAction,
  ariaLabel,
  variant = "plain",
  agenticOnSelect,
}: RolloutActionsKebabProps) {
  const { permission } = usePrototypeDemo();
  const [open, setOpen] = useState(false);
  const st = actionStateFor(ns, name, seedStatus, permission);

  const run = (action: DomainAction, enabled: boolean) => (e: MouseEvent) => {
    e.stopPropagation();
    if (enabled) onAction(action);
  };

  return (
    <Dropdown
      isOpen={open}
      onOpenChange={setOpen}
      onSelect={() => setOpen(false)}
      popperProps={{ position: "right" }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          variant={variant}
          aria-label={ariaLabel ?? `Actions for ${name}`}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          isExpanded={open}
        >
          {variant === "plain" ? <EllipsisVIcon /> : "Actions"}
        </MenuToggle>
      )}
    >
      <DropdownList>
        {agenticOnSelect ? (
          <>
            <DropdownItem
              itemId="view-agentic-run"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                agenticOnSelect();
              }}
            >
              <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                <RhAiExperienceIcon aria-hidden />
                <span>{GITOPS_VIEW_AGENTIC_RUN_LABEL}</span>
              </Flex>
            </DropdownItem>
            <Divider component="li" />
          </>
        ) : null}
        <DropdownItem itemId="Promote" isDisabled={!st.promote} onClick={run("Promote", st.promote)}>
          Promote
        </DropdownItem>
        <DropdownItem
          itemId="Full Promote"
          isDisabled={!st.fullPromote}
          onClick={run("Full Promote", st.fullPromote)}
        >
          Full Promote
        </DropdownItem>
        <Divider component="li" />
        <DropdownItem itemId="Abort" isDisabled={!st.abort} onClick={run("Abort", st.abort)}>
          Abort
        </DropdownItem>
        <DropdownItem itemId="Retry" isDisabled={!st.retry} onClick={run("Retry", st.retry)}>
          Retry
        </DropdownItem>
        <DropdownItem itemId="Restart" isDisabled={!st.restart} onClick={run("Restart", st.restart)}>
          Restart
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}
