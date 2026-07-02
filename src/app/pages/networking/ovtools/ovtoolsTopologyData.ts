import type { ElementDefinition } from "cytoscape";
import { getAllVirtualMachines, getNadRecords, type VirtualMachineRecord } from "../networkingMockData";
import { TOPOLOGY_WORKER_CATALOG, WORKER_NODE_GROUPS } from "../networkTopologyData";
import type { OvtoolsTopologyFilters, OvtoolsTopologyMode } from "./ovtoolsTopologyTypes";

const STORAGE_CLASSES = [
  { id: "sc-ocs", label: "ocs-storagecluster-ceph-rbd", provisioner: "openshift-storage.rbd.csi.ceph.com" },
  { id: "sc-gp3", label: "gp3-csi", provisioner: "ebs.csi.aws.com" },
];

const MOCK_PVCS = [
  { id: "pvc-root-amber", label: "amber-fox-01-rootdisk", vm: "amber-fox-01", sc: "sc-ocs", status: "Bound" },
  { id: "pvc-root-bronze", label: "bronze-elk-06-rootdisk", vm: "bronze-elk-06", sc: "sc-ocs", status: "Bound" },
  { id: "pvc-data-copper", label: "copper-bear-07-data", vm: "copper-bear-07", sc: "sc-gp3", status: "Bound" },
  { id: "pvc-root-dart", label: "dart-hawk-02-rootdisk", vm: "dart-hawk-02", sc: "sc-ocs", status: "Pending" },
];

function vmStatus(vm: VirtualMachineRecord): string {
  if (vm.status === "ErrorUnschedulable") return "ErrorUnschedulable";
  if (vm.status.toLowerCase().includes("running")) return "Running";
  if (vm.status.toLowerCase().includes("stop")) return "Stopped";
  return vm.status;
}

function matchesSearch(label: string, search: string) {
  if (!search.trim()) return true;
  return label.toLowerCase().includes(search.trim().toLowerCase());
}

function vmPassesFilters(vm: VirtualMachineRecord, filters: OvtoolsTopologyFilters, nodeId: string) {
  if (filters.nodeId !== "all" && filters.nodeId !== nodeId) return false;
  const status = vmStatus(vm);
  if (filters.vmStatus !== "all" && status !== filters.vmStatus) return false;
  if (!matchesSearch(vm.name, filters.search) && !matchesSearch(vm.hostname, filters.search)) return false;
  return true;
}

export function buildOvtoolsTopologyElements(
  mode: OvtoolsTopologyMode,
  filters: OvtoolsTopologyFilters
): ElementDefinition[] {
  const elements: ElementDefinition[] = [];
  const vms = getAllVirtualMachines();
  const nads = getNadRecords();
  const workers = WORKER_NODE_GROUPS.slice(0, 4);

  const addNode = (
    id: string,
    label: string,
    kind: string,
    extra: Record<string, string | undefined> = {},
    parent?: string
  ) => {
    elements.push({
      data: { id, label, kind, ...extra, ...(parent ? { parent } : {}) },
    });
  };

  const addEdge = (id: string, source: string, target: string, kind: string) => {
    elements.push({ data: { id, source, target, kind } });
  };

  if (mode === "overview") {
    workers.forEach((worker, index) => {
      const nodeId = `node:${worker.id}`;
      addNode(nodeId, worker.shortName, "node", {
        hostname: worker.hostname,
        status: TOPOLOGY_WORKER_CATALOG.find((w) => w.id === worker.id)?.ready ? "Ready" : "NotReady",
      });

      vms
        .filter((vm, vmIndex) => vmIndex % workers.length === index)
        .filter((vm) => vmPassesFilters(vm, filters, worker.id))
        .forEach((vm) => {
          const vmId = `vm:${vm.namespace}/${vm.name}`;
          addNode(vmId, vm.name, "vm", { namespace: vm.namespace, status: vmStatus(vm) }, nodeId);
        });
    });

    vms.forEach((vm, vmIndex) => {
      const worker = workers[vmIndex % workers.length];
      if (!vmPassesFilters(vm, filters, worker.id)) return;
      const vmId = `vm:${vm.namespace}/${vm.name}`;
      vm.interfaces
          .filter((iface) => iface.network.kind === "NAD")
          .forEach((iface) => {
            const nadKey = `${iface.network.namespace}/${iface.network.name}`;
            const nadId = `nad:${nadKey}`;
            if (!elements.some((el) => el.data.id === nadId)) {
              addNode(nadId, iface.network.name, "nad", { namespace: iface.network.namespace });
            }
            addEdge(`edge:${vmId}->${nadId}`, vmId, nadId, "network");
          });
      });
    return elements;
  }

  if (mode === "network") {
    workers.forEach((worker) => {
      if (filters.nodeId !== "all" && filters.nodeId !== worker.id) return;
      addNode(`node:${worker.id}`, worker.shortName, "node", { hostname: worker.hostname });
    });

    nads.forEach((nad) => {
      if (!matchesSearch(nad.name, filters.search)) return;
      addNode(`nad:${nad.namespace}/${nad.name}`, nad.name, "nad", {
        namespace: nad.namespace,
        detail: nad.networkType,
      });
    });

    addNode("udn:cluster-udn-lime-giraffe", "cluster-udn-lime-giraffe", "udn", {
      namespace: "default",
      status: "Creating",
    });
    addNode("udn:project-udn-teal-walrus", "project-udn-teal-walrus", "udn", {
      namespace: "production",
      status: "Configured",
    });

    vms.forEach((vm, index) => {
      const worker = workers[index % workers.length];
      if (!vmPassesFilters(vm, filters, worker.id)) return;
      const vmId = `vm:${vm.namespace}/${vm.name}`;
      addNode(vmId, vm.name, "vm", { namespace: vm.namespace, status: vmStatus(vm) });
      addEdge(`place:${vmId}->${worker.id}`, vmId, `node:${worker.id}`, "placement");

      vm.interfaces
        .filter((iface) => iface.network.kind === "NAD")
        .forEach((iface) => {
          const nadId = `nad:${iface.network.namespace}/${iface.network.name}`;
          addEdge(`net:${vmId}->${nadId}`, vmId, nadId, "network");
        });
    });

    addEdge("udn-link-1", "udn:cluster-udn-lime-giraffe", `node:${workers[0]?.id}`, "network");
    addEdge("udn-link-2", "udn:project-udn-teal-walrus", `node:${workers[1]?.id ?? workers[0]?.id}`, "network");
    return elements;
  }

  STORAGE_CLASSES.forEach((sc) => {
    if (!matchesSearch(sc.label, filters.search)) return;
    addNode(sc.id, sc.label, "storageclass", { detail: sc.provisioner });
  });

  MOCK_PVCS.forEach((pvc) => {
    const vm = vms.find((entry) => entry.name === pvc.vm);
    if (!vm) return;
    const workerIndex = vms.indexOf(vm) % workers.length;
    const worker = workers[workerIndex];
    if (!vmPassesFilters(vm, filters, worker.id)) return;
    if (!matchesSearch(pvc.label, filters.search)) return;
    addNode(pvc.id, pvc.label, "pvc", { status: pvc.status, namespace: vm.namespace });
    addEdge(`pvc-sc:${pvc.id}`, pvc.id, pvc.sc, "storage");
    addEdge(`pvc-vm:${pvc.id}`, pvc.id, `vm:${vm.namespace}/${vm.name}`, "storage");
  });

  workers.forEach((worker, index) => {
    if (filters.nodeId !== "all" && filters.nodeId !== worker.id) return;
    vms
      .filter((vm, vmIndex) => vmIndex % workers.length === index)
      .filter((vm) => vmPassesFilters(vm, filters, worker.id))
      .forEach((vm) => {
        if (!elements.some((el) => el.data.id === `vm:${vm.namespace}/${vm.name}`)) {
          addNode(`vm:${vm.namespace}/${vm.name}`, vm.name, "vm", {
            namespace: vm.namespace,
            status: vmStatus(vm),
          });
        }
        addEdge(`place-storage:${vm.name}`, `vm:${vm.namespace}/${vm.name}`, `node:${worker.id}`, "placement");
      });
    addNode(`node:${worker.id}`, worker.shortName, "node", { hostname: worker.hostname });
  });

  return elements;
}

export function workerFilterOptions() {
  return [
    { value: "all", label: "All nodes" },
    ...WORKER_NODE_GROUPS.slice(0, 6).map((worker) => ({
      value: worker.id,
      label: worker.shortName,
    })),
  ];
}
