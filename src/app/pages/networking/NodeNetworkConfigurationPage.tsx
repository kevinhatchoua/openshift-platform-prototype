import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  Button,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Form,
  FormGroup,
  MenuToggle,
  TextInput,
  Title,
} from "@patternfly/react-core";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import {
  DataViewTextFilter,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import { IoDataViewFiltersWithMidActions } from "../../components/dataView/IoDataViewFiltersWithMidActions";
import NetworkTopologyPanel from "./NetworkTopologyPanel";
import {
  WORKER_NODE_GROUPS,
  attachStandaloneResourceToGroup,
  createStandaloneNetworkResources,
  updateStandaloneResourcesByIdSuffix,
  type StandaloneTopologyResource,
  type WorkerNodeGroup,
} from "./networkTopologyData";
import { NetworkingPageShell } from "./networkingShared";
import type { TopologyStep } from "./networkTopologyTypes";

type NncFilters = { name: string };

type NncToast = {
  key: number;
  variant: "success" | "info" | "warning" | "danger";
  title: string;
};

const WIZARD_STEPS: { id: TopologyStep; name: string }[] = [
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

function NodeNetworkConfigurationWizardOverlay({
  activeStep,
  physicalNetworkName,
  onActiveStepChange,
  onPhysicalNetworkNameChange,
  onClose,
  onCreate,
  isCreating,
}: {
  activeStep: number;
  physicalNetworkName: string;
  onActiveStepChange: (step: number) => void;
  onPhysicalNetworkNameChange: (value: string) => void;
  onClose: () => void;
  onCreate: () => void;
  isCreating?: boolean;
}) {
  const stepId = WIZARD_STEPS[activeStep]?.id ?? "network-identity";
  const isFirst = activeStep === 0;
  const isLast = activeStep === WIZARD_STEPS.length - 1;

  return (
    <aside className="ocs-nnc-wizard-overlay app-glass-panel" aria-label="Create node network configuration">
      <div className="ocs-nnc-wizard-overlay__head">
        <Title headingLevel="h2" size="lg">
          Node network configuration
        </Title>
        <Button variant="plain" aria-label="Close create form" icon={<TimesIcon />} onClick={onClose} />
      </div>
      <div className="ocs-nnc-wizard">
        <nav className="ocs-nnc-wizard__nav" aria-label="Configuration steps">
          <ol>
            {WIZARD_STEPS.map((step, index) => (
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
    </aside>
  );
}

export default function NodeNetworkConfigurationPage() {
  const { filters, onSetFilters } = useDataViewFilters<NncFilters>({
    filters: { name: "" },
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [showFormWizard, setShowFormWizard] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [physicalNetworkName, setPhysicalNetworkName] = useState("localnet-rzpi1d");
  const [topologyGroups, setTopologyGroups] = useState<WorkerNodeGroup[]>(() =>
    WORKER_NODE_GROUPS.map((group) => ({
      ...group,
      resources: group.resources.map((r) => ({ ...r })),
      edges: group.edges.map((e) => ({ ...e })),
    }))
  );
  const [standaloneResources, setStandaloneResources] = useState<StandaloneTopologyResource[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [provisionGeneration, setProvisionGeneration] = useState(0);
  const [fitContentToken, setFitContentToken] = useState(0);
  const [toasts, setToasts] = useState<NncToast[]>([]);
  const creatingToastKeyRef = useRef<number | null>(null);
  const lastConfigNameRef = useRef("localnet-rzpi1d");

  const dismissToast = useCallback((key: number) => {
    setToasts((prev) => prev.filter((toast) => toast.key !== key));
    if (creatingToastKeyRef.current === key) {
      creatingToastKeyRef.current = null;
    }
  }, []);

  const pushToast = useCallback((toast: Omit<NncToast, "key">) => {
    const key = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [{ key, ...toast }, ...prev].slice(0, 4));
    return key;
  }, []);

  const openFormWizard = () => {
    setCreateOpen(false);
    setActiveStep(0);
    setPhysicalNetworkName("localnet-rzpi1d");
    setShowFormWizard(true);
  };

  const handleCreateConfiguration = () => {
    setIsCreating(true);
    const name = physicalNetworkName.trim() || "localnet-rzpi1d";
    lastConfigNameRef.current = name;
    setStandaloneResources((prev) => {
      const withoutPrior = prev.filter((r) => !r.id.endsWith("br-localnet"));
      return [...withoutPrior, ...createStandaloneNetworkResources({ physicalNetworkName: name, bridgeName: "br-localnet" })];
    });
    creatingToastKeyRef.current = pushToast({
      variant: "info",
      title: `Creating node network configuration for ${name} on worker-0, worker-1, and worker-2…`,
    });
    setShowFormWizard(false);
    setIsCreating(false);
    setProvisionGeneration((g) => g + 1);
    setFitContentToken((t) => t + 1);
  };

  const handleAttachStandaloneToGroup = useCallback(
    (resourceId: string, groupId: string, connectToResourceId?: string) => {
      const standalone = standaloneResources.find((r) => r.id === resourceId);
      if (!standalone) return;
      setStandaloneResources((prev) => prev.filter((r) => r.id !== resourceId));
      setTopologyGroups((groups) =>
        groups.map((group) =>
          group.id === groupId
            ? attachStandaloneResourceToGroup(group, standalone, connectToResourceId)
            : group
        )
      );
      pushToast({
        variant: "info",
        title: `Attached ${standalone.label} to ${standalone.targetNodeLabel}.`,
      });
      setFitContentToken((t) => t + 1);
    },
    [standaloneResources, pushToast]
  );

  useEffect(() => {
    if (provisionGeneration === 0) return undefined;

    const installingTimer = window.setTimeout(() => {
      setStandaloneResources((prev) => updateStandaloneResourcesByIdSuffix(prev, "br-localnet", "installing"));
    }, 1600);

    const configuredTimer = window.setTimeout(() => {
      const configName = lastConfigNameRef.current;
      setStandaloneResources((prev) => updateStandaloneResourcesByIdSuffix(prev, "br-localnet", "configured"));
      if (creatingToastKeyRef.current !== null) {
        dismissToast(creatingToastKeyRef.current);
      }
      pushToast({
        variant: "success",
        title: `Successfully created node network configuration for ${configName}. Drag br-localnet onto a node group or link it to attach.`,
      });
    }, 3400);

    return () => {
      window.clearTimeout(installingTimer);
      window.clearTimeout(configuredTimer);
    };
  }, [provisionGeneration, dismissToast, pushToast]);

  const stepId = WIZARD_STEPS[activeStep]?.id ?? "network-identity";

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
                <DropdownItem itemId="from-form" onClick={openFormWizard}>
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
      <div className="ocs-nnc-stage">
        <NetworkTopologyPanel
          groups={topologyGroups}
          standaloneResources={standaloneResources}
          onStandaloneResourcesChange={setStandaloneResources}
          onAttachStandaloneToGroup={handleAttachStandaloneToGroup}
          activeStep={showFormWizard ? stepId : undefined}
          physicalNetworkName={showFormWizard ? physicalNetworkName : undefined}
          fitContentToken={fitContentToken}
          highlightResourceSuffix={provisionGeneration > 0 ? "br-localnet" : undefined}
        />
        {showFormWizard ? (
          <NodeNetworkConfigurationWizardOverlay
            activeStep={activeStep}
            physicalNetworkName={physicalNetworkName}
            onActiveStepChange={setActiveStep}
            onPhysicalNetworkNameChange={setPhysicalNetworkName}
            onClose={() => setShowFormWizard(false)}
            onCreate={handleCreateConfiguration}
            isCreating={isCreating}
          />
        ) : null}
      </div>
    </NetworkingPageShell>
    </>
  );
}
