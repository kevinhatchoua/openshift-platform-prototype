import type { CatalogOperator } from "../pages/ecosystem/installedOperatorsTypes";
import {
  finishClusterExtensionPrecheckRun,
  finishClusterExtensionTroubleshootRun,
  startClusterExtensionPrecheckRun,
  startClusterExtensionTroubleshootRun,
} from "./updatePlansStore";

export function clusterExtensionHasAvailableUpdate(op: CatalogOperator): boolean {
  return Boolean(op.isOlmV1Extension && op.updateAvailable && op.updateAvailable.length > 0);
}

/** Extension needs admin attention (errors, failed recovery, incompatible, etc.). */
export function clusterExtensionNeedsAiTroubleshoot(op: CatalogOperator): boolean {
  if (!op.isOlmV1Extension) return false;
  if (op.status !== "Running") return true;
  if (op.clusterCompatibility === "Incompatible") return true;
  if (op.isUnsupported) return true;
  const activity = op.olmMigrationActivity;
  if (
    activity === "failed_manual" ||
    activity === "failed_rollback" ||
    activity === "error" ||
    activity === "incomplete"
  ) {
    return true;
  }
  const phase = op.olmClusterExtensionMigration?.migrationPhase?.toLowerCase() ?? "";
  if (phase.includes("fail") || phase.includes("error")) return true;
  const installed = op.olmClusterExtensionMigration?.installedCondition?.toLowerCase() ?? "";
  if (installed === "false" || installed.includes("fail")) return true;
  return Boolean(op.compatibilityMessage?.trim() || op.olmMigrationActivityDetail?.trim());
}

export function proposedClusterExtensionVersion(op: CatalogOperator): string {
  return op.updateAvailable ?? op.version;
}

export type ClusterExtensionAiLaunchers = {
  launchUpdatePrecheck: (op: CatalogOperator) => string;
  launchTroubleshoot: (op: CatalogOperator) => string;
};

const PRECHECK_FINISH_MS = 3200;
const TROUBLESHOOT_FINISH_MS = 3600;

/**
 * Opens global LightSpeed with an agentic cluster-extension workflow.
 * Returns the agentic run id for linking.
 */
export function createClusterExtensionAiLaunchers(deps: {
  clearMessages: () => void;
  setContext: (ctx: string) => void;
  setIsOpen: (open: boolean) => void;
  getIsOpen: () => boolean;
}): ClusterExtensionAiLaunchers {
  const activePrecheckRef = { current: null as string | null };
  const activeTroubleshootRef = { current: null as string | null };
  const precheckTimerRef = { current: undefined as number | undefined };
  const troubleshootTimerRef = { current: undefined as number | undefined };

  const launchUpdatePrecheck = (op: CatalogOperator) => {
    deps.clearMessages();
    const proposed = proposedClusterExtensionVersion(op);
    const run = startClusterExtensionPrecheckRun({
      extensionName: op.name,
      extensionNamespace: op.namespace ?? "openshift-operators",
      channel: op.channel,
      currentVersion: op.version,
      proposedVersion: proposed,
      versionRange: op.versionRange ?? "",
    });
    activePrecheckRef.current = run.id;
    deps.setContext(`ols-cluster-extension-precheck:${run.id}`);
    deps.setIsOpen(true);
    if (precheckTimerRef.current) window.clearTimeout(precheckTimerRef.current);
    precheckTimerRef.current = window.setTimeout(() => {
      if (activePrecheckRef.current !== run.id) return;
      const passed = Boolean(op.versionRange?.trim() || op.updateAvailable);
      finishClusterExtensionPrecheckRun(run.id, passed ? "passed" : "failed");
      activePrecheckRef.current = null;
    }, PRECHECK_FINISH_MS);
    return run.id;
  };

  const launchTroubleshoot = (op: CatalogOperator) => {
    deps.clearMessages();
    const run = startClusterExtensionTroubleshootRun({
      extensionName: op.name,
      extensionNamespace: op.namespace ?? "openshift-operators",
      channel: op.channel,
      currentVersion: op.version,
      proposedVersion: proposedClusterExtensionVersion(op),
      versionRange: op.versionRange ?? "",
      attentionSummary: buildAttentionSummary(op),
    });
    activeTroubleshootRef.current = run.id;
    deps.setContext(`ols-cluster-extension-troubleshoot:${run.id}`);
    deps.setIsOpen(true);
    if (troubleshootTimerRef.current) window.clearTimeout(troubleshootTimerRef.current);
    troubleshootTimerRef.current = window.setTimeout(() => {
      if (activeTroubleshootRef.current !== run.id) return;
      finishClusterExtensionTroubleshootRun(run.id, "completed");
      activeTroubleshootRef.current = null;
    }, TROUBLESHOOT_FINISH_MS);
    return run.id;
  };

  return { launchUpdatePrecheck, launchTroubleshoot };
}

function buildAttentionSummary(op: CatalogOperator): string {
  const parts: string[] = [];
  if (op.status !== "Running") parts.push(`status=${op.status}`);
  if (op.clusterCompatibility === "Incompatible") parts.push("cluster incompatible");
  if (op.compatibilityMessage) parts.push(op.compatibilityMessage);
  if (op.olmMigrationActivityDetail) parts.push(op.olmMigrationActivityDetail);
  if (op.olmClusterExtensionMigration?.message) parts.push(op.olmClusterExtensionMigration.message);
  return parts.join("; ") || "Extension conditions need review";
}
