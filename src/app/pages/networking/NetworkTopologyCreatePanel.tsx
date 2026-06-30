import {
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Title,
} from "@patternfly/react-core";
import NodeNetworkConfigurationWizard from "./NodeNetworkConfigurationWizard";
import {
  CreateClusterUdnForm,
  CreateNadForm,
  CreateNncpForm,
  CreateUdnForm,
  type NetworkCreateResource,
} from "./networkingCreateModals";
import type { NadRecord, NncpRecord, UdnRecord } from "./networkingMockData";

export const CREATE_RESOURCE_TITLES: Record<NetworkCreateResource, string> = {
  "node-network-configuration": "Node network configuration",
  "network-attachment-definition": "Create NetworkAttachmentDefinition",
  "user-defined-network": "Create UserDefinedNetwork",
  "cluster-user-defined-network": "Create ClusterUserDefinedNetwork",
  "node-network-configuration-policy": "Create NodeNetworkConfigurationPolicy",
};

export type NetworkTopologyNncWizardProps = {
  activeStep: number;
  onActiveStepChange: (step: number) => void;
  physicalNetworkName: string;
  onPhysicalNetworkNameChange: (value: string) => void;
  onCreate: () => void;
  onOpen?: () => void;
};

type NetworkTopologyCreatePanelProps = {
  resource: NetworkCreateResource;
  onClose: () => void;
  nncWizard?: NetworkTopologyNncWizardProps;
  onNadCreated?: (record: NadRecord) => void;
  onUdnCreated?: (record: UdnRecord) => void;
  onCudnCreated?: (record: UdnRecord) => void;
  onNncpCreated?: (record: NncpRecord) => void;
};

export default function NetworkTopologyCreatePanel({
  resource,
  onClose,
  nncWizard,
  onNadCreated,
  onUdnCreated,
  onCudnCreated,
  onNncpCreated,
}: NetworkTopologyCreatePanelProps) {
  const isNncWizard = resource === "node-network-configuration";

  if (isNncWizard && nncWizard) {
    return (
      <DrawerPanelContent
        hasNoGlass
        className="ocs-net-topo-create-drawer ocs-net-topo-create-drawer--wizard"
        widths={{ default: "width_50" }}
        focusTrap={{ enabled: true }}
      >
        <NodeNetworkConfigurationWizard
          variant="drawer"
          activeStep={nncWizard.activeStep}
          physicalNetworkName={nncWizard.physicalNetworkName}
          onActiveStepChange={nncWizard.onActiveStepChange}
          onPhysicalNetworkNameChange={nncWizard.onPhysicalNetworkNameChange}
          onClose={onClose}
          onCreate={() => {
            nncWizard.onCreate();
            onClose();
          }}
        />
      </DrawerPanelContent>
    );
  }

  return (
    <DrawerPanelContent
      hasNoGlass
      className="ocs-net-topo-create-drawer"
      widths={{ default: "width_33" }}
      focusTrap={{ enabled: true }}
    >
      <DrawerHead>
        <Title headingLevel="h2" size="xl">
          {CREATE_RESOURCE_TITLES[resource]}
        </Title>
        <DrawerActions>
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody className="ocs-net-topo-create-drawer__body">
        {resource === "network-attachment-definition" ? (
          <CreateNadForm
            onCancel={onClose}
            onCreated={(record) => {
              onNadCreated?.(record);
              onClose();
            }}
          />
        ) : null}
        {resource === "user-defined-network" ? (
          <CreateUdnForm
            onCancel={onClose}
            onCreated={(record) => {
              onUdnCreated?.(record);
              onClose();
            }}
          />
        ) : null}
        {resource === "cluster-user-defined-network" ? (
          <CreateClusterUdnForm
            onCancel={onClose}
            onCreated={(record) => {
              onCudnCreated?.(record);
              onClose();
            }}
          />
        ) : null}
        {resource === "node-network-configuration-policy" ? (
          <CreateNncpForm
            onCancel={onClose}
            onCreated={(record) => {
              onNncpCreated?.(record);
              onClose();
            }}
          />
        ) : null}
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
}
