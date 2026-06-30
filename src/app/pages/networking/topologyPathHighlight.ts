import {
  isBridgeNetworkResource,
  isLogicalNetworkStandalone,
  type NetworkNodeAssignments,
  type StandaloneTopologyResource,
  type TopologyCrossEdge,
  type TopologyEdge,
  type WorkerNodeGroup,
} from "./networkTopologyData";
import {
  getAttachedVmsForNetwork,
  type NetworkResourceRef,
} from "./networkingMockData";
import { underlayNicResourceSuffix, getPhysicalUnderlayForBridge } from "./nodeNetworkStateMockData";

export type TopologyPathHighlight = {
  resourceIds: Set<string>;
  groupIds: Set<string>;
  edgeKeys: Set<string>;
  crossEdgeIds: Set<string>;
  workloadKeys: Set<string>;
};

const EMPTY: TopologyPathHighlight = {
  resourceIds: new Set(),
  groupIds: new Set(),
  edgeKeys: new Set(),
  crossEdgeIds: new Set(),
  workloadKeys: new Set(),
};

function edgeKey(from: string, to: string) {
  return `${from}__${to}`;
}

function mergeInto(target: TopologyPathHighlight, source: TopologyPathHighlight) {
  source.resourceIds.forEach((id) => target.resourceIds.add(id));
  source.groupIds.forEach((id) => target.groupIds.add(id));
  source.edgeKeys.forEach((id) => target.edgeKeys.add(id));
  source.crossEdgeIds.forEach((id) => target.crossEdgeIds.add(id));
  source.workloadKeys.forEach((id) => target.workloadKeys.add(id));
}

function workloadKey(namespace: string, name: string) {
  return `vm:${namespace}/${name}`;
}

function logicalRefFromStandalone(
  standalone: StandaloneTopologyResource
): NetworkResourceRef | null {
  if (standalone.kind === "cudn") return { kind: "CUDN", name: standalone.label };
  if (standalone.kind === "udn") {
    const namespace =
      standalone.targetNodeLabel !== "Cluster-scoped" ? standalone.targetNodeLabel : undefined;
    return { kind: "UDN", name: standalone.label, namespace };
  }
  return null;
}

function addWorkloadsForNetwork(ref: NetworkResourceRef, highlight: TopologyPathHighlight) {
  getAttachedVmsForNetwork(ref).forEach((row) => {
    highlight.workloadKeys.add(workloadKey(row.vmNamespace, row.vmName));
  });
}

function traceUnderlayAncestors(
  group: WorkerNodeGroup,
  bridgeResourceId: string,
  edges: TopologyEdge[],
  highlight: TopologyPathHighlight
) {
  const chain = getPhysicalUnderlayForBridge(bridgeResourceId);
  const nicSuffix = chain ? underlayNicResourceSuffix(chain) : null;
  if (nicSuffix) {
    const nic = group.resources.find((resource) => resource.id.endsWith(nicSuffix));
    if (nic) highlight.resourceIds.add(nic.id);
  }

  const queue = [bridgeResourceId];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    highlight.resourceIds.add(current);
    edges.forEach((edge) => {
      if (edge.to !== current) return;
      highlight.edgeKeys.add(edgeKey(edge.from, edge.to));
      queue.push(edge.from);
    });
  }
}

function walkFromResource(resourceId: string, input: PathHighlightInput): TopologyPathHighlight {
  const highlight: TopologyPathHighlight = {
    resourceIds: new Set(),
    groupIds: new Set(),
    edgeKeys: new Set(),
    crossEdgeIds: new Set(),
    workloadKeys: new Set(),
  };

  const standalone = input.standaloneResources.find((resource) => resource.id === resourceId);
  if (standalone) {
    highlight.resourceIds.add(resourceId);

    if (isLogicalNetworkStandalone(standalone)) {
      (input.networkNodeAssignments[resourceId] ?? []).forEach((workerId) => {
        highlight.groupIds.add(workerId);
      });

      input.crossEdges
        .filter((edge) => edge.fromStandaloneId === resourceId)
        .forEach((edge) => {
          highlight.crossEdgeIds.add(edge.id);
          highlight.resourceIds.add(edge.toResourceId);
          highlight.groupIds.add(edge.toGroupId);

          const group = input.groups.find((entry) => entry.id === edge.toGroupId);
          if (group) {
            traceUnderlayAncestors(
              group,
              edge.toResourceId,
              input.edgesByGroup[group.id] ?? [],
              highlight
            );
          }
        });

      const ref = logicalRefFromStandalone(standalone);
      if (ref) addWorkloadsForNetwork(ref, highlight);
    }

    if (resourceId === "nncp-br-localnet" || resourceId.startsWith("nncp-")) {
      input.groups.forEach((group) => {
        group.resources
          .filter((resource) => isBridgeNetworkResource(resource))
          .forEach((bridge) => {
            highlight.resourceIds.add(bridge.id);
            highlight.groupIds.add(group.id);
            traceUnderlayAncestors(group, bridge.id, input.edgesByGroup[group.id] ?? [], highlight);
          });
      });
    }

    return highlight;
  }

  for (const group of input.groups) {
    const resource = group.resources.find((entry) => entry.id === resourceId);
    if (!resource) continue;

    highlight.groupIds.add(group.id);
    highlight.resourceIds.add(resourceId);

    const edges = input.edgesByGroup[group.id] ?? [];
    edges.forEach((edge) => {
      if (edge.from !== resourceId && edge.to !== resourceId) return;
      highlight.edgeKeys.add(edgeKey(edge.from, edge.to));
      highlight.resourceIds.add(edge.from);
      highlight.resourceIds.add(edge.to);
    });

    if (resource.kind === "bridge") {
      traceUnderlayAncestors(group, resource.id, edges, highlight);

      input.crossEdges
        .filter((edge) => edge.toGroupId === group.id && edge.toResourceId === resource.id)
        .forEach((edge) => {
          highlight.crossEdgeIds.add(edge.id);
          highlight.resourceIds.add(edge.fromStandaloneId);
          const logical = input.standaloneResources.find(
            (entry) => entry.id === edge.fromStandaloneId
          );
          if (logical) {
            const ref = logicalRefFromStandalone(logical);
            if (ref) addWorkloadsForNetwork(ref, highlight);
          }
        });
    }

    if (isBridgeNetworkResource(resource)) {
      highlight.resourceIds.add("nncp-br-localnet");
    }
  }

  return highlight;
}

function walkFromWorkerGroup(groupId: string, input: PathHighlightInput): TopologyPathHighlight {
  const highlight: TopologyPathHighlight = {
    resourceIds: new Set(),
    groupIds: new Set([groupId]),
    edgeKeys: new Set(),
    crossEdgeIds: new Set(),
    workloadKeys: new Set(),
  };

  const group = input.groups.find((entry) => entry.id === groupId);
  if (!group) return highlight;

  const edges = input.edgesByGroup[groupId] ?? [];
  group.resources.forEach((resource) => highlight.resourceIds.add(resource.id));
  edges.forEach((edge) => highlight.edgeKeys.add(edgeKey(edge.from, edge.to)));

  input.crossEdges
    .filter((edge) => edge.toGroupId === groupId)
    .forEach((edge) => {
      highlight.crossEdgeIds.add(edge.id);
      highlight.resourceIds.add(edge.fromStandaloneId);
      const logical = input.standaloneResources.find((entry) => entry.id === edge.fromStandaloneId);
      if (logical) {
        const ref = logicalRefFromStandalone(logical);
        if (ref) addWorkloadsForNetwork(ref, highlight);
      }
    });

  return highlight;
}

export type PathHighlightInput = {
  anchorResourceId: string | null;
  anchorGroupId: string | null;
  hoverResourceId?: string | null;
  groups: WorkerNodeGroup[];
  standaloneResources: StandaloneTopologyResource[];
  crossEdges: TopologyCrossEdge[];
  edgesByGroup: Record<string, TopologyEdge[]>;
  networkNodeAssignments: NetworkNodeAssignments;
};

export function resolveTopologyPathHighlight(input: PathHighlightInput): TopologyPathHighlight {
  if (!input.anchorResourceId && !input.anchorGroupId && !input.hoverResourceId) {
    return EMPTY;
  }

  const merged: TopologyPathHighlight = {
    resourceIds: new Set(),
    groupIds: new Set(),
    edgeKeys: new Set(),
    crossEdgeIds: new Set(),
    workloadKeys: new Set(),
  };

  if (input.anchorGroupId && !input.anchorResourceId) {
    mergeInto(merged, walkFromWorkerGroup(input.anchorGroupId, input));
  }

  if (input.anchorResourceId) {
    mergeInto(merged, walkFromResource(input.anchorResourceId, input));
  }

  if (input.hoverResourceId && input.hoverResourceId !== input.anchorResourceId) {
    mergeInto(merged, walkFromResource(input.hoverResourceId, input));
  }

  return merged;
}

export function isResourceOnPath(highlight: TopologyPathHighlight, resourceId: string): boolean {
  return highlight.resourceIds.has(resourceId);
}

export function isGroupOnPath(highlight: TopologyPathHighlight, groupId: string): boolean {
  return highlight.groupIds.has(groupId);
}

export function isInternalEdgeOnPath(
  highlight: TopologyPathHighlight,
  fromId: string,
  toId: string
): boolean {
  return highlight.edgeKeys.has(edgeKey(fromId, toId));
}

export function isCrossEdgeOnPath(highlight: TopologyPathHighlight, edgeId: string): boolean {
  return highlight.crossEdgeIds.has(edgeId);
}

export function hasActivePath(highlight: TopologyPathHighlight): boolean {
  return highlight.resourceIds.size > 0 || highlight.groupIds.size > 0;
}
