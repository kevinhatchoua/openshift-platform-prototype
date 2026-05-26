import type { NodeDetailRecord } from "./nodeDetailData";
import { CONSOLE_SAMPLE_NODE_NAME } from "./nodeDetailData";

export type GpuDeviceMetrics = {
  id: string;
  label: string;
  utilization: string;
  temperature: string;
  power: string;
  fbUsed: string;
  fbFree: string;
};

export type NodeGpuMetrics = {
  count: string;
  model: string;
  capacity: string;
  allocatable: string;
  devices: GpuDeviceMetrics[];
};

const GPU_METRICS: Record<string, NodeGpuMetrics> = {
  [CONSOLE_SAMPLE_NODE_NAME]: {
    count: "1",
    model: "Tesla T4",
    capacity: "1",
    allocatable: "1",
    devices: [
      {
        id: "0",
        label: "GPU 0 \u2014 Tesla T4",
        utilization: "0 %",
        temperature: "26 \u00B0C",
        power: "14.6 W",
        fbUsed: "0 MiB",
        fbFree: "14.6 GiB",
      },
    ],
  },
};

/** True when node labels indicate GPU capacity (nvidia.com/gpu or amd.com/gpu). */
export function nodeHasGpu(node: NodeDetailRecord): boolean {
  return node.labels.some(
    (label) =>
      label.includes("nvidia.com/gpu.present=true") ||
      label.startsWith("nvidia.com/gpu.") ||
      label.includes("amd.com/gpu"),
  );
}

export function getNodeGpuMetrics(nodeName: string): NodeGpuMetrics | undefined {
  return GPU_METRICS[nodeName];
}
