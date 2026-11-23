import { clearClusterUpdateStarted } from "../constants/clusterVersionDemo";
import { writePreflightPhase } from "./clusterUpdateWorkflow";

/** Same key as ClusterUpdateDemoContext. Kept here to avoid a circular import. */
const CLUSTER_UPDATE_DEMO_VARIANT_KEY = "ocp5-cluster-update-demo-variant";

/** Prototype-only persistence cleared by masthead Reset prototype (not console theme). */
const LOCAL_STORAGE_KEYS = [
  "ocs-demo-switcher",
  "ocs-networking-topology-saved-view",
  "clusterUpdateInProgress",
  "ocs-demo-update-plans",
  "ocp-prototype-olm-operating-mode-v3",
  "ocs-gitops-instance",
  "ocs.node-network.view-mode",
  "openshift-favorites",
] as const;

const SESSION_STORAGE_KEYS = [
  CLUSTER_UPDATE_DEMO_VARIANT_KEY,
  "ocs-demo-update-target-version",
  "ocs-demo-update-target-channel",
  "ocs-demo-preflight-phase",
  "ocs-demo-cluster-update-started",
  "gitops-prototype-created",
  "ocs-prototype-list-items",
  "ocs-net-topo-split-width",
  "ocs-net-topo-layout-mode",
] as const;

const CLUSTER_UPDATE_ACTIVE_PREFIXES = [
  "/administration/cluster-update/in-progress",
  "/administration/cluster-update/complete",
  "/administration/cluster-update/failed",
] as const;

/** Clears saved demo switchers, cluster update flow, GitOps prototype edits, and related session state. */
export function clearPrototypeDemoPersistence(): void {
  try {
    for (const key of LOCAL_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    for (const key of SESSION_STORAGE_KEYS) {
      sessionStorage.removeItem(key);
    }
    clearClusterUpdateStarted();
    writePreflightPhase("idle");
  } catch {
    /* ignore quota / private mode */
  }
}

/** Full reset: clear persistence and reload (or exit cluster-update run routes). */
export function resetPrototypeToDefaults(): void {
  clearPrototypeDemoPersistence();
  const path = window.location.pathname;
  if (CLUSTER_UPDATE_ACTIVE_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    window.location.assign("/administration/cluster-update");
    return;
  }
  window.location.reload();
}