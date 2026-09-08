import type { NetResource } from "../networkTopologyData";
import type { StandaloneTopologyResource } from "../networkTopologyData";
import { NodeStatus } from "@patternfly/react-topology";
import type { WorkloadAttachment } from "./topologyPerspective";
import {
  bondHealthIsUnhealthy,
  hasInterfaceMtuMismatch,
  isHostResourceUnhealthy,
  isLogicalNetworkUnhealthy,
  isUnhealthyInstallStatus,
  isUnhealthyWorkloadStatus,
} from "./topologyTroubleshoot";
import { hostRoleForResource } from "./topologyPerspective";
import type { TopologyDataScale } from "../networkTopologyData";

export type TopologyHealthState = "healthy" | "warning" | "error" | "unknown";

const WARNING_NAMESPACES = new Set(["openshift-dns", "openshift-monitoring"]);
const ERROR_NAMESPACES = new Set(["packet-drop-test"]);
const ERROR_RESOURCE_LABELS = new Set(["br-ex", "ovs-vm", "ovs-bridge-vm"]);
const WARNING_RESOURCE_LABELS = new Set(["bond0", "bond0.100"]);

export function healthForNamespace(namespace: string): TopologyHealthState {
  if (ERROR_NAMESPACES.has(namespace)) return "error";
  if (WARNING_NAMESPACES.has(namespace)) return "warning";
  return "healthy";
}

export function healthForResourceLabel(label: string): TopologyHealthState {
  const normalized = label.toLowerCase();
  if (normalized === "unknown") return "unknown";
  if (ERROR_RESOURCE_LABELS.has(normalized)) return "error";
  if (WARNING_RESOURCE_LABELS.has(normalized)) return "warning";
  return "healthy";
}

export function healthForHostResource(
  resource: Pick<NetResource, "id" | "label" | "status" | "kind" | "detail">,
  groupId: string,
  dataScale: TopologyDataScale = "compact"
): TopologyHealthState {
  const labelHealth = healthForResourceLabel(resource.label);
  if (labelHealth !== "healthy") return labelHealth;
  if (isUnhealthyInstallStatus(resource.status)) return "error";
  const role = hostRoleForResource(resource);
  if (role === "bond" && bondHealthIsUnhealthy(groupId, resource.label)) return "warning";
  if (hasInterfaceMtuMismatch(resource.id, resource.label, resource.kind, [], dataScale)) return "warning";
  if (isHostResourceUnhealthy(resource, groupId)) return "warning";
  return "healthy";
}

export function healthForLogicalNetwork(resource: StandaloneTopologyResource): TopologyHealthState {
  const labelHealth = healthForResourceLabel(resource.label);
  if (labelHealth !== "healthy") return labelHealth;
  if (isLogicalNetworkUnhealthy(resource)) return "error";
  return "healthy";
}

export function healthForWorkload(attachment: WorkloadAttachment): TopologyHealthState {
  const nsHealth = healthForNamespace(attachment.namespace);
  if (nsHealth !== "healthy") return nsHealth;
  if (attachment.status === "Failed") return "error";
  if (isUnhealthyWorkloadStatus(attachment.status)) return "warning";
  return "healthy";
}

export function healthToNodeStatus(health: TopologyHealthState): NodeStatus {
  switch (health) {
    case "error":
      return NodeStatus.danger;
    case "warning":
      return NodeStatus.warning;
    case "unknown":
      return NodeStatus.default;
    case "healthy":
    default:
      return NodeStatus.success;
  }
}

export function healthClassName(health: TopologyHealthState): string {
  switch (health) {
    case "error":
      return "ocs-pf-topo-health--error";
    case "warning":
      return "ocs-pf-topo-health--warning";
    case "unknown":
      return "ocs-pf-topo-health--unknown";
    default:
      return "ocs-pf-topo-health--healthy";
  }
}

export function edgeHasPacketDrop(sourceLabel: string, targetLabel: string): boolean {
  const labels = [sourceLabel.toLowerCase(), targetLabel.toLowerCase()];
  return labels.some((label) => ERROR_RESOURCE_LABELS.has(label) || label.includes("packet-drop"));
}
