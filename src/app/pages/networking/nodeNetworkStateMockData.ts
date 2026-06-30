import type { NetResourceKind, WorkerNodeGroup } from "./networkTopologyData";

export type NodeNetworkInterfaceType = "ethernet" | "ovs-bridge" | "ovs-interface" | "tunnel" | "unknown";

export type NodeNetworkInterfaceRow = {
  id: string;
  name: string;
  type: NodeNetworkInterfaceType;
  ipAddress: string;
  ports: string;
  macAddress: string;
  lldp: string;
  mtu: number;
};

export type NodeNetworkStateRow = {
  id: string;
  hostname: string;
  shortName: string;
  interfaceCount: number;
  interfaces: NodeNetworkInterfaceRow[];
};

/** Physical underlay segment kinds — styling tokens live only in this mapping module. */
export type PhysicalUnderlaySegmentKind = "nic" | "bond" | "vlan" | "bridge";

export type PhysicalUnderlaySegment = {
  kind: PhysicalUnderlaySegmentKind;
  label: string;
  detail?: string;
  /** PF Label color token key */
  badgeColor: "blue" | "purple" | "cyan" | "green" | "orange";
};

export type PhysicalUnderlayChain = {
  bridgeResourceSuffix: string;
  segments: PhysicalUnderlaySegment[];
};

const PHYSICAL_UNDERLAY_CHAINS: PhysicalUnderlayChain[] = [
  {
    bridgeResourceSuffix: "br-ex-a",
    segments: [
      { kind: "nic", label: "ens5", detail: "Physical NIC", badgeColor: "blue" },
      { kind: "bond", label: "bond0", detail: "802.3ad", badgeColor: "purple" },
      { kind: "vlan", label: "VLAN 100", detail: "Data center uplink", badgeColor: "cyan" },
      { kind: "bridge", label: "br-ex", detail: "OVS external bridge", badgeColor: "green" },
    ],
  },
  {
    bridgeResourceSuffix: "br-localnet",
    segments: [
      { kind: "nic", label: "ens5", detail: "Physical NIC", badgeColor: "blue" },
      { kind: "bond", label: "bond0", detail: "802.3ad", badgeColor: "purple" },
      { kind: "vlan", label: "VLAN 100", detail: "localnet-rzpi1d", badgeColor: "orange" },
      { kind: "bridge", label: "br-localnet", detail: "OVS localnet bridge", badgeColor: "green" },
    ],
  },
  {
    bridgeResourceSuffix: "br-int",
    segments: [
      { kind: "nic", label: "ens5", detail: "Physical NIC", badgeColor: "blue" },
      { kind: "bond", label: "bond0", detail: "802.3ad", badgeColor: "purple" },
      { kind: "vlan", label: "VLAN 100", detail: "Integration segment", badgeColor: "cyan" },
      { kind: "bridge", label: "br-int", detail: "OVS integration bridge", badgeColor: "green" },
    ],
  },
];

const underlayBySuffix = new Map(
  PHYSICAL_UNDERLAY_CHAINS.map((chain) => [chain.bridgeResourceSuffix, chain])
);

export function bridgeResourceSuffix(resourceId: string): string {
  const dash = resourceId.lastIndexOf("-");
  return dash >= 0 ? resourceId.slice(dash + 1) : resourceId;
}

export function getPhysicalUnderlayForBridge(resourceId: string): PhysicalUnderlayChain | null {
  return underlayBySuffix.get(bridgeResourceSuffix(resourceId)) ?? null;
}

export function underlayNicResourceSuffix(chain: PhysicalUnderlayChain): string | null {
  const nic = chain.segments.find((segment) => segment.kind === "nic");
  return nic ? nic.label : null;
}

function interfaceTypeForKind(kind: NetResourceKind): NodeNetworkInterfaceType {
  if (kind === "bridge") return "ovs-bridge";
  if (kind === "interface") return "ethernet";
  if (kind === "port") return "ovs-interface";
  if (kind === "tunnel") return "tunnel";
  return "unknown";
}

function mockMac(seed: string) {
  const hex = seed
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0).toString(16).padStart(2, "0"), "")
    .slice(0, 12)
    .padEnd(12, "0");
  return hex.match(/.{1,2}/g)?.join(":") ?? "00:00:00:00:00:00";
}

export function nodeNetworkStateRowsFromGroups(groups: WorkerNodeGroup[]): NodeNetworkStateRow[] {
  return groups.map((group) => {
    const interfaces: NodeNetworkInterfaceRow[] = group.resources.map((resource) => ({
      id: resource.id,
      name: resource.label,
      type: interfaceTypeForKind(resource.kind),
      ipAddress: "—",
      ports: resource.kind === "bridge" ? "1" : "—",
      macAddress: resource.kind === "interface" ? mockMac(resource.id) : "—",
      lldp: "—",
      mtu: resource.kind === "interface" ? 9001 : 1500,
    }));

    return {
      id: group.id,
      hostname: group.hostname,
      shortName: group.shortName,
      interfaceCount: interfaces.length,
      interfaces,
    };
  });
}
