import { useCallback, useState } from "react";
import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  MenuToggle,
} from "@patternfly/react-core";
import {
  DataViewTextFilter,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import { IoDataViewFiltersWithMidActions } from "../../components/dataView/IoDataViewFiltersWithMidActions";
import NodeNetworkConfigurationWizard from "./NodeNetworkConfigurationWizard";
import { NetworkingEmptyState, NetworkingPageShell } from "./networkingShared";
import { useNodeNetworkConfigurationCreate } from "./useNodeNetworkConfigurationCreate";

type NncFilters = { name: string };

type NncToast = {
  key: number;
  variant: "success" | "info" | "warning" | "danger";
  title: string;
};

export default function NodeNetworkConfigurationPage() {
  const { filters, onSetFilters } = useDataViewFilters<NncFilters>({
    filters: { name: "" },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [toasts, setToasts] = useState<NncToast[]>([]);

  const dismissToast = useCallback((key: number) => {
    setToasts((prev) => prev.filter((toast) => toast.key !== key));
  }, []);

  const pushToast = useCallback((toast: Omit<NncToast, "key">) => {
    const key = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [{ key, ...toast }, ...prev].slice(0, 4));
    return key;
  }, []);

  const {
    showFormWizard,
    openFormWizard,
    closeFormWizard,
    activeStep,
    setActiveStep,
    physicalNetworkName,
    setPhysicalNetworkName,
    isCreating,
    handleCreateConfiguration,
  } = useNodeNetworkConfigurationCreate(pushToast, dismissToast);

  return (
    <>
      <AlertGroup isToast isLiveRegion hasAnimations aria-label="Notifications">
        {toasts.map((toast) => (
          <Alert
            key={toast.key}
            variant={toast.variant}
            title={toast.title}
            isPlain
            timeout={8000}
            onTimeout={() => dismissToast(toast.key)}
            actionClose={<AlertActionCloseButton onClose={() => dismissToast(toast.key)} />}
          />
        ))}
      </AlertGroup>
      <NetworkingPageShell
        title="Node network configuration"
        path="/networking/node-network-configuration"
        createButton={
          showFormWizard ? undefined : (
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }}>
              <Dropdown
                isOpen={createOpen}
                onOpenChange={(open) => setCreateOpen(open)}
                toggle={(toggleRef) => (
                  <MenuToggle ref={toggleRef} onClick={() => setCreateOpen((o) => !o)} variant="primary">
                    Create
                  </MenuToggle>
                )}
                popperProps={{ position: "right" }}
              >
                <DropdownList>
                  <DropdownItem
                    itemId="from-form"
                    onClick={() => {
                      setCreateOpen(false);
                      openFormWizard();
                    }}
                  >
                    From Form
                  </DropdownItem>
                  <DropdownItem itemId="with-yaml">With YAML</DropdownItem>
                </DropdownList>
              </Dropdown>
              <IoDataViewFiltersWithMidActions<NncFilters>
                values={filters}
                onChange={(_id, partial) => onSetFilters(partial)}
              >
                <DataViewTextFilter
                  title="Name"
                  filterId="name"
                  placeholder="Filter"
                  style={{ minWidth: "12rem" }}
                />
              </IoDataViewFiltersWithMidActions>
            </Flex>
          )
        }
      >
        {showFormWizard ? (
          <NodeNetworkConfigurationWizard
            activeStep={activeStep}
            physicalNetworkName={physicalNetworkName}
            onActiveStepChange={setActiveStep}
            onPhysicalNetworkNameChange={setPhysicalNetworkName}
            onClose={closeFormWizard}
            onCreate={handleCreateConfiguration}
            isCreating={isCreating}
          />
        ) : (
          <NetworkingEmptyState
            title="No NodeNetworkConfigurationPolicy found"
            description="Click Create NodeNetworkConfigurationPolicy to create your first policy, then view the network topology."
            createLabel="Create NodeNetworkConfigurationPolicy"
            onCreate={openFormWizard}
          />
        )}
      </NetworkingPageShell>
    </>
  );
}
