import type { ElementDefinition } from "cytoscape";
import type { StandaloneTopologyResource, TopologyCrossEdge, WorkerNodeGroup } from "../networkTopologyData";
import {
  nodeDiagnosticFields,
  statusProfileFromInstallStatus,
} from "../topology/topologyStatusProfiles";
import { getTopologyDeveloperMode } from "../topology/topologyDeveloperMode";

export function buildNetworkTopologyCytoscapeElements(
  groups: WorkerNodeGroup[],
  standalones: StandaloneTopologyResource[],
  crossEdges: TopologyCrossEdge[]
): ElementDefinition[] {
  const elements: ElementDefinition[] = [];
  const devMode = getTopologyDeveloperMode();

  const pushNode = (
    id: string,
    label: string,
    kind: string,
    extra: Record<string, string | undefined> = {},
    parent?: string
  ) => {
    elements.push({
      data: {
        id,
        label,
        kind,
        ...nodeDiagnosticFields(id, kind, extra.status),
        ...extra,
        ...(parent ? { parent } : {}),
      },
    });
  };

  const pushEdge = (
    id: string,
    source: string,
    target: string,
    kind: string,
    health: string
  ) => {
    elements.push({ data: { id, source, target, kind, edgeHealth: health } });
  };

  groups.forEach((group) => {
    const groupId = `group:${group.id}`;
    pushNode(groupId, group.shortName, "node", { hostname: group.hostname, status: "Ready" });
    group.resources.forEach((resource) => {
      const profile = statusProfileFromInstallStatus(resource.status);
      pushNode(
        resource.id,
        resource.label,
        resource.kind,
        { status: resource.status, statusProfile: profile, detail: resource.detail },
        groupId
      );
    });
    group.edges.forEach((edge) => {
      const from = group.resources.find((entry) => entry.id === edge.from);
      const to = group.resources.find((entry) => entry.id === edge.to);
      const health =
        from?.status === "failed" || to?.status === "failed"
          ? "failed"
          : from?.status === "configured" && to?.status === "configured"
            ? "healthy"
            : "degraded";
      pushEdge(`intra:${edge.id}`, edge.from, edge.to, "intra", health);
    });
  });

  standalones.forEach((resource) => {
    const profile = statusProfileFromInstallStatus(resource.status);
    pushNode(`standalone:${resource.id}`, resource.label, resource.kind, {
      status: resource.status,
      statusProfile: profile,
      detail: resource.detail,
    });
  });

  crossEdges.forEach((edge) => {
    const standalone = standalones.find((entry) => entry.id === edge.fromStandaloneId);
    const group = groups.find((entry) => entry.id === edge.toGroupId);
    const target = group?.resources.find((entry) => entry.id === edge.toResourceId);
    const health =
      standalone?.status === "failed" || target?.status === "failed"
        ? "failed"
        : standalone?.status === "configured" && target?.status === "configured"
          ? "healthy"
          : "degraded";
    pushEdge(
      `cross:${edge.id}`,
      `standalone:${edge.fromStandaloneId}`,
      edge.toResourceId,
      standalone?.logicalNetwork ? "logical-network" : "cross",
      health
    );
  });

  if (devMode.enabled) {
    appendScaleMockClusters(elements, devMode.scaleTarget, pushNode, pushEdge, groups);
  }

  return elements;
}

function appendScaleMockClusters(
  elements: ElementDefinition[],
  scaleTarget: number,
  pushNode: (
    id: string,
    label: string,
    kind: string,
    extra?: Record<string, string | undefined>,
    parent?: string
  ) => void,
  pushEdge: (id: string, source: string, target: string, kind: string, health: string) => void,
  groups: WorkerNodeGroup[]
) {
  const clusterCount = Math.max(4, Math.ceil(scaleTarget / 250));
  const nadPerCluster = Math.ceil(scaleTarget / clusterCount);
  const anchorGroup = groups[0]?.id ?? "worker-a";

  for (let clusterIndex = 0; clusterIndex < clusterCount; clusterIndex += 1) {
    const clusterId = `cluster:nad-ns-${clusterIndex}`;
    const failedCount = clusterIndex % 7 === 0 ? Math.ceil(nadPerCluster * 0.08) : 0;
    const pendingCount = clusterIndex % 5 === 0 ? Math.ceil(nadPerCluster * 0.12) : 0;
    const availableCount = nadPerCluster - failedCount - pendingCount;

    pushNode(clusterId, `NAD cluster (${nadPerCluster})`, "cluster", {
      status: failedCount > 0 ? "failed" : pendingCount > 0 ? "creating" : "configured",
      statusProfile: failedCount > 0 ? "critical" : pendingCount > 0 ? "pending" : "available",
      detail: `${availableCount} available · ${pendingCount} pending · ${failedCount} failed`,
      collapsed: "true",
    });

    for (let nadIndex = 0; nadIndex < Math.min(nadPerCluster, 24); nadIndex += 1) {
      const nadId = `${clusterId}:nad-${nadIndex}`;
      let status = "configured";
      let profile = "available";
      if (nadIndex < failedCount) {
        status = "failed";
        profile = "critical";
      } else if (nadIndex < failedCount + pendingCount) {
        status = "creating";
        profile = "pending";
      }
      pushNode(
        nadId,
        `nad-${clusterIndex}-${nadIndex}`,
        "nad",
        { status, statusProfile: profile, namespace: `tenant-${clusterIndex}` },
        clusterId
      );
      pushEdge(
        `scale:${nadId}->${anchorGroup}`,
        nadId,
        `group:${anchorGroup}`,
        nadIndex % 11 === 0 ? "validation-failed" : "network",
        profile === "critical" ? "failed" : profile === "pending" ? "degraded" : "healthy"
      );
    }
  }
}

export function countTopologyResources(groups: WorkerNodeGroup[], standalones: StandaloneTopologyResource[]) {
  const groupResources = groups.reduce((total, group) => total + group.resources.length, 0);
  return groupResources + standalones.length;
}
