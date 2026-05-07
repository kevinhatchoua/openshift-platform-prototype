import { PLATFORM_CLUSTER_OPERATORS } from "../components/cluster-update/AgentExecutionLogsPanel";

/**
 * Demo totals for Cluster Update in-progress / complete screens.
 * Keep catalog operator count aligned with OPERATORS_BASE.length in ClusterUpdateInProgressPage.tsx.
 */
export const CLUSTER_CATALOG_OPERATOR_INSTALL_COUNT = 5;

/** Platform ClusterOperator payloads reconciled during update (matches in-progress “Cluster operators” table). */
export const CLUSTER_PLATFORM_OPERATOR_COUNT = PLATFORM_CLUSTER_OPERATORS.length;

/** Cluster + catalog operators touched in this update narrative. */
export const CLUSTER_OPERATOR_UPDATES_TOTAL =
  CLUSTER_PLATFORM_OPERATOR_COUNT + CLUSTER_CATALOG_OPERATOR_INSTALL_COUNT;

/** Worker pools on Cluster Update in-progress (WORKER_POOLS_BASE.length). */
export const CLUSTER_WORKER_POOL_COUNT = 5;

/**
 * Representative nodes rolled during the worker phase (pools × nodes per pool).
 * Matches “Worker nodes” progress and Post-Update Summary node totals.
 */
export const CLUSTER_NODES_PER_WORKER_POOL = 1;
export const CLUSTER_NODE_COUNT_UPDATED = CLUSTER_WORKER_POOL_COUNT * CLUSTER_NODES_PER_WORKER_POOL;
