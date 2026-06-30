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
