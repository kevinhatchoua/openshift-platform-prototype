export type OvtoolsTopologyMode = "overview" | "network" | "storage";

export type OvtoolsNodeKind = "node" | "vm" | "nad" | "udn" | "storageclass" | "pvc" | "cluster";

export type OvtoolsTopologyFilters = {
  nodeId: string;
  vmStatus: string;
  search: string;
  namespace: string;
  resourceType: "all" | OvtoolsNodeKind;
  showProblemsOnly: boolean;
};

export type OvtoolsElementMeta = {
  kind: OvtoolsNodeKind;
  namespace?: string;
  status?: string;
  detail?: string;
  hostname?: string;
  parentLabel?: string;
};

export const OVTOOLS_TOPO_MODES: { id: OvtoolsTopologyMode; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "network", label: "Network" },
  { id: "storage", label: "Storage" },
];

export const OVTOOLS_VM_STATUS_OPTIONS = [
  { value: "all", label: "All VM statuses" },
  { value: "Running", label: "Running" },
  { value: "Stopped", label: "Stopped" },
  { value: "ErrorUnschedulable", label: "Error / Unschedulable" },
  { value: "Provisioning", label: "Provisioning" },
];

export const OVTOOLS_RESOURCE_TYPE_OPTIONS: { value: "all" | OvtoolsNodeKind; label: string }[] = [
  { value: "all", label: "All resource types" },
  { value: "node", label: "Node" },
  { value: "vm", label: "Virtual machine" },
  { value: "nad", label: "NetworkAttachmentDefinition" },
  { value: "udn", label: "UserDefinedNetwork" },
  { value: "pvc", label: "PersistentVolumeClaim" },
  { value: "storageclass", label: "StorageClass" },
];

export const OVTOOLS_NAMESPACE_OPTIONS = [
  { value: "all", label: "All namespaces" },
  { value: "default", label: "default" },
  { value: "production", label: "production" },
  { value: "openshift-monitoring", label: "openshift-monitoring" },
];
