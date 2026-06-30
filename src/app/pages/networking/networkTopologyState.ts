import { useCallback, useSyncExternalStore } from "react";
import {
  WORKER_NODE_GROUPS,
  TOPOLOGY_WORKER_CATALOG,
  attachStandaloneResourceToGroup,
  bridgeAssignmentKey,
  bridgeLabelFromAssignmentKey,
  createStandaloneBridgeForWorker,
  createStandaloneNetworkResources,
  crossEdgesForAssignments,
  isBridgeAssignmentKey,
  isLogicalNetworkStandalone,
  logicalNetworkFromRecord,
  logicalNetworkId,
  updateStandaloneResourcesByIdSuffix,
  type NetworkNodeAssignments,
  type NodeNetworkConfigurationInput,
  type StandaloneTopologyResource,
  type TopologyCrossEdge,
  type WorkerNodeGroup,
} from "./networkTopologyData";
import { getUdnRecords, type UdnRecord, udnDetailPath } from "./networkingMockData";

function cloneGroups(): WorkerNodeGroup[] {
  return WORKER_NODE_GROUPS.map((group) => ({
    ...group,
    resources: group.resources.map((r) => ({ ...r })),
    edges: group.edges.map((e) => ({ ...e })),
  }));
}

function buildInitialLogicalLayer(): {
  standaloneResources: StandaloneTopologyResource[];
  networkNodeAssignments: NetworkNodeAssignments;
} {
  const records = getUdnRecords();
  const standaloneResources = records.map((record, index) =>
    logicalNetworkFromRecord(record, index, udnDetailPath(record))
  );
  const networkNodeAssignments: NetworkNodeAssignments = Object.fromEntries(
    standaloneResources
      .filter(isLogicalNetworkStandalone)
      .map((resource) => [resource.id, [] as string[]])
  );
  return { standaloneResources, networkNodeAssignments };
}

type TopologySnapshot = {
  groups: WorkerNodeGroup[];
  standaloneResources: StandaloneTopologyResource[];
  crossEdges: TopologyCrossEdge[];
  networkNodeAssignments: NetworkNodeAssignments;
  revealedGroupIds: string[];
  provisionGeneration: number;
  fitContentToken: number;
  provisionedBridgeConfig: NodeNetworkConfigurationInput | null;
};

const initialGroups = cloneGroups();
const initialLogical = buildInitialLogicalLayer();
const initialRevealedGroupIds = ["worker-0"];

let snapshot: TopologySnapshot = {
  groups: initialGroups,
  standaloneResources: initialLogical.standaloneResources,
  crossEdges: [],
  networkNodeAssignments: initialLogical.networkNodeAssignments,
  revealedGroupIds: initialRevealedGroupIds,
  provisionGeneration: 0,
  fitContentToken: 0,
  provisionedBridgeConfig: null,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): TopologySnapshot {
  return snapshot;
}

function syncCrossEdgesFromAssignments() {
  snapshot = {
    ...snapshot,
    crossEdges: crossEdgesForAssignments(
      snapshot.networkNodeAssignments,
      snapshot.standaloneResources,
      snapshot.groups
    ),
  };
}

export function useNetworkTopologyState() {
  const state = useSyncExternalStore(subscribe, getSnapshot);

  const setGroups = useCallback((updater: WorkerNodeGroup[] | ((prev: WorkerNodeGroup[]) => WorkerNodeGroup[])) => {
    snapshot = {
      ...snapshot,
      groups: typeof updater === "function" ? updater(snapshot.groups) : updater,
    };
    syncCrossEdgesFromAssignments();
    emit();
  }, []);

  const setStandaloneResources = useCallback(
    (updater: StandaloneTopologyResource[] | ((prev: StandaloneTopologyResource[]) => StandaloneTopologyResource[])) => {
      snapshot = {
        ...snapshot,
        standaloneResources:
          typeof updater === "function" ? updater(snapshot.standaloneResources) : updater,
      };
      syncCrossEdgesFromAssignments();
      emit();
    },
    []
  );

  const setCrossEdges = useCallback(
    (updater: TopologyCrossEdge[] | ((prev: TopologyCrossEdge[]) => TopologyCrossEdge[])) => {
      snapshot = {
        ...snapshot,
        crossEdges: typeof updater === "function" ? updater(snapshot.crossEdges) : updater,
      };
      emit();
    },
    []
  );

  const setNetworkNodeAssignments = useCallback(
    (updater: NetworkNodeAssignments | ((prev: NetworkNodeAssignments) => NetworkNodeAssignments)) => {
      snapshot = {
        ...snapshot,
        networkNodeAssignments:
          typeof updater === "function" ? updater(snapshot.networkNodeAssignments) : updater,
      };
      syncCrossEdgesFromAssignments();
      emit();
    },
    []
  );

  const bumpFitContent = useCallback(() => {
    snapshot = { ...snapshot, fitContentToken: snapshot.fitContentToken + 1 };
    emit();
  }, []);

  const setWorkerAssignedToNetwork = useCallback((assignmentKey: string, workerId: string, assigned: boolean) => {
    if (isBridgeAssignmentKey(assignmentKey)) {
      const bridgeLabel = bridgeLabelFromAssignmentKey(assignmentKey);
      const config = snapshot.provisionedBridgeConfig ?? {
        physicalNetworkName: "localnet-rzpi1d",
        bridgeName: bridgeLabel,
      };
      const current = snapshot.networkNodeAssignments[assignmentKey] ?? [];
      const standaloneId = `${workerId}-${bridgeLabel}`;

      if (assigned) {
        if (current.includes(workerId)) return;
        const nextWorkers = [...current, workerId];
        const worker = TOPOLOGY_WORKER_CATALOG.find((entry) => entry.id === workerId);
        if (!worker) return;

        const hasStandalone = snapshot.standaloneResources.some((resource) => resource.id === standaloneId);
        const newStandalone = hasStandalone
          ? null
          : createStandaloneBridgeForWorker(config, worker, nextWorkers.length - 1);
        const revealedGroupIds = snapshot.revealedGroupIds.includes(workerId)
          ? snapshot.revealedGroupIds
          : [...snapshot.revealedGroupIds, workerId];

        snapshot = {
          ...snapshot,
          networkNodeAssignments: {
            ...snapshot.networkNodeAssignments,
            [assignmentKey]: nextWorkers,
          },
          standaloneResources: newStandalone
            ? [...snapshot.standaloneResources, newStandalone]
            : snapshot.standaloneResources,
          revealedGroupIds,
          fitContentToken: snapshot.fitContentToken + 1,
        };
      } else {
        const nextWorkers = current.filter((id) => id !== workerId);
        snapshot = {
          ...snapshot,
          networkNodeAssignments: {
            ...snapshot.networkNodeAssignments,
            [assignmentKey]: nextWorkers,
          },
          standaloneResources: snapshot.standaloneResources.filter((resource) => resource.id !== standaloneId),
          groups: snapshot.groups.map((group) => {
            if (!group.resources.some((resource) => resource.id === standaloneId)) return group;
            return {
              ...group,
              resources: group.resources.filter((resource) => resource.id !== standaloneId),
              edges: group.edges.filter((edge) => edge.from !== standaloneId && edge.to !== standaloneId),
            };
          }),
          fitContentToken: snapshot.fitContentToken + 1,
        };
      }

      syncCrossEdgesFromAssignments();
      emit();
      return;
    }

    const current = snapshot.networkNodeAssignments[assignmentKey] ?? [];
    const nextWorkers = assigned
      ? current.includes(workerId)
        ? current
        : [...current, workerId]
      : current.filter((id) => id !== workerId);

    const nextAssignments = {
      ...snapshot.networkNodeAssignments,
      [assignmentKey]: nextWorkers,
    };

    const revealedGroupIds =
      assigned && !snapshot.revealedGroupIds.includes(workerId)
        ? [...snapshot.revealedGroupIds, workerId]
        : snapshot.revealedGroupIds;

    snapshot = {
      ...snapshot,
      networkNodeAssignments: nextAssignments,
      revealedGroupIds,
      fitContentToken: snapshot.fitContentToken + 1,
    };
    syncCrossEdgesFromAssignments();
    emit();
  }, []);

  const addLogicalNetwork = useCallback((record: UdnRecord) => {
    const id = logicalNetworkId(record.name, record.kind);
    if (snapshot.standaloneResources.some((resource) => resource.id === id)) return;

    const logicalCount = snapshot.standaloneResources.filter(isLogicalNetworkStandalone).length;
    const resource = logicalNetworkFromRecord(record, logicalCount, udnDetailPath(record));

    snapshot = {
      ...snapshot,
      standaloneResources: [...snapshot.standaloneResources, resource],
      networkNodeAssignments: {
        ...snapshot.networkNodeAssignments,
        [id]: [],
      },
      fitContentToken: snapshot.fitContentToken + 1,
    };
    syncCrossEdgesFromAssignments();
    emit();
  }, []);

  const provisionConfiguration = useCallback((physicalNetworkName: string) => {
    const name = physicalNetworkName.trim() || "localnet-rzpi1d";
    const bridgeConfig = { physicalNetworkName: name, bridgeName: "br-localnet" };
    snapshot = {
      ...snapshot,
      standaloneResources: [
        ...snapshot.standaloneResources.filter(
          (resource) => !resource.id.endsWith("br-localnet") || isLogicalNetworkStandalone(resource)
        ),
        ...createStandaloneNetworkResources(bridgeConfig),
      ],
      networkNodeAssignments: {
        ...snapshot.networkNodeAssignments,
        [bridgeAssignmentKey("br-localnet")]: [],
      },
      provisionedBridgeConfig: bridgeConfig,
      provisionGeneration: snapshot.provisionGeneration + 1,
      fitContentToken: snapshot.fitContentToken + 1,
    };
    syncCrossEdgesFromAssignments();
    emit();
    return name;
  }, []);

  const attachStandaloneToGroup = useCallback(
    (resourceId: string, groupId: string, connectToResourceId?: string) => {
      const standalone = snapshot.standaloneResources.find((r) => r.id === resourceId);
      if (!standalone || isLogicalNetworkStandalone(standalone)) return null;
      snapshot = {
        ...snapshot,
        standaloneResources: snapshot.standaloneResources.filter((r) => r.id !== resourceId),
        groups: snapshot.groups.map((group) =>
          group.id === groupId ? attachStandaloneResourceToGroup(group, standalone, connectToResourceId) : group
        ),
        revealedGroupIds: snapshot.revealedGroupIds.includes(groupId)
          ? snapshot.revealedGroupIds
          : [...snapshot.revealedGroupIds, groupId],
        fitContentToken: snapshot.fitContentToken + 1,
      };
      syncCrossEdgesFromAssignments();
      emit();
      return standalone;
    },
    []
  );

  const markStandalonesInstalling = useCallback(() => {
    snapshot = {
      ...snapshot,
      standaloneResources: updateStandaloneResourcesByIdSuffix(snapshot.standaloneResources, "br-localnet", "installing"),
    };
    emit();
  }, []);

  const markStandalonesConfigured = useCallback(() => {
    snapshot = {
      ...snapshot,
      standaloneResources: updateStandaloneResourcesByIdSuffix(snapshot.standaloneResources, "br-localnet", "configured"),
    };
    emit();
  }, []);

  const revealWorkerGroups = useCallback((workerIds: string[]) => {
    const unique = workerIds.filter((id) => !snapshot.revealedGroupIds.includes(id));
    if (unique.length === 0) return;
    snapshot = {
      ...snapshot,
      revealedGroupIds: [...snapshot.revealedGroupIds, ...unique],
      fitContentToken: snapshot.fitContentToken + 1,
    };
    emit();
  }, []);

  const hideWorkerGroups = useCallback((workerIds: string[]) => {
    const idSet = new Set(workerIds.filter(Boolean));
    if (idSet.size === 0) return;

    const nextAssignments: NetworkNodeAssignments = {};
    Object.entries(snapshot.networkNodeAssignments).forEach(([logicalId, assigned]) => {
      nextAssignments[logicalId] = assigned.filter((workerId) => !idSet.has(workerId));
    });

    snapshot = {
      ...snapshot,
      revealedGroupIds: snapshot.revealedGroupIds.filter((id) => !idSet.has(id)),
      networkNodeAssignments: nextAssignments,
      fitContentToken: snapshot.fitContentToken + 1,
    };
    syncCrossEdgesFromAssignments();
    emit();
  }, []);

  return {
    ...state,
    setGroups,
    setStandaloneResources,
    setCrossEdges,
    setNetworkNodeAssignments,
    setWorkerAssignedToNetwork,
    bumpFitContent,
    addLogicalNetwork,
    provisionConfiguration,
    attachStandaloneToGroup,
    revealWorkerGroups,
    hideWorkerGroups,
    markStandalonesInstalling,
    markStandalonesConfigured,
  };
}
