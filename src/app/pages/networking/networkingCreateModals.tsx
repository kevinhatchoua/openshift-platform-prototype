import { useState } from "react";
import {
  Alert,
  Button,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  Form,
  FormGroup,
  FormHelperText,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextArea,
  TextInput,
} from "@patternfly/react-core";
import type { NadRecord, NncpRecord, UdnRecord } from "./networkingMockData";
import {
  PROTOTYPE_NS,
  createCudn,
  createNad,
  createNncp,
  createUdn,
  generateCudnName,
  generateNadName,
  generateNncpName,
  generateUdnName,
} from "./networkingMockData";

export type NetworkCreateResource =
  | "node-network-configuration"
  | "network-attachment-definition"
  | "user-defined-network"
  | "cluster-user-defined-network"
  | "node-network-configuration-policy";

const CREATE_ITEMS: { id: NetworkCreateResource; label: string }[] = [
  { id: "node-network-configuration", label: "Node network configuration" },
  { id: "network-attachment-definition", label: "NetworkAttachmentDefinition" },
  { id: "user-defined-network", label: "UserDefinedNetwork" },
  { id: "cluster-user-defined-network", label: "ClusterUserDefinedNetwork" },
  { id: "node-network-configuration-policy", label: "NodeNetworkConfigurationPolicy" },
];

export function NetworkResourceCreateDropdown({
  onSelect,
}: {
  onSelect: (resource: NetworkCreateResource) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dropdown
      isOpen={open}
      onOpenChange={(isOpen) => setOpen(isOpen)}
      toggle={(toggleRef) => (
        <MenuToggle ref={toggleRef} onClick={() => setOpen((o) => !o)} variant="primary">
          Create
        </MenuToggle>
      )}
      popperProps={{ position: "right" }}
    >
      <DropdownList>
        {CREATE_ITEMS.map((item) => (
          <DropdownItem
            key={item.id}
            itemId={item.id}
            onClick={() => {
              setOpen(false);
              onSelect(item.id);
            }}
          >
            {item.label}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
}

function isValidCidr(value: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}\/\d{1,2}$/.test(value.trim());
}

export function CreateNadModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (record: NadRecord) => void;
}) {
  const [name, setName] = useState(() => generateNadName());
  const [namespace, setNamespace] = useState(PROTOTYPE_NS);
  const [type, setType] = useState("Linux bridge");

  const canCreate = name.trim().length > 0 && namespace.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    const record = createNad({ name, namespace, type });
    onCreated(record);
    onClose();
    setName(generateNadName());
    setNamespace(PROTOTYPE_NS);
    setType("Linux bridge");
  };

  return (
    <Modal variant="medium" isOpen={isOpen} onClose={onClose} aria-labelledby="create-nad-title">
      <ModalHeader title="Create NetworkAttachmentDefinition" labelId="create-nad-title" />
      <ModalBody>
        <Content component="p">
          Create a secondary network for pods and virtual machines to attach to using a Linux bridge on the node.
        </Content>
        <Form className="pf-v6-u-mt-md">
          <FormGroup label="Name" isRequired fieldId="nad-name">
            <TextInput id="nad-name" value={name} onChange={(_e, v) => setName(v)} type="text" />
          </FormGroup>
          <FormGroup label="Namespace" isRequired fieldId="nad-namespace">
            <TextInput id="nad-namespace" value={namespace} onChange={(_e, v) => setNamespace(v)} type="text" />
          </FormGroup>
          <FormGroup label="Type" isRequired fieldId="nad-type">
            <TextInput id="nad-type" value={type} onChange={(_e, v) => setType(v)} type="text" />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" isDisabled={!canCreate} onClick={handleCreate}>
          Create
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export function CreateUdnModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (record: UdnRecord) => void;
}) {
  const [project, setProject] = useState(PROTOTYPE_NS);
  const [name, setName] = useState(() => generateUdnName());
  const [cidr, setCidr] = useState("10.128.0.0/24");

  const canCreate = project.trim().length > 0 && name.trim().length > 0 && isValidCidr(cidr);

  const handleCreate = () => {
    if (!canCreate) return;
    const record = createUdn({ name, namespace: project, subnetCidr: cidr });
    onCreated(record);
    onClose();
    setProject(PROTOTYPE_NS);
    setName(generateUdnName());
    setCidr("10.128.0.0/24");
  };

  return (
    <Modal variant="medium" isOpen={isOpen} onClose={onClose} aria-labelledby="create-udn-title">
      <ModalHeader title="Create UserDefinedNetwork" labelId="create-udn-title" />
      <ModalBody>
        <Alert variant="warning" title="No namespace is configured for a primary user-defined network." isInline>
          At creation time the namespace must be configured with{" "}
          <code>k8s.ovn.org/primary-user-defined-network</code> label. Go to{" "}
          <Button variant="link" isInline component="a" href="/administration/namespaces">
            Namespaces
          </Button>{" "}
          to create a new namespace.
        </Alert>
        <Content component="p" className="pf-v6-u-mt-md">
          Define the network used by VirtualMachines and Pods to communicate in the given project.
        </Content>
        <Form className="pf-v6-u-mt-md">
          <FormGroup label="Project name" isRequired fieldId="udn-project">
            <TextInput id="udn-project" value={project} onChange={(_e, v) => setProject(v)} type="text" />
          </FormGroup>
          <FormGroup label="Name" isRequired fieldId="udn-name">
            <TextInput id="udn-name" value={name} onChange={(_e, v) => setName(v)} type="text" />
          </FormGroup>
          <FormGroup label="Subnet CIDR" isRequired fieldId="udn-cidr">
            <TextInput id="udn-cidr" value={cidr} onChange={(_e, v) => setCidr(v)} type="text" />
            <FormHelperText>
              Dual-stack clusters may set 2 subnets (one for each IP family), otherwise only 1 subnet is allowed.
              The format should match standard CIDR notation (for example, &apos;192.168.123.0/24&apos;).
            </FormHelperText>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" isDisabled={!canCreate} onClick={handleCreate}>
          Create
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export function CreateClusterUdnModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (record: UdnRecord) => void;
}) {
  const [name, setName] = useState(() => generateCudnName());
  const [cidr, setCidr] = useState("10.132.0.0/16");
  const [matchLabels, setMatchLabels] = useState("app=frontend");

  const canCreate = name.trim().length > 0 && isValidCidr(cidr);

  const handleCreate = () => {
    if (!canCreate) return;
    const record = createCudn({ name, subnetCidr: cidr });
    onCreated(record);
    onClose();
    setName(generateCudnName());
    setCidr("10.132.0.0/16");
    setMatchLabels("app=frontend");
  };

  return (
    <Modal variant="medium" isOpen={isOpen} onClose={onClose} aria-labelledby="create-cudn-title">
      <ModalHeader title="Create ClusterUserDefinedNetwork" labelId="create-cudn-title" />
      <ModalBody>
        <Content component="p">
          Define a cluster-scoped user-defined network for VirtualMachines and Pods across selected namespaces.
        </Content>
        <Form className="pf-v6-u-mt-md">
          <FormGroup label="Name" isRequired fieldId="cudn-name">
            <TextInput id="cudn-name" value={name} onChange={(_e, v) => setName(v)} type="text" />
          </FormGroup>
          <FormGroup label="Subnet CIDR" isRequired fieldId="cudn-cidr">
            <TextInput id="cudn-cidr" value={cidr} onChange={(_e, v) => setCidr(v)} type="text" />
            <FormHelperText>
              Dual-stack clusters may set 2 subnets (one for each IP family), otherwise only 1 subnet is allowed.
              The format should match standard CIDR notation (for example, &apos;192.168.123.0/24&apos;).
            </FormHelperText>
          </FormGroup>
          <FormGroup label="Namespace(s)" fieldId="cudn-ns">
            <FormGroup label="Match Labels" isRequired fieldId="cudn-labels">
              <TextArea id="cudn-labels" value={matchLabels} onChange={(_e, v) => setMatchLabels(v)} />
              <FormHelperText>
                matchLabels is a map of {"{key,value}"} pairs. A single {"{key,value}"} in the matchLabels map is
                equivalent to an element of matchExpressions, whose key field is &apos;key&apos;, the operator is
                &apos;In&apos;, and the values array contains only &apos;value&apos;. The requirements are ANDed.
              </FormHelperText>
            </FormGroup>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" isDisabled={!canCreate} onClick={handleCreate}>
          Create
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export function CreateNncpModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (record: NncpRecord) => void;
}) {
  const [name, setName] = useState(() => generateNncpName());

  const canCreate = name.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    const record = createNncp({ name });
    onCreated(record);
    onClose();
    setName(generateNncpName());
  };

  return (
    <Modal variant="medium" isOpen={isOpen} onClose={onClose} aria-labelledby="create-nncp-title">
      <ModalHeader title="Create NodeNetworkConfigurationPolicy" labelId="create-nncp-title" />
      <ModalBody>
        <Content component="p">
          Configure node network interfaces and bridges on selected nodes. This prototype creates a policy that
          provisions <strong>br-localnet</strong> on worker nodes.
        </Content>
        <Form className="pf-v6-u-mt-md">
          <FormGroup label="Name" isRequired fieldId="nncp-name">
            <TextInput id="nncp-name" value={name} onChange={(_e, v) => setName(v)} type="text" />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" isDisabled={!canCreate} onClick={handleCreate}>
          Create
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}
