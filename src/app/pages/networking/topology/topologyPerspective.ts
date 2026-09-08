import {
  COMPACT_TOPOLOGY_WORKER_COUNT,
  RESOURCE_KIND_LABELS,
  TOPOLOGY_WORKER_COUNT,
  getUdnRecordsForScale,
  isLogicalNetworkStandalone,
  logicalNetworkId,
  visibleTopologyGroupIds,
  type NetResource,
  type NetResourceKind,
  type NetworkNodeAssignments,
  type StandaloneTopologyResource,
  type TopologyDataScale,
  type WorkerNodeGroup,
} from "../networkTopologyData";
import {
  isHostResourceUnhealthy,
  isLogicalNetworkUnhealthy,
  isManagementPortResource,
  isUnhealthyWorkloadStatus,
} from "./topologyTroubleshoot";

/** Topology layout lens — aligned with OpenShift Observability perspective levels. */
export type TopologyPerspective = "owner" | "namespace" | "node" | "network" | "resource";

export const TOPOLOGY_PERSPECTIVES: {
  id: TopologyPerspective;
  label: string;
  description: string;
}[] = [
  {
    id: "owner",
    label: "Owner",
    description: "Group attached Pods and VMs by controller owner (Deployment, VirtualMachine, etc.).",
  },
  {
    id: "namespace",
    label: "Namespace",
    description: "Group workloads and logical networks by Kubernetes namespace.",
  },
  {
    id: "node",
    label: "Node",
    description: "Node underlay: NICs, bonds, VLANs, bridges, and OVN mappings on workers.",
  },
  {
    id: "network",
    label: "Network",
    description: "Cluster fabric: bonds, OVS/OVN bridges, logical networks, and pipe connectivity.",
  },
  {
    id: "resource",
    label: "Resource",
    description: "Individual network resources, attachments, and cross-links at resource granularity.",
  },
];

export type PerspectiveVisibility = {
  showWorkers: boolean;
  showLogicalLane: boolean;
  showWorkloads: boolean;
  workloadLaneLabel: string;
};

/** Derive canvas layers from perspective and pipes-only display mode. */
export function getPerspectiveVisibility(
  perspective: TopologyPerspective,
  pipesOnly: boolean
): PerspectiveVisibility {
  const hideWorkloads = pipesOnly;
  switch (perspective) {
    case "node":
      return { showWorkers: true, showLogicalLane: false, showWorkloads: false, workloadLaneLabel: "Pods & VMs" };
    case "network":
      return {
        showWorkers: true,
        showLogicalLane: true,
        showWorkloads: !hideWorkloads,
        workloadLaneLabel: "Workloads",
      };
    case "namespace":
      return {
        showWorkers: false,
        showLogicalLane: true,
        showWorkloads: !hideWorkloads,
        workloadLaneLabel: "Namespaces",
      };
    case "owner":
      return {
        showWorkers: false,
        showLogicalLane: true,
        showWorkloads: !hideWorkloads,
        workloadLaneLabel: "Owners",
      };
    case "resource":
      return {
        showWorkers: true,
        showLogicalLane: true,
        showWorkloads: !hideWorkloads,
        workloadLaneLabel: "Resources",
      };
    default:
      return { showWorkers: true, showLogicalLane: true, showWorkloads: !hideWorkloads, workloadLaneLabel: "Resources" };
  }
}

/** Host-oriented role derived from mock labels/kinds (prototype taxonomy). */
export type HostResourceRole =
  | "nic"
  | "bond"
  | "vlan"
  | "ovs-bridge"
  | "linux-bridge"
  | "ovn-bridge"
  | "ovn-mapping"
  | "tunnel"
  | "port"
  | "other";

export const HOST_ROLE_LABELS: Record<HostResourceRole, string> = {
  nic: "NIC",
  bond: "Bond",
  vlan: "VLAN",
  "ovs-bridge": "OVS bridge",
  "linux-bridge": "Linux bridge",
  "ovn-bridge": "OVN bridge",
  "ovn-mapping": "OVN bridge mapping",
  tunnel: "Tunnel",
  port: "Port",
  other: "Network interface",
};

export function hostRoleForResource(resource: Pick<NetResource, "label" | "kind" | "detail">): HostResourceRole {
  const label = resource.label.toLowerCase();
  const detail = (resource.detail ?? "").toLowerCase();

  if (resource.kind === "tunnel" || label.includes("geneve") || label.includes("vxlan")) return "tunnel";
  if (resource.kind === "port") return "port";
  if (label.includes("mapping") || detail.includes("bridge-mapping")) return "ovn-mapping";
  if (/^bond\d+(\.\d+)?$/.test(label) || label.startsWith("bond")) {
    return label.includes(".") ? "vlan" : "bond";
  }
  if (label.includes("vlan") || /\.\d{1,4}$/.test(label)) return "vlan";
  if (label.startsWith("br-ex") || detail.includes("ovn external")) return "ovn-bridge";
  if (label.startsWith("br-int") || label.includes("ovn")) return "ovn-bridge";
  if (label.startsWith("ovs") || detail.includes("ovs")) return "ovs-bridge";
  if (label.startsWith("br-") || resource.kind === "bridge") return "linux-bridge";
  if (resource.kind === "interface" || /^(ens|eth|eno|enp)/.test(label)) return "nic";
  return "other";
}

const HOST_VISIBLE_KINDS: NetResourceKind[] = ["interface", "bridge", "tunnel", "port"];
const WORKLOAD_VISIBLE_KINDS: NetResourceKind[] = ["bridge", "cudn", "udn", "interface"];
const CLUSTER_VISIBLE_KINDS: NetResourceKind[] = ["bridge", "interface", "tunnel", "cudn", "udn"];

export function kindsForPerspective(perspective: TopologyPerspective): NetResourceKind[] | "all" {
  switch (perspective) {
    case "node":
      return HOST_VISIBLE_KINDS;
    case "namespace":
    case "owner":
      return WORKLOAD_VISIBLE_KINDS;
    case "network":
      return CLUSTER_VISIBLE_KINDS;
    case "resource":
      return "all";
    default:
      return "all";
  }
}

export type TopologyResourceFilter = "all" | "unhealthy" | NetResourceKind | HostResourceRole | "pod" | "vm";

export type TopologyFilterOption = { id: TopologyResourceFilter; label: string };

const HOST_ROLE_FILTERS: HostResourceRole[] = [
  "nic",
  "bond",
  "vlan",
  "linux-bridge",
  "ovs-bridge",
  "ovn-bridge",
  "tunnel",
  "port",
];

function isHostResourceRole(value: string): value is HostResourceRole {
  return value in HOST_ROLE_LABELS;
}

const UNHEALTHY_FILTER: TopologyFilterOption = { id: "unhealthy", label: "Unhealthy" };

/** Filter-by-resource options for the active perspective lens. */
export function filterOptionsForPerspective(perspective: TopologyPerspective): TopologyFilterOption[] {
  if (perspective === "node") {
    return [UNHEALTHY_FILTER, ...HOST_ROLE_FILTERS.map((role) => ({ id: role, label: HOST_ROLE_LABELS[role] }))];
  }
  if (perspective === "namespace" || perspective === "owner") {
    return [
      UNHEALTHY_FILTER,
      { id: "cudn", label: RESOURCE_KIND_LABELS.cudn },
      { id: "udn", label: RESOURCE_KIND_LABELS.udn },
      { id: "bridge", label: RESOURCE_KIND_LABELS.bridge },
      { id: "pod", label: "Pod" },
      { id: "vm", label: "VirtualMachine" },
    ];
  }
  if (perspective === "resource") {
    return [
      UNHEALTHY_FILTER,
      ...HOST_ROLE_FILTERS.map((role) => ({ id: role, label: HOST_ROLE_LABELS[role] })),
      { id: "cudn", label: RESOURCE_KIND_LABELS.cudn },
      { id: "udn", label: RESOURCE_KIND_LABELS.udn },
      { id: "pod", label: "Pod" },
      { id: "vm", label: "VirtualMachine" },
    ];
  }
  return [
    UNHEALTHY_FILTER,
    { id: "bond", label: HOST_ROLE_LABELS.bond },
    { id: "ovn-bridge", label: HOST_ROLE_LABELS["ovn-bridge"] },
    { id: "ovs-bridge", label: HOST_ROLE_LABELS["ovs-bridge"] },
    { id: "cudn", label: RESOURCE_KIND_LABELS.cudn },
    { id: "udn", label: RESOURCE_KIND_LABELS.udn },
    { id: "pod", label: "Pod" },
    { id: "vm", label: "VirtualMachine" },
  ];
}

export function isFilterValidForPerspective(
  filter: TopologyResourceFilter,
  perspective: TopologyPerspective,
): boolean {
  if (filter === "all") return true;
  return filterOptionsForPerspective(perspective).some((option) => option.id === filter);
}

export function resourceMatchesFilter(
  filter: TopologyResourceFilter,
  perspective: TopologyPerspective,
  resource: { kind: string; hostRole?: HostResourceRole; attachmentKind?: string },
): boolean {
  if (filter === "all" || filter === "unhealthy") return true;
  if (filter === "pod" || filter === "vm") {
    return resource.attachmentKind === filter;
  }
  if (isHostResourceRole(filter) && (perspective === "node" || perspective === "network" || perspective === "resource")) {
    return resource.hostRole === filter || resource.kind === filter;
  }
  return resource.kind === filter;
}

export function resourceVisibleInPerspective(
  resource: Pick<NetResource, "label" | "kind" | "detail">,
  perspective: TopologyPerspective,
): boolean {
  const kinds = kindsForPerspective(perspective);
  if (kinds !== "all" && !kinds.includes(resource.kind)) return false;

  if (perspective === "node") {
    // Node view: underlay only — skip logical CUDN/UDN kinds if they slip through.
    return resource.kind !== "cudn" && resource.kind !== "udn";
  }
  if (perspective === "namespace" || perspective === "owner") {
    // Prefer bridges + logical nets; keep physical NIC only when labeled as mapping/bond uplink.
    if (resource.kind === "tunnel" || resource.kind === "port") return false;
    return true;
  }
  if (perspective === "network") {
    const role = hostRoleForResource(resource);
    if (resource.kind === "cudn" || resource.kind === "udn") return true;
    return role === "bond" || role === "ovs-bridge" || role === "ovn-bridge" || role === "linux-bridge" || role === "nic";
  }
  if (perspective === "resource") {
    return true;
  }
  return true;
}

export type WorkloadAttachmentKind = "pod" | "vm";

export type WorkloadAttachment = {
  id: string;
  label: string;
  kind: WorkloadAttachmentKind;
  namespace: string;
  owner: string;
  networkId: string;
  networkLabel: string;
  workerId?: string;
  status: "Running" | "Pending" | "Failed";
  ip?: string;
};

/** Prototype attachments hung off logical networks / bridges for workload-oriented views. */
function ownerLabel(kind: WorkloadAttachmentKind, label: string): string {
  return kind === "vm" ? `VirtualMachine/${label}` : `Deployment/${label}`;
}

function buildWorkloadAttachments(scale: TopologyDataScale): WorkloadAttachment[] {
  const compact = scale === "compact";
  const workerCount = compact ? COMPACT_TOPOLOGY_WORKER_COUNT : TOPOLOGY_WORKER_COUNT;
  const namespaces = [
    "demo-apps",
    "virtualization",
    "openshift-monitoring",
    "payments",
    "data-plane",
    "edge-cache",
    "ml-training",
    "observability",
  ];
  const statuses: WorkloadAttachment["status"][] = ["Running", "Running", "Running", "Pending", "Failed"];
  const attachments: WorkloadAttachment[] = compact
    ? [
        {
          id: "pod-frontend-1",
          label: "frontend-7f8b9c",
          kind: "pod",
          namespace: "demo-apps",
          owner: ownerLabel("pod", "frontend"),
          networkId: "",
          networkLabel: "Default pod network",
          status: "Running",
          ip: "10.128.2.14",
        },
        {
          id: "vm-web-1",
          label: "web-vm-01",
          kind: "vm",
          namespace: "virtualization",
          owner: ownerLabel("vm", "web-vm-01"),
          networkId: "",
          networkLabel: "vm-network",
          status: "Running",
          ip: "192.168.100.21",
        },
        {
          id: "pod-dns-warning",
          label: "dns-default-8xk2",
          kind: "pod",
          namespace: "openshift-dns",
          owner: ownerLabel("pod", "dns-default"),
          networkId: "",
          networkLabel: "Default pod network",
          status: "Running",
          ip: "10.128.0.4",
        },
        {
          id: "pod-packet-drop",
          label: "nettest-drop-01",
          kind: "pod",
          namespace: "packet-drop-test",
          owner: ownerLabel("pod", "nettest"),
          networkId: "",
          networkLabel: "Default pod network",
          status: "Failed",
          ip: "10.131.0.22",
        },
      ]
    : [
        {
          id: "pod-frontend-1",
          label: "frontend-7f8b9c",
          kind: "pod",
          namespace: "demo-apps",
          owner: ownerLabel("pod", "frontend"),
          networkId: "",
          networkLabel: "Default pod network",
          status: "Running",
          ip: "10.128.2.14",
        },
        {
          id: "vm-web-1",
          label: "web-vm-01",
          kind: "vm",
          namespace: "virtualization",
          owner: ownerLabel("vm", "web-vm-01"),
          networkId: "",
          networkLabel: "vm-network",
          status: "Running",
          ip: "192.168.100.21",
        },
        {
          id: "vm-db-1",
          label: "db-vm-02",
          kind: "vm",
          namespace: "virtualization",
          owner: ownerLabel("vm", "db-vm-02"),
          networkId: "",
          networkLabel: "vm-network",
          status: "Pending",
          ip: "192.168.100.44",
        },
        {
          id: "pod-monitor-1",
          label: "node-exporter-xk2",
          kind: "pod",
          namespace: "openshift-monitoring",
          owner: ownerLabel("pod", "node-exporter"),
          networkId: "",
          networkLabel: "Default pod network",
          status: "Running",
          ip: "10.129.0.8",
        },
        {
          id: "pod-packet-drop",
          label: "nettest-drop-01",
          kind: "pod",
          namespace: "packet-drop-test",
          owner: ownerLabel("pod", "nettest"),
          networkId: "",
          networkLabel: "Default pod network",
          status: "Failed",
          ip: "10.131.0.22",
        },
      ];

  getUdnRecordsForScale(scale).forEach((record, networkIndex) => {
    const networkId = logicalNetworkId(record.name, record.kind);
    const networkLabel = record.name;
    const podCount = compact ? 1 : record.kind === "CUDN" ? 4 : 3;
    const vmCount = compact ? (record.kind === "CUDN" ? 1 : 0) : record.kind === "CUDN" ? 2 : 1;

    for (let i = 0; i < podCount; i += 1) {
      const suffix = String(networkIndex * 10 + i).padStart(3, "0");
      attachments.push({
        id: `pod-${record.name}-${i}`,
        label: `app-${suffix}`,
        kind: "pod",
        namespace: namespaces[(networkIndex + i) % namespaces.length],
        owner: ownerLabel("pod", `app-${suffix}`),
        networkId,
        networkLabel,
        workerId: `worker-${(networkIndex + i) % workerCount}`,
        status: statuses[(networkIndex + i) % statuses.length],
        ip: `10.${120 + (networkIndex % 8)}.${i}.${14 + (networkIndex % 200)}`,
      });
    }

    for (let i = 0; i < vmCount; i += 1) {
      const suffix = String(networkIndex * 10 + i).padStart(3, "0");
      attachments.push({
        id: `vm-${record.name}-${i}`,
        label: `vm-${suffix}`,
        kind: "vm",
        namespace: "virtualization",
        owner: ownerLabel("vm", `vm-${suffix}`),
        networkId,
        networkLabel,
        workerId: `worker-${(networkIndex + i + 3) % workerCount}`,
        status: statuses[(networkIndex + i + 1) % statuses.length],
        ip: `192.168.${networkIndex % 64}.${20 + i}`,
      });
    }
  });

  return attachments;
}

const workloadAttachmentsByScale: Record<TopologyDataScale, WorkloadAttachment[]> = {
  scale: buildWorkloadAttachments("scale"),
  compact: buildWorkloadAttachments("compact"),
};

export function getWorkloadAttachmentsForScale(scale: TopologyDataScale): WorkloadAttachment[] {
  return workloadAttachmentsByScale[scale];
}

/** @deprecated Use getWorkloadAttachmentsForScale(scale) for scale-aware workload data. */
export const WORKLOAD_ATTACHMENTS: WorkloadAttachment[] = workloadAttachmentsByScale.scale;

export function attachmentsForNetwork(
  networkLabel: string,
  networkId: string,
  scale: TopologyDataScale = "scale"
): WorkloadAttachment[] {
  const needle = networkLabel.toLowerCase();
  return getWorkloadAttachmentsForScale(scale).filter((a) => {
    const label = a.networkLabel.toLowerCase();
    if (needle.includes("default") && label.includes("default")) return true;
    if (needle.includes("vm") && label.includes("vm")) return true;
    if (a.networkId && a.networkId === networkId) return true;
    return false;
  }).map((a) => ({ ...a, networkId: networkId || a.networkId, networkLabel }));
}

function incrementFilterCount(
  counts: Partial<Record<TopologyResourceFilter, number>>,
  filter: TopologyResourceFilter
) {
  counts[filter] = (counts[filter] ?? 0) + 1;
}

/** Count visible resources per filter option for the active perspective (ignores active filter). */
export function computeFilterCounts(args: {
  perspective: TopologyPerspective;
  groups: WorkerNodeGroup[];
  standaloneResources: StandaloneTopologyResource[];
  networkNodeAssignments: NetworkNodeAssignments;
  revealedGroupIds: string[];
  dataScale?: TopologyDataScale;
}): Partial<Record<TopologyResourceFilter, number>> {
  const { perspective, groups, standaloneResources, networkNodeAssignments, revealedGroupIds, dataScale = "scale" } =
    args;
  const counts: Partial<Record<TopologyResourceFilter, number>> = {};
  const options = filterOptionsForPerspective(perspective);
  options.forEach((option) => {
    counts[option.id] = 0;
  });

  const visibleIds = visibleTopologyGroupIds(networkNodeAssignments, revealedGroupIds);
  const visibleGroups = groups.filter((group) => visibleIds.has(group.id));

  const countResource = (
    resource: Pick<NetResource, "id" | "label" | "kind" | "detail" | "status">,
    groupId?: string
  ) => {
    if (!resourceVisibleInPerspective(resource, perspective)) return;
    const hostRole = hostRoleForResource(resource);
    if (groupId && isHostResourceUnhealthy(resource, groupId)) {
      incrementFilterCount(counts, "unhealthy");
    }
    options.forEach((option) => {
      if (option.id === "unhealthy") return;
      if (resourceMatchesFilter(option.id, perspective, { kind: resource.kind, hostRole })) {
        incrementFilterCount(counts, option.id);
      }
    });
  };

  visibleGroups.forEach((group) => group.resources.forEach((resource) => countResource(resource, group.id)));
  standaloneResources.forEach((resource) => {
    if (isLogicalNetworkUnhealthy(resource)) {
      incrementFilterCount(counts, "unhealthy");
    }
    countResource(resource);
  });

  if (perspective === "namespace" || perspective === "owner" || perspective === "network" || perspective === "resource") {
    const logicalStandalones = standaloneResources.filter(isLogicalNetworkStandalone);
    const countedAttachments = new Set<string>();
    logicalStandalones.forEach((resource) => {
      if (!resourceVisibleInPerspective(resource, perspective)) return;
      attachmentsForNetwork(resource.label, resource.id, dataScale).forEach((attachment) => {
        const key = `${attachment.id}::${resource.id}`;
        if (countedAttachments.has(key)) return;
        countedAttachments.add(key);
        if (isUnhealthyWorkloadStatus(attachment.status)) {
          incrementFilterCount(counts, "unhealthy");
        }
        options.forEach((option) => {
          if (option.id === "unhealthy") return;
          if (
            resourceMatchesFilter(option.id, perspective, {
              kind: attachment.kind,
              attachmentKind: attachment.kind,
            })
          ) {
            incrementFilterCount(counts, option.id);
          }
        });
      });
    });
  }

  return counts;
}
