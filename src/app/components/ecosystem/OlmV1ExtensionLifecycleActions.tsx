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
import { OlmV1ExtensionUninstallModals } from "./OlmV1ExtensionUninstallModals";
import { OlmV1ExtensionUpdateModal } from "./OlmV1ExtensionUpdateModal";

type UseOlmV1ExtensionLifecycleActionsOptions = {
  operator: CatalogOperator;
  onVersionUpdated?: (newVersion: string) => void;
};

export function useOlmV1ExtensionLifecycleActions({
  operator,
  onVersionUpdated,
}: UseOlmV1ExtensionLifecycleActionsOptions) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const [uninstallKind, setUninstallKind] = useState<"unsubscribe" | "delete" | null>(null);
  const [updateOpen, setUpdateOpen] = useState(false);

  const openUnsubscribe = useCallback(() => {
    setUninstallKind("unsubscribe");
    setActionsOpen(false);
  }, []);

  const openDelete = useCallback(() => {
    setUninstallKind("delete");
    setActionsOpen(false);
  }, []);

  const openUpdate = useCallback(() => {
    setUpdateOpen(true);
    setActionsOpen(false);
  }, []);

  const closeUninstall = useCallback(() => setUninstallKind(null), []);
  const closeUpdate = useCallback(() => setUpdateOpen(false), []);

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
        {operator.updateAvailable ? (
          <DropdownItem itemId="update" onClick={openUpdate}>
            Update to {operator.updateAvailable}
          </DropdownItem>
        ) : null}
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
        isOpen={updateOpen}
        onClose={closeUpdate}
        onComplete={(_op, newVersion) => onVersionUpdated?.(newVersion)}
      />
    </>
  );

  return {
    actionsDropdown,
    lifecycleModals,
    openUpdate,
  };
}

type OlmV1ExtensionUpdateAlertProps = {
  operator: CatalogOperator;
  onUpdate: () => void;
};

export function OlmV1ExtensionUpdateAlert({ operator, onUpdate }: OlmV1ExtensionUpdateAlertProps): ReactNode {
  if (!operator.updateAvailable) return null;

  return (
    <Alert
      variant="warning"
      title="Update available"
      isInline
      actionLinks={
        <Button variant="link" isInline onClick={onUpdate}>
          Review and approve update
        </Button>
      }
    >
      Version {operator.updateAvailable} is available for this cluster extension.
    </Alert>
  );
}
