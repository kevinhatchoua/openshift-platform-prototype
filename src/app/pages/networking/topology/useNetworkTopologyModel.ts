import { useMemo } from "react";
import {
  EdgeStyle,
  LabelPosition,
  Model,
  NodeShape,
  type EdgeModel,
  type NodeModel,
} from "@patternfly/react-topology";
import {
  isLogicalNetworkStandalone,
  RESOURCE_KIND_LABELS,
  visibleTopologyGroupIds,
  type NetworkNodeAssignments,
  type NetResource,
  type StandaloneTopologyResource,
  type TopologyCrossEdge,
  type TopologyDataScale,
  type WorkerNodeGroup,
} from "../networkTopologyData";
import {
  LOGICAL_LANE_ID,
  WORKLOAD_LANE_ID,
  type ConnectionEdgeData,
  type LogicalLaneNodeData,
  type LogicalNetworkNodeData,
  type ResourceNodeData,
  type WorkerGroupNodeData,
  type WorkloadNodeData,
} from "./topologyNodeData";
import {
  attachmentsForNetwork,
  getPerspectiveVisibility,
  hostRoleForResource,
  resourceMatchesFilter,
  resourceVisibleInPerspective,
  type TopologyPerspective,
  type TopologyResourceFilter,
} from "./topologyPerspective";
import type { TopologyLayoutId } from "./topologyLayouts";
import { shapeForResourceNode } from "./topologyNodeShapes";
import {
  isHostResourceUnhealthy,
  isLogicalNetworkUnhealthy,
  isManagementPortResource,
  isUnhealthyWorkloadStatus,
} from "./topologyTroubleshoot";
import {
  createEmptyQueryState,
  matchesTopologyQuery,
  valuesForResource,
  valuesForStandalone,
  valuesForWorkload,
  type TopologyQueryState,
} from "./topologyQueryFilter";
import {
  edgeHasPacketDrop,
  healthForHostResource,
  healthForLogicalNetwork,
  healthForWorkload,
  healthToNodeStatus,
} from "./topologyHealth";

/** Standard PF topology circular badge diameter (matches console topology). */
const RESOURCE_SIZE = 75;
const LOGICAL_SIZE = 75;
const WORKLOAD_SIZE = 64;
const UNKNOWN_NODE_ID = "topology-unknown-endpoint";

function shapeForKind(kind: string, hostRole?: ReturnType<typeof hostRoleForResource>): NodeShape {
  return shapeForResourceNode(kind, hostRole);
}

export type UseNetworkTopologyModelArgs = {
  groups: WorkerNodeGroup[];
  standaloneResources: StandaloneTopologyResource[];
  crossEdges: TopologyCrossEdge[];
  networkNodeAssignments: NetworkNodeAssignments;
  revealedGroupIds: string[];
  searchTerm?: string;
  filterKind?: TopologyResourceFilter;
  layoutName: TopologyLayoutId;
  perspective?: TopologyPerspective;
  dataScale?: TopologyDataScale;
  hideManagementPorts?: boolean;
  pipesOnly?: boolean;
  queryState?: TopologyQueryState;
};

export function useNetworkTopologyModel({
  groups,
  standaloneResources,
  crossEdges,
  networkNodeAssignments,
  revealedGroupIds,
  searchTerm = "",
  filterKind = "all",
  layoutName,
  perspective = "node",
  dataScale = "scale",
  hideManagementPorts = false,
  pipesOnly = false,
  queryState = createEmptyQueryState(),
}: UseNetworkTopologyModelArgs): Model {
  return useMemo(() => {
    const visibleIds = visibleTopologyGroupIds(networkNodeAssignments, revealedGroupIds);
    const visibleGroups = groups.filter((group) => visibleIds.has(group.id));
    const logicalStandalones = standaloneResources.filter(isLogicalNetworkStandalone);
    const otherStandalones = standaloneResources.filter((r) => !isLogicalNetworkStandalone(r));
    const query = searchTerm.trim().toLowerCase();
    const visibility = getPerspectiveVisibility(perspective, pipesOnly);
    const { showLogicalLane, showWorkloads, showWorkers, workloadLaneLabel } = visibility;

    const isWorkloadTypeFilter = filterKind === "pod" || filterKind === "vm";

    const matchesQueryTarget = (target: Parameters<typeof matchesTopologyQuery>[0]) =>
      matchesTopologyQuery(target, queryState);

    const matchesFilter = (
      label: string,
      kind: string,
      extra?: {
        hostRole?: ReturnType<typeof hostRoleForResource>;
        attachmentKind?: string;
        resource?: NetResource;
        groupId?: string;
        logicalResource?: StandaloneTopologyResource;
        workloadStatus?: "Running" | "Pending" | "Failed";
        namespace?: string;
        owner?: string;
        ip?: string;
      },
    ) => {
      const queryTarget = extra?.resource
        ? valuesForResource(extra.resource, { namespace: extra.namespace, ip: extra.ip })
        : extra?.logicalResource
          ? valuesForStandalone(extra.logicalResource)
          : {
              name: label,
              kind,
              namespace: extra?.namespace,
              owner: extra?.owner,
              ip: extra?.ip,
              endpoint: extra?.namespace ?? label,
              source: extra?.namespace ?? label,
              destination: label,
            };

      if (!matchesQueryTarget(queryTarget)) return false;
      if (filterKind === "unhealthy") {
        if (extra?.workloadStatus && isUnhealthyWorkloadStatus(extra.workloadStatus)) return !query || label.toLowerCase().includes(query);
        if (extra?.logicalResource && isLogicalNetworkUnhealthy(extra.logicalResource)) {
          return !query || label.toLowerCase().includes(query);
        }
        if (extra?.resource && extra.groupId && isHostResourceUnhealthy(extra.resource, extra.groupId)) {
          return !query || label.toLowerCase().includes(query) || kind.toLowerCase().includes(query);
        }
        return false;
      }
      if (
        !resourceMatchesFilter(filterKind, perspective, {
          kind,
          hostRole: extra?.hostRole,
          attachmentKind: extra?.attachmentKind,
        })
      ) {
        return false;
      }
      if (!query) return true;
      return label.toLowerCase().includes(query) || kind.toLowerCase().includes(query);
    };

    const nodes: NodeModel[] = [];
    const edges: EdgeModel[] = [];
    const labelById = new Map<string, string>();

    if (showLogicalLane && logicalStandalones.length > 0) {
      const logicalChildren: string[] = [];
      logicalStandalones.forEach((resource) => {
        if (!resourceVisibleInPerspective(resource, perspective)) return;
        if (isWorkloadTypeFilter) {
          const hasMatch = attachmentsForNetwork(resource.label, resource.id, dataScale).some((a) => a.kind === filterKind);
          if (!hasMatch) return;
          if (query && !resource.label.toLowerCase().includes(query)) return;
        } else if (filterKind === "unhealthy") {
          const hasUnhealthyWorkload = attachmentsForNetwork(resource.label, resource.id, dataScale).some((a) =>
            isUnhealthyWorkloadStatus(a.status)
          );
          if (!isLogicalNetworkUnhealthy(resource) && !hasUnhealthyWorkload) return;
          if (query && !resource.label.toLowerCase().includes(query)) return;
        } else if (
          !matchesFilter(resource.label, resource.kind, {
            hostRole: hostRoleForResource(resource),
            logicalResource: resource,
          })
        ) {
          return;
        }
        logicalChildren.push(resource.id);
        labelById.set(resource.id, resource.label);
        const data: LogicalNetworkNodeData = {
          nodeKind: "logical-network",
          resource,
          kind: resource.kind,
          status: resource.status,
          topologyMode: resource.topologyMode,
          detailPath: resource.detailPath,
        };
        nodes.push({
          id: resource.id,
          type: "logical-network",
          label: resource.label,
          width: LOGICAL_SIZE,
          height: LOGICAL_SIZE,
          shape: shapeForKind(resource.kind, hostRoleForResource(resource)),
          status: healthToNodeStatus(healthForLogicalNetwork(resource)),
          data,
        });
      });

      if (logicalChildren.length > 0) {
        const laneData: LogicalLaneNodeData = { nodeKind: "logical-lane" };
        nodes.push({
          id: LOGICAL_LANE_ID,
          type: "logical-lane",
          group: true,
          children: logicalChildren,
          label: perspective === "namespace" || perspective === "owner" ? "Networks" : "Logical networks",
          labelPosition: LabelPosition.top,
          style: { padding: 28 },
          data: laneData,
        });
      }
    }

    if (perspective !== "node") {
      otherStandalones.forEach((resource) => {
        if (!resourceVisibleInPerspective(resource, perspective)) return;
        if (isWorkloadTypeFilter) return;
        if (
          !matchesFilter(resource.label, resource.kind, {
            hostRole: hostRoleForResource(resource),
            logicalResource: resource,
          })
        )
          return;
        labelById.set(resource.id, resource.label);
        const data: LogicalNetworkNodeData = {
          nodeKind: "logical-network",
          resource,
          kind: resource.kind,
          status: resource.status,
          topologyMode: resource.topologyMode,
          detailPath: resource.detailPath,
        };
        nodes.push({
          id: resource.id,
          type: "logical-network",
          label: resource.label,
          width: RESOURCE_SIZE,
          height: RESOURCE_SIZE,
          shape: shapeForKind(resource.kind, hostRoleForResource(resource)),
          status: healthToNodeStatus(healthForLogicalNetwork(resource)),
          data,
        });
      });
    }

    if (showWorkers) {
      visibleGroups.forEach((group) => {
        const childIds: string[] = [];
        group.resources.forEach((resource) => {
          if (!resourceVisibleInPerspective(resource, perspective)) return;
          if (hideManagementPorts && isManagementPortResource(resource)) return;
          if (isWorkloadTypeFilter) return;
          if (
            !matchesFilter(resource.label, resource.kind, {
              hostRole: hostRoleForResource(resource),
              resource,
              groupId: group.id,
            })
          )
            return;
          childIds.push(resource.id);
          labelById.set(resource.id, resource.label);
          const data: ResourceNodeData = {
            nodeKind: "resource",
            resource,
            groupId: group.id,
            groupShortName: group.shortName,
            groupHostname: group.hostname,
            kind: resource.kind,
            status: resource.status,
            hostRole: hostRoleForResource(resource),
          };
          nodes.push({
            id: resource.id,
            type: "resource",
            label: resource.label,
            width: RESOURCE_SIZE,
            height: RESOURCE_SIZE,
            shape: shapeForKind(resource.kind, hostRoleForResource(resource)),
            status: healthToNodeStatus(healthForHostResource(resource, group.id, dataScale)),
            data,
          });
        });

        if (childIds.length === 0) return;

        const groupData: WorkerGroupNodeData = {
          nodeKind: "worker-group",
          group,
        };
        nodes.push({
          id: group.id,
          type: "worker-group",
          group: true,
          children: childIds,
          label: group.shortName,
          labelPosition: LabelPosition.top,
          style: { padding: 32 },
          data: groupData,
        });

        group.edges.forEach((edge) => {
          if (!childIds.includes(edge.from) || !childIds.includes(edge.to)) return;
          const sourceLabel = labelById.get(edge.from) ?? edge.from;
          const targetLabel = labelById.get(edge.to) ?? edge.to;
          const edgeData: ConnectionEdgeData = {
            edgeKind: "connection",
            linkType: "underlay",
            sourceLabel,
            targetLabel,
            note: "Host underlay link (NNCP / nmstate)",
            packetDrop: edgeHasPacketDrop(sourceLabel, targetLabel),
          };
          edges.push({
            id: edge.id,
            type: "edge",
            source: edge.from,
            target: edge.to,
            edgeStyle: edgeData.packetDrop ? EdgeStyle.dashedMd : EdgeStyle.default,
            data: edgeData,
          });
        });
      });
    }

    if (showLogicalLane) {
      crossEdges.forEach((edge) => {
        const sourceExists = nodes.some((n) => n.id === edge.fromStandaloneId);
        const targetExists = nodes.some((n) => n.id === edge.toResourceId);
        if (!sourceExists || !targetExists) return;
        const edgeData: ConnectionEdgeData = {
          edgeKind: "connection",
          linkType: "logical-attachment",
          sourceLabel: labelById.get(edge.fromStandaloneId) ?? edge.fromStandaloneId,
          targetLabel: labelById.get(edge.toResourceId) ?? edge.toResourceId,
          bridgeMapping: `${edge.toGroupId} → ${edge.toResourceId}`,
          note: "Logical network attached to worker bridge",
        };
        edges.push({
          id: edge.id,
          type: "cross-edge",
          source: edge.fromStandaloneId,
          target: edge.toResourceId,
          edgeStyle: EdgeStyle.dashed,
          data: edgeData,
        });
      });
    }

    if (showWorkloads) {
      const workloadChildren: string[] = [];
      const networkNodes = nodes.filter((n) => n.type === "logical-network");
      const bridgeFallback = nodes.filter((n) => {
        const data = n.data as ResourceNodeData | undefined;
        return data?.nodeKind === "resource" && data.hostRole.includes("bridge");
      });

      const attachTargets =
        networkNodes.length > 0
          ? networkNodes
          : bridgeFallback.slice(0, 3);

      attachTargets.forEach((networkNode) => {
        const attachments = attachmentsForNetwork(networkNode.label ?? networkNode.id, networkNode.id, dataScale);
        attachments.forEach((attachment) => {
          if (filterKind === "unhealthy") {
            if (!isUnhealthyWorkloadStatus(attachment.status)) return;
          } else if (filterKind === "pod" || filterKind === "vm") {
            if (attachment.kind !== filterKind) return;
          }
          if (!matchesQueryTarget(valuesForWorkload(attachment))) return;
          if (
            query &&
            !attachment.label.toLowerCase().includes(query) &&
            !attachment.namespace.toLowerCase().includes(query) &&
            !attachment.owner.toLowerCase().includes(query)
          ) {
            return;
          }
          const nodeId = `${attachment.id}__${networkNode.id}`;
          if (nodes.some((n) => n.id === nodeId)) return;
          workloadChildren.push(nodeId);
          const workloadLabel =
            perspective === "owner"
              ? attachment.owner
              : perspective === "namespace"
                ? attachment.namespace
                : attachment.label;
          const data: WorkloadNodeData = {
            nodeKind: "workload",
            attachment: { ...attachment, networkId: networkNode.id, networkLabel: networkNode.label ?? networkNode.id },
          };
          nodes.push({
            id: nodeId,
            type: "workload",
            label: workloadLabel,
            width: WORKLOAD_SIZE,
            height: WORKLOAD_SIZE,
            shape: NodeShape.circle,
            status: healthToNodeStatus(healthForWorkload(attachment)),
            data,
          });
          const edgeData: ConnectionEdgeData = {
            edgeKind: "connection",
            linkType: "workload-attachment",
            sourceLabel: attachment.label,
            targetLabel: networkNode.label ?? networkNode.id,
            sourceKind: attachment.kind,
            targetKind: "network",
            note: `${attachment.kind === "vm" ? "VirtualMachine" : "Pod"} attached to network`,
            packetDrop: edgeHasPacketDrop(attachment.namespace, networkNode.label ?? networkNode.id),
          };
          edges.push({
            id: `wl__${nodeId}`,
            type: "edge",
            source: nodeId,
            target: networkNode.id,
            edgeStyle: edgeData.packetDrop ? EdgeStyle.dashedMd : EdgeStyle.default,
            data: edgeData,
          });
        });
      });

      if (workloadChildren.length > 0) {
        nodes.push({
          id: WORKLOAD_LANE_ID,
          type: "logical-lane",
          group: true,
          children: workloadChildren,
          label: workloadLaneLabel,
          labelPosition: LabelPosition.top,
          style: { padding: 28 },
          data: { nodeKind: "logical-lane" },
        });
      }
    }

    if (
      (perspective === "namespace" || perspective === "network" || perspective === "owner") &&
      !nodes.some((node) => node.id === UNKNOWN_NODE_ID)
    ) {
      const unknownResource: StandaloneTopologyResource = {
        id: UNKNOWN_NODE_ID,
        label: "Unknown",
        kind: "bridge",
        x: 0,
        y: 0,
        status: "pending",
        detail: "Unmapped endpoint",
        highlightSteps: [],
        canvasX: 0,
        canvasY: 0,
        targetNodeId: "",
        targetNodeLabel: "",
        detailPath: "#",
        topologyMode: "localnet",
      };
      nodes.push({
        id: UNKNOWN_NODE_ID,
        type: "logical-network",
        label: "Unknown",
        width: RESOURCE_SIZE,
        height: RESOURCE_SIZE,
        shape: NodeShape.rect,
        status: healthToNodeStatus("unknown"),
        data: {
          nodeKind: "logical-network",
          resource: unknownResource,
          kind: "bridge",
          status: "pending",
          topologyMode: "localnet",
          detailPath: "#",
        },
      });
      const anchor = nodes.find((node) => node.type === "logical-network" && node.id !== UNKNOWN_NODE_ID);
      if (anchor) {
        edges.push({
          id: "unknown-edge",
          type: "cross-edge",
          source: UNKNOWN_NODE_ID,
          target: anchor.id,
          edgeStyle: EdgeStyle.dashedMd,
          data: {
            edgeKind: "connection",
            linkType: "logical-attachment",
            sourceLabel: "Unknown",
            targetLabel: anchor.label ?? anchor.id,
            note: "Unmapped traffic endpoint",
            packetDrop: true,
          },
        });
      }
    }

    return {
      nodes,
      edges,
      graph: {
        id: "network-topology-graph",
        type: "graph",
        layout: layoutName,
      },
    };
  }, [
    groups,
    standaloneResources,
    crossEdges,
    networkNodeAssignments,
    revealedGroupIds,
    searchTerm,
    filterKind,
    layoutName,
    perspective,
    dataScale,
    hideManagementPorts,
    pipesOnly,
    queryState,
  ]);
}

export function kindLabel(kind: string): string {
  return RESOURCE_KIND_LABELS[kind as keyof typeof RESOURCE_KIND_LABELS] ?? kind;
}
