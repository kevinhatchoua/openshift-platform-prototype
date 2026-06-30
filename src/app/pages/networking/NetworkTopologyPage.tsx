import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { Alert, AlertActionCloseButton, AlertGroup } from "@patternfly/react-core";
import NetworkTopologyPanel from "./NetworkTopologyPanel";
import NodeNetworkConfigurationWizard from "./NodeNetworkConfigurationWizard";
import {
  CreateClusterUdnModal,
  CreateNadModal,
  CreateNncpModal,
  CreateUdnModal,
  NetworkResourceCreateDropdown,
  type NetworkCreateResource,
} from "./networkingCreateModals";
import { nadDetailPath, udnDetailPath } from "./networkingMockData";
import { NetworkingPageShell } from "./networkingShared";
import { useNetworkTopologyState } from "./networkTopologyState";
import { useNodeNetworkConfigurationCreate } from "./useNodeNetworkConfigurationCreate";

type TopoToast = {
  key: number;
  variant: "success" | "info" | "warning" | "danger";
  title: string;
};

export default function NetworkTopologyPage() {
  const navigate = useNavigate();
  const {
    groups,
    standaloneResources,
    provisionGeneration,
    fitContentToken,
    setStandaloneResources,
    attachStandaloneToGroup,
  } = useNetworkTopologyState();
  const [toasts, setToasts] = useState<TopoToast[]>([]);
  const [nadModalOpen, setNadModalOpen] = useState(false);
  const [udnModalOpen, setUdnModalOpen] = useState(false);
  const [cudnModalOpen, setCudnModalOpen] = useState(false);
  const [nncpModalOpen, setNncpModalOpen] = useState(false);

  const dismissToast = useCallback((key: number) => {
    setToasts((prev) => prev.filter((toast) => toast.key !== key));
  }, []);

  const pushToast = useCallback((toast: Omit<TopoToast, "key">) => {
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
  } = useNodeNetworkConfigurationCreate(pushToast, dismissToast, {
    successTitle: (configName) =>
      `Successfully created node network configuration for ${configName}. Drag standalone resources onto worker nodes to attach them.`,
  });

  const handleCreateResource = useCallback(
    (resource: NetworkCreateResource) => {
      switch (resource) {
        case "node-network-configuration":
          openFormWizard();
          break;
        case "network-attachment-definition":
          setNadModalOpen(true);
          break;
        case "user-defined-network":
          setUdnModalOpen(true);
          break;
        case "cluster-user-defined-network":
          setCudnModalOpen(true);
          break;
        case "node-network-configuration-policy":
          setNncpModalOpen(true);
          break;
        default:
          break;
      }
    },
    [openFormWizard]
  );

  const handleAttachStandaloneToGroup = useCallback(
    (resourceId: string, groupId: string, connectToResourceId?: string) => {
      const standalone = attachStandaloneToGroup(resourceId, groupId, connectToResourceId);
      if (!standalone) return;
      pushToast({
        variant: "info",
        title: `Attached ${standalone.label} to ${standalone.targetNodeLabel}.`,
      });
    },
    [attachStandaloneToGroup, pushToast]
  );

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
        title="Topology"
        path="/networking/topology"
        createButton={<NetworkResourceCreateDropdown onSelect={handleCreateResource} />}
      >
        <div className="ocs-nnc-stage">
          <NetworkTopologyPanel
            groups={groups}
            standaloneResources={standaloneResources}
            onStandaloneResourcesChange={setStandaloneResources}
            onAttachStandaloneToGroup={handleAttachStandaloneToGroup}
            fitContentToken={fitContentToken}
            highlightResourceSuffix={provisionGeneration > 0 ? "br-localnet" : undefined}
          />
          {showFormWizard ? (
            <NodeNetworkConfigurationWizard
              variant="overlay"
              activeStep={activeStep}
              physicalNetworkName={physicalNetworkName}
              onActiveStepChange={setActiveStep}
              onPhysicalNetworkNameChange={setPhysicalNetworkName}
              onClose={closeFormWizard}
              onCreate={handleCreateConfiguration}
              isCreating={isCreating}
            />
          ) : null}
        </div>
      </NetworkingPageShell>
      <CreateNadModal
        isOpen={nadModalOpen}
        onClose={() => setNadModalOpen(false)}
        onCreated={(record) => {
          pushToast({
            variant: "success",
            title: `Created NetworkAttachmentDefinition ${record.name}.`,
          });
          navigate(nadDetailPath(record.namespace, record.name));
        }}
      />
      <CreateUdnModal
        isOpen={udnModalOpen}
        onClose={() => setUdnModalOpen(false)}
        onCreated={(record) => {
          pushToast({
            variant: "success",
            title: `Created UserDefinedNetwork ${record.name}.`,
          });
          navigate(udnDetailPath(record));
        }}
      />
      <CreateClusterUdnModal
        isOpen={cudnModalOpen}
        onClose={() => setCudnModalOpen(false)}
        onCreated={(record) => {
          pushToast({
            variant: "success",
            title: `Created ClusterUserDefinedNetwork ${record.name}.`,
          });
          navigate(udnDetailPath(record));
        }}
      />
      <CreateNncpModal
        isOpen={nncpModalOpen}
        onClose={() => setNncpModalOpen(false)}
        onCreated={(record) => {
          pushToast({
            variant: "success",
            title: `Created NodeNetworkConfigurationPolicy ${record.name}.`,
          });
          navigate("/networking/nodenetworkconfigurationpolicy");
        }}
      />
    </>
  );
}
