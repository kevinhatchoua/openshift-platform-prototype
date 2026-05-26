export type NodeCondition = {
  type: string;
  status: string;
  reason: string;
  updated: string;
  changed: string;
};

const READY_NODE_CONDITIONS: NodeCondition[] = [
  {
    type: "Ready",
    status: "True",
    reason: "KubeletReady",
    updated: "May 26, 2026, 1:10 PM",
    changed: "May 14, 2026, 9:18 AM",
  },
  {
    type: "MemoryPressure",
    status: "False",
    reason: "KubeletHasSufficientMemory",
    updated: "May 26, 2026, 1:10 PM",
    changed: "May 14, 2026, 9:18 AM",
  },
  {
    type: "DiskPressure",
    status: "False",
    reason: "KubeletHasNoDiskPressure",
    updated: "May 26, 2026, 1:10 PM",
    changed: "May 14, 2026, 9:18 AM",
  },
  {
    type: "PIDPressure",
    status: "False",
    reason: "KubeletHasSufficientPID",
    updated: "May 26, 2026, 1:10 PM",
    changed: "May 14, 2026, 9:18 AM",
  },
  {
    type: "NetworkUnavailable",
    status: "False",
    reason: "RouteCreated",
    updated: "May 26, 2026, 1:10 PM",
    changed: "May 14, 2026, 9:18 AM",
  },
];

export function getNodeConditions(_nodeName: string): NodeCondition[] {
  return READY_NODE_CONDITIONS;
}
