import { useCallback, useState } from "react";
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
} from "@patternfly/react-core";
import { usePrototypeDemo } from "../../contexts/PrototypeDemoContext";
import type { CatalogOperator } from "../../pages/ecosystem/installedOperatorsTypes";
import { canManageOlmV1ClusterExtension } from "./olmV1ClusterExtensionAccess";
import type { OlmV1ClusterExtensionSpec } from "./olmV1ClusterExtensionSpec";
import { OlmV1ExtensionUninstallModals } from "./OlmV1ExtensionUninstallModals";

type UseOlmV1ExtensionLifecycleActionsOptions = {
  operator: CatalogOperator;
  onSpecUpdated?: (spec: OlmV1ClusterExtensionSpec) => void;
  onRollBackToClassic?: () => void;
};

export function useOlmV1ExtensionLifecycleActions({
  operator,
  onSpecUpdated,
  onRollBackToClassic,
}: UseOlmV1ExtensionLifecycleActionsOptions) {
  const { permission } = usePrototypeDemo();
  const canManage = canManageOlmV1ClusterExtension(permission);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [uninstallKind, setUninstallKind] = useState<"unsubscribe" | "delete" | null>(null);
  const openDelete = useCallback(() => {
    setUninstallKind("delete");
    setActionsOpen(false);
  }, []);

  const openUnsubscribe = useCallback(() => {
    setUninstallKind("unsubscribe");
    setActionsOpen(false);
  }, []);

  const closeUninstall = useCallback(() => setUninstallKind(null), []);

  const showRollback =
    operator.olmMigrationEligibility === "migrated" || Boolean(operator.olmClusterExtensionMigration);

  const actionsDropdown = (
    <Dropdown
      isOpen={actionsOpen}
      onOpenChange={setActionsOpen}
      popperProps={{ position: "right" }}
      toggle={(toggleRef) => (
        <MenuToggle ref={toggleRef} onClick={() => setActionsOpen((v) => !v)} variant="secondary">
          Actions
        </MenuToggle>
      )}
    >
      <DropdownList>
        {showRollback ? (
          <DropdownItem
            itemId="rollback-classic"
            onClick={() => {
              setActionsOpen(false);
              onRollBackToClassic?.();
            }}
          >
            Roll back to Classic operators
          </DropdownItem>
        ) : null}
        <DropdownItem itemId="delete" className="pf-m-danger" onClick={openDelete} isDisabled={!canManage}>
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
    </>
  );

  return {
    actionsDropdown,
    lifecycleModals,
    openManageSubscription: canManage ? openUnsubscribe : () => undefined,
    canManageClusterExtension: canManage,
  };
}
