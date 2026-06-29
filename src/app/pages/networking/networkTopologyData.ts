import type { TopologyStep } from "./networkTopologyTypes";

export type NetResourceKind = "bridge" | "interface" | "tunnel" | "port";

/** Installation / reconciliation status for a network resource. */
export type ResourceInstallStatus =
  | "configured"
  | "pending"
  | "installing"
  | "creating"
  | "failed";

export type NetResource = {
  id: string;
  label: string;
  kind: NetResourceKind;
  x: number;
  y: number;
  status: ResourceInstallStatus;
  detail: string;
  highlightSteps: TopologyStep[];
  related?: string[];
};

/** Resource placed on the canvas outside any node group until linked or dropped into a group. */
export type StandaloneTopologyResource = NetResource & {
  canvasX: number;
  canvasY: number;
  targetNodeId: string;
  targetNodeLabel: string;
};

export type TopologyEdge = { id: string; from: string; to: string };

export type WorkerNodeGroup = {
  id: string;
  shortName: string;
  hostname: string;
  x: number;
  y: number;
  width: number;
  height: number;
  resources: NetResource[];
  edges: TopologyEdge[];
};

export const GROUP_W = 304;
export const GROUP_H = 260;
export const GROUP_GAP = 72;
export const RESOURCE_W = 80;
export const RESOURCE_H = 92;
export const BASE_X = 40;
export const BASE_Y = 48;

/** Non-overlapping grid cells inside each worker group. */
export const RESOURCE_CELL_W = 88;
export const RESOURCE_CELL_H = 100;
export const RESOURCE_GRID_ORIGIN_X = 16;
export const RESOURCE_GRID_ORIGIN_Y = 16;
export const RESOURCE_COL_GAP = 14;
export const RESOURCE_ROW_GAP = 16;

export function resourceGridPos(col: number, row: number) {
  return {
    x: RESOURCE_GRID_ORIGIN_X + col * (RESOURCE_CELL_W + RESOURCE_COL_GAP),
    y: RESOURCE_GRID_ORIGIN_Y + row * (RESOURCE_CELL_H + RESOURCE_ROW_GAP),
  };
}

/** Canonical slot layout — one resource per cell, never overlaps. */
export const RESOURCE_SLOT_LAYOUT: Record<string, { col: number; row: number }> = {
  "br-ex-a": { col: 0, row: 0 },
  "br-ex-b": { col: 1, row: 0 },
  "br-int": { col: 2, row: 0 },
  "ovn-k8s-mp0": { col: 1, row: 1 },
  "geneve": { col: 2, row: 1 },
  "ens5": { col: 0, row: 1 },
  "br-localnet": { col: 1, row: 2 },
};

export function slotKeyFromSuffix(suffix: string) {
  return RESOURCE_SLOT_LAYOUT[suffix] ?? { col: 0, row: 0 };
}

export const RESOURCE_INSTALL_STATUS_LABELS: Record<ResourceInstallStatus, string> = {
  configured: "Configured",
  pending: "Pending",
  installing: "Installing",
  creating: "Creating",
  failed: "Failed",
};

export const RESOURCE_INSTALL_STATUS_COLORS: Record<
  ResourceInstallStatus,
  "green" | "grey" | "blue" | "orange" | "red"
> = {
  configured: "green",
  pending: "grey",
  installing: "blue",
  creating: "orange",
  failed: "red",
};

function edgeId(from: string, to: string) {
  return `${from}__${to}`;
}

function buildWorkerGroup(
  id: string,
  shortName: string,
  hostname: string,
  gridX: number,
  gridY: number,
  geneSuffix: string,
  statuses: Record<string, ResourceInstallStatus>
): WorkerNodeGroup {
  const prefix = `${id}-`;
  const slotFor = (suffix: string) => {
    const slot = slotKeyFromSuffix(suffix);
    return resourceGridPos(slot.col, slot.row);
  };
  const resources: NetResource[] = [
    {
      id: `${prefix}br-ex-a`,
      label: "br-ex",
      kind: "bridge",
      ...slotFor("br-ex-a"),
      status: statuses[`${prefix}br-ex-a`] ?? "configured",
      detail: "External OVS bridge — uplink to the data center network.",
      highlightSteps: ["network-identity", "uplink-connection", "review"],
      related: [`${prefix}ens5`, `${prefix}br-ex-b`],
    },
    {
      id: `${prefix}br-ex-b`,
      label: "br-ex",
      kind: "bridge",
      ...slotFor("br-ex-b"),
      status: statuses[`${prefix}br-ex-b`] ?? "configured",
      detail: "External bridge patch port connecting br-ex to the integration bridge.",
      highlightSteps: ["uplink-connection", "review"],
      related: [`${prefix}br-ex-a`, `${prefix}br-int`],
    },
    {
      id: `${prefix}br-int`,
      label: "br-int",
      kind: "bridge",
      ...slotFor("br-int"),
      status: statuses[`${prefix}br-int`] ?? "pending",
      detail: "Integration bridge for pod and service traffic within the node.",
      highlightSteps: ["nodes-configuration", "review"],
      related: [`${prefix}ovn-k8s-mp0`, `${prefix}geneve`],
    },
    {
      id: `${prefix}geneve`,
      label: `gene_${geneSuffix}`,
      kind: "tunnel",
      ...slotFor("geneve"),
      status: statuses[`${prefix}geneve`] ?? "pending",
      detail: "Geneve tunnel endpoint for cross-node overlay traffic.",
      highlightSteps: ["settings", "review"],
    },
    {
      id: `${prefix}ovn-k8s-mp0`,
      label: "ovn-k8s-mp0",
      kind: "port",
      ...slotFor("ovn-k8s-mp0"),
      status: statuses[`${prefix}ovn-k8s-mp0`] ?? "pending",
      detail: "OVN Kubernetes management port attached to br-int.",
      highlightSteps: ["nodes-configuration", "review"],
    },
    {
      id: `${prefix}ens5`,
      label: "ens5",
      kind: "interface",
      ...slotFor("ens5"),
      status: statuses[`${prefix}ens5`] ?? "configured",
      detail: "Physical NIC uplink — VLAN 100 to the data center network.",
      highlightSteps: ["uplink-connection", "settings", "review"],
      related: [`${prefix}br-ex-a`],
    },
  ];

  const edgePairs: [string, string][] = [
    [`${prefix}br-ex-a`, `${prefix}br-ex-b`],
    [`${prefix}br-ex-b`, `${prefix}br-int`],
    [`${prefix}br-ex-a`, `${prefix}ens5`],
    [`${prefix}br-int`, `${prefix}ovn-k8s-mp0`],
    [`${prefix}br-int`, `${prefix}geneve`],
  ];

  return {
    id,
    shortName,
    hostname,
    x: gridX,
    y: gridY,
    width: GROUP_W,
    height: GROUP_H,
    resources,
    edges: edgePairs.map(([from, to]) => ({ id: edgeId(from, to), from, to })),
  };
}

export const WORKER_NODE_GROUPS: WorkerNodeGroup[] = [
  buildWorkerGroup(
    "worker-0",
    "worker-0",
    "ip-10-0-24-42.us-east-2.compute.internal",
    BASE_X,
    BASE_Y,
    "081",
    {
      "worker-0-br-ex-a": "configured",
      "worker-0-br-ex-b": "configured",
      "worker-0-br-int": "configured",
      "worker-0-geneve": "configured",
      "worker-0-ovn-k8s-mp0": "configured",
      "worker-0-ens5": "configured",
    }
  ),
  buildWorkerGroup(
    "worker-1",
    "worker-1",
    "ip-10-0-25-18.us-east-2.compute.internal",
    BASE_X + GROUP_W + GROUP_GAP,
    BASE_Y,
    "142",
    {
      "worker-1-br-ex-a": "configured",
      "worker-1-br-ex-b": "configured",
      "worker-1-br-int": "installing",
      "worker-1-geneve": "pending",
      "worker-1-ovn-k8s-mp0": "creating",
      "worker-1-ens5": "configured",
    }
  ),
  buildWorkerGroup(
    "worker-2",
    "worker-2",
    "ip-10-0-26-91.us-east-2.compute.internal",
    BASE_X + (GROUP_W + GROUP_GAP) * 2,
    BASE_Y,
    "203",
    {
      "worker-2-br-ex-a": "configured",
      "worker-2-br-ex-b": "pending",
      "worker-2-br-int": "pending",
      "worker-2-geneve": "failed",
      "worker-2-ovn-k8s-mp0": "creating",
      "worker-2-ens5": "installing",
    }
  ),
];

export function computeCanvasWidth(groupWidths: number[]) {
  if (groupWidths.length === 0) return BASE_X + GROUP_W + 40;
  const total =
    BASE_X +
    groupWidths.reduce((sum, w) => sum + w, 0) +
    GROUP_GAP * Math.max(0, groupWidths.length - 1) +
    40;
  return total;
}

export const TOPOLOGY_CANVAS_WIDTH = computeCanvasWidth(
  WORKER_NODE_GROUPS.map(() => GROUP_W)
);

export const RESOURCE_KIND_LABELS: Record<NetResourceKind, string> = {
  bridge: "Bridge",
  interface: "Interface",
  tunnel: "Tunnel",
  port: "Port",
};

export const RESOURCE_KIND_COLORS: Record<NetResourceKind, string> = {
  bridge: "#0066cc",
  interface: "#3e8635",
  tunnel: "#6753ac",
  port: "#8f4700",
};

export function resourceCenter(group: WorkerNodeGroup, resource: NetResource, pos?: { x: number; y: number }) {
  const x = pos?.x ?? resource.x;
  const y = pos?.y ?? resource.y;
  return {
    x: group.x + x + RESOURCE_W / 2,
    y: group.y + y + RESOURCE_H / 2,
  };
}

export type NodeNetworkConfigurationInput = {
  physicalNetworkName: string;
  bridgeName?: string;
};

export const STANDALONE_CANVAS_Y = BASE_Y + GROUP_H + 96;
export const STANDALONE_H_SPACING = 168;

const NNCP_TARGET_NODES = [
  { id: "worker-0", label: "worker-0" },
  { id: "worker-1", label: "worker-1" },
  { id: "worker-2", label: "worker-2" },
] as const;

/** Prototype: create br-localnet as standalone canvas resources (one per selected worker). */
export function createStandaloneNetworkResources(
  config: NodeNetworkConfigurationInput
): StandaloneTopologyResource[] {
  const bridgeName = config.bridgeName ?? "br-localnet";

  return NNCP_TARGET_NODES.map((node, index) => ({
    id: `${node.id}-${bridgeName}`,
    label: bridgeName,
    kind: "bridge" as const,
    x: 0,
    y: 0,
    canvasX: BASE_X + index * STANDALONE_H_SPACING,
    canvasY: STANDALONE_CANVAS_Y,
    status: "creating" as const,
    targetNodeId: node.id,
    targetNodeLabel: node.label,
    detail: `Localnet bridge for physical network ${config.physicalNetworkName} on ${node.label}. Drag onto a node group or link to a resource to attach.`,
    highlightSteps: ["network-identity", "uplink-connection", "settings", "review"] as TopologyStep[],
  }));
}

export function updateStandaloneResourcesByIdSuffix(
  resources: StandaloneTopologyResource[],
  idSuffix: string,
  status: ResourceInstallStatus
): StandaloneTopologyResource[] {
  return resources.map((resource) =>
    resource.id.endsWith(idSuffix) ? { ...resource, status } : resource
  );
}

/** Move a standalone resource into a worker group (optionally connect to an existing resource). */
export function attachStandaloneResourceToGroup(
  group: WorkerNodeGroup,
  standalone: StandaloneTopologyResource,
  connectToResourceId?: string
): WorkerNodeGroup {
  const slot = RESOURCE_SLOT_LAYOUT["br-localnet"] ?? { col: 1, row: 2 };
  const pos = resourceGridPos(slot.col, slot.row);
  const resource: NetResource = {
    id: standalone.id,
    label: standalone.label,
    kind: standalone.kind,
    ...pos,
    status: standalone.status,
    detail: standalone.detail.replace(
      "Drag onto a node group or link to a resource to attach.",
      `Attached to ${group.shortName}.`
    ),
    highlightSteps: standalone.highlightSteps,
    related: connectToResourceId ? [connectToResourceId] : standalone.related,
  };

  const existing = group.resources.find((r) => r.id === standalone.id);
  const resources = existing
    ? group.resources.map((r) => (r.id === standalone.id ? resource : r))
    : [...group.resources, resource];

  let edges = group.edges;
  if (connectToResourceId) {
    const newEdge = { id: edgeId(connectToResourceId, standalone.id), from: connectToResourceId, to: standalone.id };
    edges = edges.some((e) => e.id === newEdge.id) ? edges : [...edges, newEdge];
  }

  return { ...group, resources, edges };
}

/** @deprecated Use createStandaloneNetworkResources — resources start outside groups. */
export function applyNodeNetworkConfiguration(
  groups: WorkerNodeGroup[],
  config: NodeNetworkConfigurationInput
): WorkerNodeGroup[] {
  const bridgeName = config.bridgeName ?? "br-localnet";

  return groups.map((group) => {
    const prefix = `${group.id}-`;
    const localnetId = `${prefix}br-localnet`;
    const uplinkId = `${prefix}br-ex-a`;
    const pos = resourceGridPos(
      RESOURCE_SLOT_LAYOUT["br-localnet"]?.col ?? 1,
      RESOURCE_SLOT_LAYOUT["br-localnet"]?.row ?? 2
    );

    const existing = group.resources.find((r) => r.id === localnetId);
    const localnetResource: NetResource = existing
      ? {
          ...existing,
          label: bridgeName,
          status: "creating",
          detail: `Localnet bridge for physical network ${config.physicalNetworkName}. VLAN 100 uplink on eth1.`,
        }
      : {
          id: localnetId,
          label: bridgeName,
          kind: "bridge",
          ...pos,
          status: "creating",
          detail: `Localnet bridge for physical network ${config.physicalNetworkName}. VLAN 100 uplink on eth1.`,
          highlightSteps: ["network-identity", "uplink-connection", "settings", "review"],
          related: [uplinkId, `${prefix}ens5`],
        };

    const resources = existing
      ? group.resources.map((r) => (r.id === localnetId ? localnetResource : r))
      : [...group.resources, localnetResource];

    const edgeToLocalnet = { id: edgeId(uplinkId, localnetId), from: uplinkId, to: localnetId };
    const edges = group.edges.some((e) => e.id === edgeToLocalnet.id)
      ? group.edges
      : [...group.edges, edgeToLocalnet];

    return { ...group, resources, edges };
  });
}

export function updateResourcesByIdSuffix(
  groups: WorkerNodeGroup[],
  idSuffix: string,
  status: ResourceInstallStatus
): WorkerNodeGroup[] {
  return groups.map((group) => ({
    ...group,
    resources: group.resources.map((resource) =>
      resource.id.endsWith(idSuffix) ? { ...resource, status } : resource
    ),
  }));
}
