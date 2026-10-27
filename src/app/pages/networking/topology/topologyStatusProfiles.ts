import type { ResourceInstallStatus } from "../networkTopologyData";

export type TopologyStatusProfile = "available" | "pending" | "critical";

export type TopologyStatusColors = {
  background: string;
  border: string;
  edge: string;
};

export type EdgeHealth = "healthy" | "degraded" | "failed";

export type FaultDomain = "none" | "nad" | "vm" | "storage";

function hashSeed(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Deterministic mock utilization for prototype capacity evidence (≈8% at 100%). */
export function mockCapacityPercent(resourceId: string): number {
  const seed = hashSeed(resourceId);
  if (seed % 12 === 0) return 100;
  return 20 + (seed % 75);
}

export function faultDomainFromKindAndStatus(kind: string, status?: string): FaultDomain {
  if (statusProfileFromLabel(status) !== "critical") return "none";
  if (kind === "nad" || kind === "udn") return "nad";
  if (kind === "vm") return "vm";
  if (kind === "pvc" || kind === "storageclass") return "storage";
  return "none";
}

export function nodeDiagnosticFields(
  id: string,
  kind: string,
  status?: string
): { capacityPercent: string; atCapacity: string; faultDomain: FaultDomain } {
  const capacityPercent = mockCapacityPercent(id);
  return {
    capacityPercent: String(capacityPercent),
    atCapacity: capacityPercent >= 100 ? "true" : "false",
    faultDomain: faultDomainFromKindAndStatus(kind, status),
  };
}

const STATUS_PROFILE_COLORS: Record<TopologyStatusProfile, TopologyStatusColors> = {
  available: { background: "#14532d", border: "#22c55e", edge: "#34d399" },
  pending: { background: "#78350f", border: "#f97316", edge: "#fb923c" },
  critical: { background: "#7f1d1d", border: "#ef4444", edge: "#f87171" },
};

const EDGE_HEALTH_COLORS: Record<EdgeHealth, string> = {
  healthy: "#34d399",
  degraded: "#fb923c",
  failed: "#f87171",
};

export function statusProfileFromInstallStatus(status: ResourceInstallStatus): TopologyStatusProfile {
  if (status === "configured") return "available";
  if (status === "failed") return "critical";
  return "pending";
}

export function statusProfileFromLabel(status?: string): TopologyStatusProfile {
  if (!status) return "available";
  const normalized = status.toLowerCase();
  if (normalized.includes("fail") || normalized.includes("error") || normalized.includes("critical")) {
    return "critical";
  }
  if (
    normalized.includes("pend") ||
    normalized.includes("creat") ||
    normalized.includes("install") ||
    normalized.includes("progress")
  ) {
    return "pending";
  }
  return "available";
}

export function cytoscapeStatusColors(profile: TopologyStatusProfile): TopologyStatusColors {
  return STATUS_PROFILE_COLORS[profile];
}

export function edgeColorForHealth(health: EdgeHealth): string {
  return EDGE_HEALTH_COLORS[health];
}

export function edgeHealthFromStatuses(
  sourceStatus?: string,
  targetStatus?: string,
  edgeKind?: string
): EdgeHealth {
  if (edgeKind === "validation-failed") return "failed";
  const profiles = [sourceStatus, targetStatus].map(statusProfileFromLabel);
  if (profiles.some((profile) => profile === "critical")) return "failed";
  if (profiles.some((profile) => profile === "pending")) return "degraded";
  return "healthy";
}
