/** Prototype node detail fixtures (console Node details layout). */

export type NodeDetailRecord = {
  name: string;
  status: "Ready" | "NotReady";
  externalId: string;
  uptime: string;
  addresses: {
    hostname: string;
    internalDns: string;
    internalIp: string;
  };
  labels: string[];
  operatingSystem: string;
  osImage: string;
  architecture: string;
  kernelVersion: string;
  bootId: string;
  containerRuntime: string;
  kubeletVersion: string;
  kubeProxyVersion: string;
};

export const CONSOLE_SAMPLE_NODE_NAME = "ip-10-0-24-42.us-east-2.compute.internal";

const CONSOLE_SAMPLE_NODE: NodeDetailRecord = {
  name: CONSOLE_SAMPLE_NODE_NAME,
  status: "Ready",
  externalId: "—",
  uptime: "May 14, 2026, 9:18 AM",
  addresses: {
    hostname: "ip-10-0-24-42.us-east-2.compute.internal",
    internalDns: "ip-10-0-24-42.us-east-2.compute.internal",
    internalIp: "10.0.24.42",
  },
  labels: [
    "feature.node.kubernetes.io/kernel-version.full=5.14.0-570.94.1.el9_6.x86_64",
    "feature.node.kubernetes.io/kernel-version.major=5",
    "feature.node.kubernetes.io/kernel-version.minor=14",
    "nvidia.com/cuda.runtime.major=12",
    "nvidia.com/cuda.runtime.minor=0",
    "nvidia.com/cuda.runtime.version=12.0",
    "nvidia.com/gfd.timestamp=1776182019",
    "nvidia.com/gpu-driver-upgrade-state=upgrade-done",
    "nvidia.com/gpu.compute.major=8",
    "nvidia.com/gpu.compute.minor=6",
    "nvidia.com/gpu.count=1",
    "nvidia.com/gpu.deploy.container-toolkit=true",
    "nvidia.com/gpu.deploy.dcgm=true",
    "nvidia.com/gpu.deploy.dcgm-exporter=true",
    "nvidia.com/gpu.deploy.device-plugin=true",
    "nvidia.com/gpu.deploy.driver=true",
    "nvidia.com/gpu.deploy.gpu-feature-discovery=true",
    "nvidia.com/gpu.deploy.node-status-exporter=true",
    "nvidia.com/gpu.deploy.operator-validator=true",
    "nvidia.com/gpu.family=ampere",
    "nvidia.com/gpu.machine=AWS-g6.4xlarge",
    "nvidia.com/gpu.memory=22835",
    "nvidia.com/gpu.mode=compute",
    "nvidia.com/gpu.present=true",
    "nvidia.com/gpu.product=NVIDIA-L4",
    "nvidia.com/gpu.replicas=1",
    "nvidia.com/gpu.sharing-strategy=none",
    "nvidia.com/mig.capable=false",
    "nvidia.com/mig.strategy=single",
    "nvidia.com/mps.capable=false",
    "nvidia.com/vgpu.present=false",
  ],
  operatingSystem: "linux",
  osImage: "Red Hat Enterprise Linux CoreOS 9.6.20260225-1 (Plow)",
  architecture: "amd64",
  kernelVersion: "5.14.0-570.94.1.el9_6.x86_64",
  bootId: "66ef6d9e-c578-414e-bf57-241ee6980d8d",
  containerRuntime: "cri-o://1.34.5-3.rhaos4.21.gita8af6ea.el9",
  kubeletVersion: "v1.34.4",
  kubeProxyVersion: "v1.34.4",
};

const NODE_DETAILS: Record<string, NodeDetailRecord> = {
  [CONSOLE_SAMPLE_NODE.name]: CONSOLE_SAMPLE_NODE,
  "worker-east-01": {
    ...CONSOLE_SAMPLE_NODE,
    name: "worker-east-01",
    addresses: {
      hostname: "worker-east-01",
      internalDns: "worker-east-01.cluster.local",
      internalIp: "10.0.1.45",
    },
    labels: [
      "node.openshift.io/os_id=rhel",
      "node-role.kubernetes.io/worker=",
      "kubernetes.io/arch=amd64",
      "kubernetes.io/os=linux",
    ],
  },
  "worker-east-02": {
    ...CONSOLE_SAMPLE_NODE,
    name: "worker-east-02",
    addresses: {
      hostname: "worker-east-02",
      internalDns: "worker-east-02.cluster.local",
      internalIp: "10.0.2.67",
    },
    labels: [
      "node.openshift.io/os_id=rhel",
      "node-role.kubernetes.io/worker=",
      "kubernetes.io/arch=amd64",
    ],
  },
};

export function getNodeDetail(nodeName: string): NodeDetailRecord {
  const decoded = decodeURIComponent(nodeName);
  return NODE_DETAILS[decoded] ?? { ...CONSOLE_SAMPLE_NODE, name: decoded };
}

export const COMPUTE_NODES_LIST = [
  { name: CONSOLE_SAMPLE_NODE.name, status: "Ready" as const, role: "Worker", kubelet: "v1.34.4", cpu: "16 cores", memory: "64 GiB", pods: "42/110", age: "4d" },
  { name: "worker-east-01", status: "Ready" as const, role: "Worker", kubelet: "v1.34.4", cpu: "8 cores", memory: "32 GiB", pods: "35/110", age: "89d" },
  { name: "worker-east-02", status: "Ready" as const, role: "Worker", kubelet: "v1.34.4", cpu: "8 cores", memory: "32 GiB", pods: "38/110", age: "89d" },
  { name: "master-01", status: "Ready" as const, role: "Control plane", kubelet: "v1.34.4", cpu: "4 cores", memory: "16 GiB", pods: "15/50", age: "120d" },
  { name: "master-02", status: "Ready" as const, role: "Control plane", kubelet: "v1.34.4", cpu: "4 cores", memory: "16 GiB", pods: "18/50", age: "120d" },
  { name: "master-03", status: "Ready" as const, role: "Control plane", kubelet: "v1.34.4", cpu: "4 cores", memory: "16 GiB", pods: "12/50", age: "120d" },
];
