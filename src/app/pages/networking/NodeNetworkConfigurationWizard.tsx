import {
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Form,
  FormGroup,
  Modal,
  TextInput,
  Wizard,
  WizardHeader,
  WizardStep,
} from "@patternfly/react-core";
import type { TopologyStep } from "./networkTopologyTypes";

export const NNC_WIZARD_STEPS: { id: TopologyStep; name: string }[] = [
  { id: "network-identity", name: "Network identity" },
  { id: "nodes-configuration", name: "Nodes configuration" },
  { id: "uplink-connection", name: "Uplink connection" },
  { id: "settings", name: "Settings" },
  { id: "review", name: "Review and create" },
];

type StepContentProps = {
  physicalNetworkName: string;
  onPhysicalNetworkNameChange: (value: string) => void;
};

function NetworkIdentityStepContent({
  physicalNetworkName,
  onPhysicalNetworkNameChange,
}: StepContentProps) {
  return (
    <>
      <Content component="p" className="pf-v6-u-mb-lg">
        Let&apos;s configure Open vSwitch (OVS). First, to allow VirtualMachines (VMs) to connect to the data center
        network, a bridge must be created on the nodes. Then, you can expose access to the data center network through
        this bridge by defining a new VM network.
      </Content>
      <Form>
        <FormGroup label="Physical network name" isRequired fieldId="physical-network-name">
          <TextInput
            id="physical-network-name"
            value={physicalNetworkName}
            onChange={(_e, v) => onPhysicalNetworkNameChange(v)}
            type="text"
          />
        </FormGroup>
      </Form>
    </>
  );
}

function NodesConfigurationStepContent() {
  return (
    <>
      <Content component="p">
        Choose worker nodes where the OVS bridge <strong>br-localnet</strong> will be configured. Assign nodes from
        the topology <strong>Assigned Nodes</strong> tab after the configuration is created.
      </Content>
      <ul className="ocs-nnc-wizard__node-list pf-v6-u-mt-md">
        <li>worker-0 — Ready</li>
        <li>worker-1 — Ready</li>
        <li>worker-2 — Ready</li>
      </ul>
    </>
  );
}

function UplinkConnectionStepContent({ physicalNetworkName }: Pick<StepContentProps, "physicalNetworkName">) {
  return (
    <>
      <Content component="p">
        Configure the uplink from the OVS bridge to the physical network{" "}
        <strong>{physicalNetworkName || "localnet-rzpi1d"}</strong> using VLAN 100.
      </Content>
      <Form className="pf-v6-u-mt-md">
        <FormGroup label="VLAN ID" fieldId="vlan-id">
          <TextInput id="vlan-id" defaultValue="100" type="text" />
        </FormGroup>
        <FormGroup label="Interface" fieldId="uplink-if">
          <TextInput id="uplink-if" defaultValue="eth1" type="text" />
        </FormGroup>
      </Form>
    </>
  );
}

function SettingsStepContent() {
  return (
    <Form>
      <FormGroup label="MTU" fieldId="mtu">
        <TextInput id="mtu" defaultValue="1500" type="text" />
      </FormGroup>
      <FormGroup label="IPAM mode" fieldId="ipam">
        <TextInput id="ipam" defaultValue="Disabled" type="text" isDisabled />
      </FormGroup>
    </Form>
  );
}

function ReviewStepContent({ physicalNetworkName }: Pick<StepContentProps, "physicalNetworkName">) {
  return (
    <DescriptionList isCompact>
      <DescriptionListGroup>
        <DescriptionListTerm>Physical network name</DescriptionListTerm>
        <DescriptionListDescription>{physicalNetworkName || "localnet-rzpi1d"}</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Nodes</DescriptionListTerm>
        <DescriptionListDescription>Assign from topology after create</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Bridge</DescriptionListTerm>
        <DescriptionListDescription>br-localnet</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Uplink VLAN</DescriptionListTerm>
        <DescriptionListDescription>100 (eth1)</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>MTU</DescriptionListTerm>
        <DescriptionListDescription>1500</DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
}

export default function NodeNetworkConfigurationWizard({
  activeStep,
  physicalNetworkName,
  onActiveStepChange,
  onPhysicalNetworkNameChange,
  onClose,
  onCreate,
  variant = "page",
}: {
  activeStep: number;
  physicalNetworkName: string;
  onActiveStepChange: (step: number) => void;
  onPhysicalNetworkNameChange: (value: string) => void;
  onClose: () => void;
  onCreate: () => void;
  isCreating?: boolean;
  variant?: "page" | "overlay" | "drawer";
}) {
  const wizard = (
    <Wizard
      className={
        variant === "page"
          ? "ocs-nnc-wizard-page"
          : variant === "drawer"
            ? "ocs-nnc-wizard-drawer"
            : undefined
      }
      startIndex={activeStep + 1}
      onStepChange={(_event, currentStep) => {
        const index = NNC_WIZARD_STEPS.findIndex((step) => step.id === currentStep.id);
        if (index >= 0) onActiveStepChange(index);
      }}
      onSave={onCreate}
      onClose={onClose}
      header={<WizardHeader title="Node network configuration" onClose={onClose} />}
      shouldFocusContent
    >
      <WizardStep id="network-identity" name="Network identity">
        <NetworkIdentityStepContent
          physicalNetworkName={physicalNetworkName}
          onPhysicalNetworkNameChange={onPhysicalNetworkNameChange}
        />
      </WizardStep>
      <WizardStep id="nodes-configuration" name="Nodes configuration">
        <NodesConfigurationStepContent />
      </WizardStep>
      <WizardStep id="uplink-connection" name="Uplink connection">
        <UplinkConnectionStepContent physicalNetworkName={physicalNetworkName} />
      </WizardStep>
      <WizardStep id="settings" name="Settings">
        <SettingsStepContent />
      </WizardStep>
      <WizardStep id="review" name="Review and create">
        <ReviewStepContent physicalNetworkName={physicalNetworkName} />
      </WizardStep>
    </Wizard>
  );

  if (variant === "overlay") {
    return (
      <Modal
        variant="large"
        isOpen
        onClose={onClose}
        aria-label="Node network configuration"
        width="min(56rem, 92vw)"
      >
        {wizard}
      </Modal>
    );
  }

  return wizard;
}
