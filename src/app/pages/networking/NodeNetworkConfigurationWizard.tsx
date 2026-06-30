import {
  Button,
  Content,
  Flex,
  Form,
  FormGroup,
  TextInput,
  Title,
} from "@patternfly/react-core";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import type { TopologyStep } from "./networkTopologyTypes";

export const NNC_WIZARD_STEPS: { id: TopologyStep; name: string }[] = [
  { id: "network-identity", name: "Network identity" },
  { id: "nodes-configuration", name: "Nodes configuration" },
  { id: "uplink-connection", name: "Uplink connection" },
  { id: "settings", name: "Settings" },
  { id: "review", name: "Review and create" },
];

function stepContent(step: TopologyStep, physicalNetworkName: string, onNameChange: (v: string) => void) {
  switch (step) {
    case "network-identity":
      return (
        <>
          <Content component="h2" className="pf-v6-u-mb-md">
            Network identity
          </Content>
          <Content component="p" className="pf-v6-u-mb-lg">
            Let&apos;s configure Open vSwitch (OVS). First, to allow VirtualMachines (VMs) to connect to the data
            center network, a bridge must be created on the nodes. Then, you can expose access to the data center
            network through this bridge by defining a new VM network.
          </Content>
          <Form>
            <FormGroup label="Physical network name" isRequired fieldId="physical-network-name">
              <TextInput
                id="physical-network-name"
                value={physicalNetworkName}
                onChange={(_e, v) => onNameChange(v)}
                type="text"
              />
            </FormGroup>
          </Form>
        </>
      );
    case "nodes-configuration":
      return (
        <>
          <Content component="h2" className="pf-v6-u-mb-md">
            Nodes configuration
          </Content>
          <Content component="p">
            Select worker nodes where the OVS bridge <strong>br-localnet</strong> will be configured. All three
            worker nodes in this cluster are selected for the prototype configuration.
          </Content>
          <ul className="ocs-nnc-wizard__node-list pf-v6-u-mt-md">
            <li>worker-0 — Ready</li>
            <li>worker-1 — Ready</li>
            <li>worker-2 — Ready</li>
          </ul>
        </>
      );
    case "uplink-connection":
      return (
        <>
          <Content component="h2" className="pf-v6-u-mb-md">
            Uplink connection
          </Content>
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
    case "settings":
      return (
        <>
          <Content component="h2" className="pf-v6-u-mb-md">
            Settings
          </Content>
          <Form>
            <FormGroup label="MTU" fieldId="mtu">
              <TextInput id="mtu" defaultValue="1500" type="text" />
            </FormGroup>
            <FormGroup label="IPAM mode" fieldId="ipam">
              <TextInput id="ipam" defaultValue="Disabled" type="text" isDisabled />
            </FormGroup>
          </Form>
        </>
      );
    case "review":
      return (
        <>
          <Content component="h2" className="pf-v6-u-mb-md">
            Review and create
          </Content>
          <dl className="ocs-nnc-wizard__review">
            <dt>Physical network name</dt>
            <dd>{physicalNetworkName || "localnet-rzpi1d"}</dd>
            <dt>Nodes</dt>
            <dd>worker-0, worker-1, worker-2</dd>
            <dt>Bridge</dt>
            <dd>br-localnet</dd>
            <dt>Uplink VLAN</dt>
            <dd>100 (eth1)</dd>
            <dt>MTU</dt>
            <dd>1500</dd>
          </dl>
        </>
      );
    default:
      return null;
  }
}

export default function NodeNetworkConfigurationWizard({
  activeStep,
  physicalNetworkName,
  onActiveStepChange,
  onPhysicalNetworkNameChange,
  onClose,
  onCreate,
  isCreating,
  variant = "page",
}: {
  activeStep: number;
  physicalNetworkName: string;
  onActiveStepChange: (step: number) => void;
  onPhysicalNetworkNameChange: (value: string) => void;
  onClose: () => void;
  onCreate: () => void;
  isCreating?: boolean;
  variant?: "page" | "overlay";
}) {
  const stepId = NNC_WIZARD_STEPS[activeStep]?.id ?? "network-identity";
  const isFirst = activeStep === 0;
  const isLast = activeStep === NNC_WIZARD_STEPS.length - 1;
  const rootClass =
    variant === "overlay" ? "ocs-nnc-wizard-overlay app-glass-panel" : "ocs-nnc-wizard-page app-glass-panel";

  return (
    <div className={rootClass}>
      <div className="ocs-nnc-wizard-overlay__head">
        <Title headingLevel="h2" size="lg">
          Node network configuration
        </Title>
        <Button variant="plain" aria-label="Close create form" icon={<TimesIcon />} onClick={onClose} />
      </div>
      <div className="ocs-nnc-wizard">
        <nav className="ocs-nnc-wizard__nav" aria-label="Configuration steps">
          <ol>
            {NNC_WIZARD_STEPS.map((step, index) => (
              <li key={step.id}>
                <button
                  type="button"
                  className={`ocs-nnc-wizard__nav-item${index === activeStep ? " ocs-nnc-wizard__nav-item--active" : ""}${
                    index < activeStep ? " ocs-nnc-wizard__nav-item--done" : ""
                  }`}
                  onClick={() => onActiveStepChange(index)}
                  aria-current={index === activeStep ? "step" : undefined}
                >
                  <span className="ocs-nnc-wizard__nav-index">{index + 1}</span>
                  {step.name}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div className="ocs-nnc-wizard__body">
          {stepContent(stepId, physicalNetworkName, onPhysicalNetworkNameChange)}
          <Flex gap={{ default: "gapMd" }} className="ocs-nnc-wizard__footer">
            <Button variant="secondary" isDisabled={isFirst} onClick={() => onActiveStepChange(activeStep - 1)}>
              Back
            </Button>
            {isLast ? (
              <Button variant="primary" onClick={onCreate} isLoading={isCreating} isDisabled={isCreating}>
                Create
              </Button>
            ) : (
              <Button variant="primary" onClick={() => onActiveStepChange(activeStep + 1)}>
                Next
              </Button>
            )}
            <Button variant="link" onClick={onClose}>
              Cancel
            </Button>
          </Flex>
        </div>
      </div>
    </div>
  );
}
