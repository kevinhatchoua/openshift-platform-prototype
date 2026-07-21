import { useEffect, useState } from "react";
import { getTopologyDeveloperMode } from "./topologyDeveloperMode";

export type TopologyMetricSnapshot = {
  resourceId: string;
  kind: string;
  label: string;
  cpuPercent: number;
  memoryPercent: number;
  iops: number;
  storageUtilPercent?: number;
  macAddress?: string;
  rxMbps?: number;
  txMbps?: number;
  atCapacity: boolean;
  source: "mock" | "live";
  fetchedAt: number;
};

const METRIC_KINDS = new Set([
  "bridge",
  "interface",
  "port",
  "node",
  "nad",
  "udn",
  "vm",
  "pvc",
  "storageclass",
  "cluster",
]);

function hashSeed(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function mockMetrics(resourceId: string, kind: string, label: string): TopologyMetricSnapshot {
  const seed = hashSeed(`${resourceId}:${kind}`);
  const atCapacity = seed % 12 === 0;
  const cpuPercent = atCapacity ? 100 : 8 + (seed % 72);
  const memoryPercent = atCapacity ? 100 : 12 + (seed % 61);
  const iops = 120 + (seed % 4800);
  const storageUtilPercent =
    kind === "pvc" || kind === "storageclass"
      ? atCapacity
        ? 100
        : 18 + (seed % 83)
      : undefined;
  const macOctets = Array.from({ length: 6 }, (_, index) =>
    ((seed >> (index * 4)) & 0xff).toString(16).padStart(2, "0")
  );
  return {
    resourceId,
    kind,
    label,
    cpuPercent,
    memoryPercent,
    iops,
    storageUtilPercent,
    macAddress: kind === "interface" || kind === "bridge" ? macOctets.join(":") : undefined,
    rxMbps: 4 + (seed % 940),
    txMbps: 3 + (seed % 820),
    atCapacity,
    source: "mock",
    fetchedAt: Date.now(),
  };
}

async function fetchLiveMetrics(
  resourceId: string,
  kind: string,
  label: string
): Promise<TopologyMetricSnapshot | null> {
  if (!METRIC_KINDS.has(kind)) return null;
  // Prototype seam: swap for Kube status subresource + Prometheus instant queries.
  return mockMetrics(resourceId, kind, label);
}

export function useTopologyMetrics(
  resourceId: string | null,
  kind: string | undefined,
  label: string | undefined
) {
  const [metrics, setMetrics] = useState<TopologyMetricSnapshot | null>(null);

  useEffect(() => {
    if (!resourceId || !kind || !label || !METRIC_KINDS.has(kind)) {
      setMetrics(null);
      return undefined;
    }

    let cancelled = false;
    const load = async () => {
      const devMode = getTopologyDeveloperMode().enabled;
      const snapshot = devMode
        ? mockMetrics(resourceId, kind, label)
        : await fetchLiveMetrics(resourceId, kind, label);
      if (!cancelled) setMetrics(snapshot);
    };

    void load();
    const refreshMs = getTopologyDeveloperMode().enabled ? 2500 : 15000;
    const interval = window.setInterval(load, refreshMs);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [resourceId, kind, label]);

  return metrics;
}
