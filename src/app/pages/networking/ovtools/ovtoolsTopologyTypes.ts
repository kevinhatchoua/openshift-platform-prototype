export type OvtoolsTopologyMode = "overview" | "network" | "storage";

export type OvtoolsNodeKind = "node" | "vm" | "nad" | "udn" | "storageclass" | "pvc";

export type OvtoolsTopologyFilters = {
  nodeId: string;
  vmStatus: string;
  search: string;
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
