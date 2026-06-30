import { getAllVirtualMachines } from "../networking/networkingMockData";

export const VIRT_CRUMB = { label: "Virtualization", path: "/virtualization/virtualmachines" };

export interface VirtProject {
  name: string;
}

export const VIRT_PROJECTS: VirtProject[] = [
  { name: "aut-routes-testqbwyy" },
  { name: "console-demo-plugin" },
  { name: "console-e2e-a11y" },
  { name: "console-e2e-guest" },
  { name: "console-e2e-test" },
  { name: "default" },
  { name: "openshift-controller-manager-operator" },
];

export function getProjectVmCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of VIRT_PROJECTS) counts[p.name] = 0;
  for (const vm of getAllVirtualMachines()) {
    counts[vm.namespace] = (counts[vm.namespace] ?? 0) + 1;
  }
  return counts;
}

export function getVmsForProject(project: string) {
  return getAllVirtualMachines().filter((vm) => vm.namespace === project);
}

export interface BootVolumeRow {
  name: string;
  architecture: string;
  operatingSystem: string;
  storageClass: string;
  size: string;
  description: string;
}

export const BOOT_VOLUMES: BootVolumeRow[] = [
  {
    name: "rhel10",
    architecture: "—",
    operatingSystem: "Red Hat Enterprise Linux 10 (amd64)",
    storageClass: "gp3-csi",
    size: "30 GiB",
    description: "—",
  },
];

export interface InstanceTypeRow {
  name: string;
  cpu: string;
  memory: string;
  series: string;
}

export const INSTANCE_TYPES: InstanceTypeRow[] = [
  { name: "u1.medium", cpu: "1", memory: "4 GiB", series: "General Purpose (U series)" },
  { name: "u1.large", cpu: "2", memory: "8 GiB", series: "General Purpose (U series)" },
  { name: "m1.large", cpu: "2", memory: "16 GiB", series: "Memory Intensive (M series)" },
];

export interface TemplateRow {
  name: string;
  namespace: string;
  os: string;
  workload: string;
}

export const TEMPLATES: TemplateRow[] = [
  {
    name: "rhel10-server-small",
    namespace: "openshift",
    os: "Red Hat Enterprise Linux 10",
    workload: "Server",
  },
];

export const COMPUTE_SERIES = [
  { id: "cx", label: "Compute Exclusive (CX series)" },
  { id: "d", label: "Dedicated vCPU (D series)" },
  { id: "u", label: "General Purpose (U series)" },
  { id: "m", label: "Memory Intensive (M series)" },
  { id: "n", label: "Network (N series)" },
  { id: "o", label: "Overcommitted (O series)" },
  { id: "rt", label: "Realtime (RT series)" },
] as const;

export const COMPUTE_SIZES = [
  { id: "medium", label: "medium: 1 CPUs, 4 GiB Memory", instanceType: "u1.medium", cpu: "1 CPU", memory: "4 GiB Memory" },
  { id: "large", label: "large: 2 CPUs, 8 GiB Memory", instanceType: "u1.large", cpu: "2 CPU", memory: "8 GiB Memory" },
];

export const GUEST_OS_OPTIONS = [
  { id: "rhel", label: "RHEL", preference: "rhel.10" },
  { id: "windows", label: "Microsoft Windows", preference: "windows.11" },
  { id: "linux", label: "Other Linux", preference: "linux.generic" },
];
