import { useCallback, useSyncExternalStore } from "react";
import {
  WORKER_NODE_GROUPS,
  attachStandaloneResourceToGroup,
  createStandaloneNetworkResources,
  updateStandaloneResourcesByIdSuffix,
  type StandaloneTopologyResource,
  type WorkerNodeGroup,
} from "./networkTopologyData";

function cloneGroups(): WorkerNodeGroup[] {
  return WORKER_NODE_GROUPS.map((group) => ({
    ...group,
    resources: group.resources.map((r) => ({ ...r })),
    edges: group.edges.map((e) => ({ ...e })),
  }));
}

type TopologySnapshot = {
  groups: WorkerNodeGroup[];
  standaloneResources: StandaloneTopologyResource[];
  provisionGeneration: number;
  fitContentToken: number;
};

let snapshot: TopologySnapshot = {
  groups: cloneGroups(),
  standaloneResources: [],
  provisionGeneration: 0,
  fitContentToken: 0,
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

export function useNetworkTopologyState() {
  const state = useSyncExternalStore(subscribe, getSnapshot);

  const setGroups = useCallback((updater: WorkerNodeGroup[] | ((prev: WorkerNodeGroup[]) => WorkerNodeGroup[])) => {
    snapshot = {
      ...snapshot,
      groups: typeof updater === "function" ? updater(snapshot.groups) : updater,
    };
    emit();
  }, []);

  const setStandaloneResources = useCallback(
    (updater: StandaloneTopologyResource[] | ((prev: StandaloneTopologyResource[]) => StandaloneTopologyResource[])) => {
      snapshot = {
        ...snapshot,
        standaloneResources:
          typeof updater === "function" ? updater(snapshot.standaloneResources) : updater,
      };
      emit();
    },
    []
  );

  const bumpFitContent = useCallback(() => {
    snapshot = { ...snapshot, fitContentToken: snapshot.fitContentToken + 1 };
    emit();
  }, []);

  const provisionConfiguration = useCallback((physicalNetworkName: string) => {
    const name = physicalNetworkName.trim() || "localnet-rzpi1d";
    snapshot = {
      ...snapshot,
      standaloneResources: [
        ...snapshot.standaloneResources.filter((r) => !r.id.endsWith("br-localnet")),
        ...createStandaloneNetworkResources({ physicalNetworkName: name, bridgeName: "br-localnet" }),
      ],
      provisionGeneration: snapshot.provisionGeneration + 1,
      fitContentToken: snapshot.fitContentToken + 1,
    };
    emit();
    return name;
  }, []);

  const attachStandaloneToGroup = useCallback(
    (resourceId: string, groupId: string, connectToResourceId?: string) => {
      const standalone = snapshot.standaloneResources.find((r) => r.id === resourceId);
      if (!standalone) return null;
      snapshot = {
        ...snapshot,
        standaloneResources: snapshot.standaloneResources.filter((r) => r.id !== resourceId),
        groups: snapshot.groups.map((group) =>
          group.id === groupId ? attachStandaloneResourceToGroup(group, standalone, connectToResourceId) : group
        ),
        fitContentToken: snapshot.fitContentToken + 1,
      };
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

  return {
    ...state,
    setGroups,
    setStandaloneResources,
    bumpFitContent,
    provisionConfiguration,
    attachStandaloneToGroup,
    markStandalonesInstalling,
    markStandalonesConfigured,
  };
}
