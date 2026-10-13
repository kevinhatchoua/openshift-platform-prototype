import { useCallback, useState, type ReactNode } from "react";
import {
  Alert,
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
} from "@patternfly/react-core";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import type { CatalogOperator } from "../../pages/ecosystem/installedOperatorsTypes";
import type { OlmV1ClusterExtensionSpec } from "./olmV1ClusterExtensionSpec";
import { OlmV1ExtensionUninstallModals } from "./OlmV1ExtensionUninstallModals";
import { OlmV1ExtensionUpdateModal } from "./OlmV1ExtensionUpdateModal";

type UseOlmV1ExtensionLifecycleActionsOptions = {
  operator: CatalogOperator;
  onSpecUpdated?: (spec: OlmV1ClusterExtensionSpec) => void;
};

export function useOlmV1ExtensionLifecycleActions({
  operator,
  onSpecUpdated,
}: UseOlmV1ExtensionLifecycleActionsOptions) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const [uninstallKind, setUninstallKind] = useState<"unsubscribe" | "delete" | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const openUnsubscribe = useCallback(() => {
    setUninstallKind("unsubscribe");
    setActionsOpen(false);
  }, []);

  const openDelete = useCallback(() => {
    setUninstallKind("delete");
    setActionsOpen(false);
  }, []);

  const openEdit = useCallback(() => {
    setEditOpen(true);
    setActionsOpen(false);
  }, []);

  const closeUninstall = useCallback(() => setUninstallKind(null), []);
  const closeEdit = useCallback(() => setEditOpen(false), []);

  const actionsDropdown = (
    <Dropdown
      isOpen={actionsOpen}
      onOpenChange={setActionsOpen}
      popperProps={{ position: "right" }}
      toggle={(toggleRef) => (
        <MenuToggle ref={toggleRef} onClick={() => setActionsOpen((v) => !v)} variant="secondary">
          Actions <EllipsisVIcon aria-hidden />
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem itemId="edit-targeting" onClick={openEdit}>
          Edit channel and version
        </DropdownItem>
        <DropdownItem itemId="unsubscribe" onClick={openUnsubscribe}>
          Unsubscribe from updates
        </DropdownItem>
        <DropdownItem itemId="delete" className="pf-m-danger" onClick={openDelete}>
          Delete extension and managed resources
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );

  const lifecycleModals = (
    <>
      <OlmV1ExtensionUninstallModals
        operator={uninstallKind ? operator : null}
        kind={uninstallKind}
        onClose={closeUninstall}
      />
      <OlmV1ExtensionUpdateModal
        operator={operator}
        isOpen={editOpen}
        onClose={closeEdit}
        onComplete={(_op, spec) => onSpecUpdated?.(spec)}
      />
    </>
  );

  return {
    actionsDropdown,
    lifecycleModals,
    openEdit,
  };
}

type OlmV1ExtensionEditHintAlertProps = {
  onEdit: () => void;
};

/** Replaces catalogd-driven “update available” banner for 5.1. */
export function OlmV1ExtensionEditHintAlert({ onEdit }: OlmV1ExtensionEditHintAlertProps): ReactNode {
  return (
    <Alert variant="info" title="Change extension targeting" isInline>
      <Button variant="link" isInline onClick={onEdit}>
        Edit channel and version
      </Button>{" "}
      to move this cluster extension to a different release. Automatic update discovery is not available in OCP 5.1.
    </Alert>
  );
}
