import type { StandaloneTopologyResource } from "../networkTopologyData";

/**
 * Phase 1: Resources tab shows discovered worker attachment only (HPUX-2196 / eng alignment Nov 2025).
 * Set to false when prototyping in-topology assignment again.
 */
export const PHASE1_TOPOLOGY_WORKER_MAPPING_READ_ONLY = true;

/** Host bridge mapping applies to localnet and host-tied NAD paths, not OVN UDN/CUDN. */
export function supportsTopologyHostBridgeMapping(resource: StandaloneTopologyResource): boolean {
  return resource.kind !== "udn" && resource.kind !== "cudn";
}

export function topologyWorkerMappingMutationsAllowed(nmstateBlocked: boolean): boolean {
  if (PHASE1_TOPOLOGY_WORKER_MAPPING_READ_ONLY) return false;
  if (nmstateBlocked) return false;
  return true;
}

export function expectedBridgeSummaryForResource(resource: StandaloneTopologyResource): string {
  if (resource.kind === "udn" || resource.kind === "cudn") {
    return "OVN integration (br-int) — infrastructure-managed";
  }
  return "Discovered host bridge / ovn-bridge-mapping";
}