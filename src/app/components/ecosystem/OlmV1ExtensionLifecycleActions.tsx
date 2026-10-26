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
import { usePrototypeDemo } from "../../contexts/PrototypeDemoContext";
import type { CatalogOperator } from "../../pages/ecosystem/installedOperatorsTypes";
import { canManageOlmV1ClusterExtension } from "./olmV1ClusterExtensionAccess";
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
  const { permission } = usePrototypeDemo();
  const canManage = canManageOlmV1ClusterExtension(permission);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [uninstallKind, setUninstallKind] = useState<"unsubscribe" | "delete" | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const openDelete = useCallback(() => {
    setUninstallKind("delete");
    setActionsOpen(false);
  }, []);

  const openEdit = useCallback(() => {
    setEditOpen(true);
    setActionsOpen(false);
  }, []);

  const openUnsubscribeFromEdit = useCallback(() => {
    setEditOpen(false);
    setUninstallKind("unsubscribe");
  }, []);

  const closeUninstall = useCallback(() => setUninstallKind(null), []);
  const closeEdit = useCallback(() => setEditOpen(false), []);

  const actionsDropdown = canManage ? (
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
        <DropdownItem itemId="manage-updates" onClick={openEdit}>
          Manage updates
        </DropdownItem>
        <DropdownItem itemId="delete" className="pf-m-danger" onClick={openDelete}>
          Delete extension and managed resources
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  ) : null;

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
        onRequestUnsubscribe={openUnsubscribeFromEdit}
      />
    </>
  );

  return {
    actionsDropdown,
    lifecycleModals,
    openEdit: canManage ? openEdit : () => undefined,
    canManageClusterExtension: canManage,
  };
}

type OlmV1ExtensionEditHintAlertProps = {
  onEdit: () => void;
  canEdit?: boolean;
};

/** Replaces catalogd-driven “update available” banner for 5.1. */
export function OlmV1ExtensionEditHintAlert({
  onEdit,
  canEdit = true,
}: OlmV1ExtensionEditHintAlertProps): ReactNode {
  if (!canEdit) {
    return (
      <Alert variant="info" title="Extension targeting" isInline>
        Automatic update discovery is not available in OCP 5.1. A cluster administrator can change channel and version
        when they have permission to update this cluster extension.
      </Alert>
    );
  }

  return (
    <Alert variant="info" title="Manage updates" isInline>
      <Button variant="link" isInline onClick={onEdit}>
        Manage updates
      </Button>{" "}
      to change channel and version or unsubscribe from catalog updates. Automatic update discovery is not available in
      OCP 5.1.
    </Alert>
  );
}
