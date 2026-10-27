import { useEffect, useState } from "react";
import {
  AGENTIC_RUN_NAMESPACE,
  AGENTIC_RUN_TRIGGER_CLUSTER_EXTENSION,
  AGENTIC_RUN_TRIGGER_CLUSTER_EXTENSION_TROUBLESHOOT,
  AGENTIC_RUN_TRIGGER_DOMAIN,
  AGENTIC_UPDATE_RUNS,
  analysisLogLines,
  clusterExtensionReadinessJson,
  clusterReadinessJson,
  type AgenticUpdateRun,
} from "../constants/agenticUpdateRuns";
import {
  CLUSTER_BLOCKER_MESSAGE,
  CLUSTER_CHANNEL,
  CLUSTER_CURRENT_VERSION,
  CLUSTER_MINOR_BLOCKED,
  CLUSTER_PATCH_VERSION,
} from "../constants/clusterVersionDemo";

const STORAGE_KEY = "ocs-demo-update-plans";
export const UPDATE_PLANS_CHANGED_EVENT = "ocs-update-plans-changed";
export const PRECHECK_FINISHED_EVENT = "ocs-precheck-finished";
export const PRECHECK_CANCELLED_EVENT = "ocs-precheck-cancelled";

export type PrecheckOutcome = "passed" | "failed" | "cancelled";

function notify(event = UPDATE_PLANS_CHANGED_EVENT) {
  window.dispatchEvent(new Event(event));
}

function formatTimestamp(date = new Date()) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function sandboxFor(targetVersion: string) {
  const from = CLUSTER_CURRENT_VERSION.replace(/\./g, "-");
  const to = targetVersion.replace(/\./g, "-");
  return `ls-analysis-ota-${from}-to-${to}`;
}

export function readUpdatePlans(): AgenticUpdateRun[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      writeUpdatePlans(AGENTIC_UPDATE_RUNS);
      return AGENTIC_UPDATE_RUNS;
    }
    const parsed = JSON.parse(raw) as AgenticUpdateRun[];
    if (!Array.isArray(parsed)) return AGENTIC_UPDATE_RUNS;
    return parsed;
  } catch {
    return AGENTIC_UPDATE_RUNS;
  }
}

export function writeUpdatePlans(runs: AgenticUpdateRun[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  } catch {
    /* ignore */
  }
  notify();
}

export function getStoredUpdatePlan(runId: string): AgenticUpdateRun | undefined {
  return readUpdatePlans().find((run) => run.id === runId);
}

export function startPrecheckPlan(
  targetVersion: string,
  channel = CLUSTER_CHANNEL,
): AgenticUpdateRun {
  const now = new Date();
  const generatedAt = formatTimestamp(now);
  const from = CLUSTER_CURRENT_VERSION.replace(/\./g, "-");
  const to = targetVersion.replace(/\./g, "-");
  const isMinor = targetVersion === CLUSTER_MINOR_BLOCKED || targetVersion.startsWith("5.1");
  const run: AgenticUpdateRun = {
    id: `ota-${from}-to-${to}-${now.getTime()}`,
    targetVersion,
    updateType: isMinor ? "Minor" : "Patch",
    phase: "Analyzing",
    status: "In progress",
    age: generatedAt,
    generatedAt,
    created: generatedAt,
    sandbox: sandboxFor(targetVersion),
    channel,
    updatePath: "Recommended",
    otherRecommended: isMinor ? CLUSTER_PATCH_VERSION : CLUSTER_MINOR_BLOCKED,
    selectedOption: "Precheck in progress",
    namespace: AGENTIC_RUN_NAMESPACE,
    triggerDomain: AGENTIC_RUN_TRIGGER_DOMAIN,
    tokensConsumed: "-",
    recommendation: null,
  };
  writeUpdatePlans([run, ...readUpdatePlans()]);
  return run;
}

export type ClusterExtensionPrecheckInput = {
  extensionName: string;
  extensionNamespace: string;
  channel: string;
  currentVersion: string;
  proposedVersion: string;
  versionRange: string;
};

function sandboxForExtension(extensionName: string, proposedVersion: string) {
  const slug = extensionName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const ver = proposedVersion.replace(/\./g, "-");
  return `ls-analysis-cex-${slug}-${ver}`;
}

export function startClusterExtensionPrecheckRun(input: ClusterExtensionPrecheckInput): AgenticUpdateRun {
  const now = new Date();
  const generatedAt = formatTimestamp(now);
  const slug = input.extensionName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const run: AgenticUpdateRun = {
    id: `cex-${slug}-${now.getTime()}`,
    targetVersion: input.proposedVersion,
    updateType: "Patch",
    phase: "Analyzing",
    status: "In progress",
    age: generatedAt,
    generatedAt,
    created: "Just now",
    sandbox: sandboxForExtension(input.extensionName, input.proposedVersion),
    channel: input.channel,
    updatePath: "Cluster extension subscription",
    otherRecommended: input.currentVersion,
    selectedOption: "Pre-check in progress",
    namespace: input.extensionNamespace,
    triggerDomain: AGENTIC_RUN_TRIGGER_CLUSTER_EXTENSION,
    tokensConsumed: "-",
    recommendation: null,
    extensionName: input.extensionName,
    extensionNamespace: input.extensionNamespace,
    currentVersion: input.currentVersion,
    proposedVersion: input.proposedVersion,
    versionRange: input.versionRange,
  };
  writeUpdatePlans([run, ...readUpdatePlans()]);
  return run;
}

export type ClusterExtensionTroubleshootInput = ClusterExtensionPrecheckInput & {
  attentionSummary: string;
};

export function startClusterExtensionTroubleshootRun(
  input: ClusterExtensionTroubleshootInput,
): AgenticUpdateRun {
  const now = new Date();
  const generatedAt = formatTimestamp(now);
  const slug = input.extensionName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const run: AgenticUpdateRun = {
    id: `cex-ts-${slug}-${now.getTime()}`,
    targetVersion: input.proposedVersion,
    updateType: "Patch",
    phase: "Analyzing",
    status: "In progress",
    age: generatedAt,
    generatedAt,
    created: "Just now",
    sandbox: `${sandboxForExtension(input.extensionName, input.proposedVersion)}-ts`,
    channel: input.channel,
    updatePath: "Cluster extension troubleshoot",
    otherRecommended: input.currentVersion,
    selectedOption: "Troubleshooting in progress",
    namespace: input.extensionNamespace,
    triggerDomain: AGENTIC_RUN_TRIGGER_CLUSTER_EXTENSION_TROUBLESHOOT,
    tokensConsumed: "-",
    recommendation: null,
    extensionName: input.extensionName,
    extensionNamespace: input.extensionNamespace,
    currentVersion: input.currentVersion,
    proposedVersion: input.proposedVersion,
    versionRange: input.versionRange,
    attentionSummary: input.attentionSummary,
  };
  writeUpdatePlans([run, ...readUpdatePlans()]);
  return run;
}

export type TroubleshootOutcome = "completed" | "cancelled";

export function finishClusterExtensionTroubleshootRun(id: string, outcome: TroubleshootOutcome) {
  const plans = readUpdatePlans();
  const current = plans.find((run) => run.id === id);
  if (!current || current.triggerDomain !== AGENTIC_RUN_TRIGGER_CLUSTER_EXTENSION_TROUBLESHOOT) return;
  if (current.phase !== "Analyzing") return;

  const next: AgenticUpdateRun =
    outcome === "cancelled"
      ? {
          ...current,
          phase: "Cancelled",
          status: "Cancelled",
          selectedOption: "Troubleshooting cancelled before analysis completed",
          recommendation: null,
        }
      : {
          ...current,
          phase: "Analysed",
          status: "Completed",
          selectedOption:
            "Review extension conditions, operand pods, and managed CRDs. Apply recommended fixes, then re-run **Pre-check update with AI** before bumping the subscription version.",
          recommendation: current.attentionSummary?.includes("incompatible") ? "not-recommended" : null,
        };

  writeUpdatePlans(plans.map((run) => (run.id === id ? next : run)));
  notify(outcome === "cancelled" ? PRECHECK_CANCELLED_EVENT : PRECHECK_FINISHED_EVENT);
}

export function finishClusterExtensionPrecheckRun(id: string, outcome: PrecheckOutcome) {
  const plans = readUpdatePlans();
  const current = plans.find((run) => run.id === id);
  if (!current || current.triggerDomain !== AGENTIC_RUN_TRIGGER_CLUSTER_EXTENSION) return;
  if (current.phase !== "Analyzing") return;

  const proposed = current.proposedVersion ?? current.targetVersion;
  const range = current.versionRange?.trim();

  const next: AgenticUpdateRun =
    outcome === "cancelled"
      ? {
          ...current,
          phase: "Cancelled",
          status: "Cancelled",
          selectedOption: "Pre-check cancelled before analysis completed",
          recommendation: null,
        }
      : outcome === "passed"
        ? {
            ...current,
            phase: "Analysed",
            status: "Completed",
            selectedOption: `Apply channel ${current.channel} and version ${proposed}${range ? ` with range ${range}` : ""}. No blockers found in prototype checks.`,
            recommendation: null,
          }
        : {
            ...current,
            phase: "Analysed",
            status: "Completed",
            selectedOption:
              `Proceed with caution: widen the version range or pin ${proposed} only after reviewing extension conditions and managed CRD compatibility. Catalog update discovery remains manual in OCP 5.1.`,
            recommendation: "not-recommended",
          };

  writeUpdatePlans(plans.map((run) => (run.id === id ? next : run)));
  notify(outcome === "cancelled" ? PRECHECK_CANCELLED_EVENT : PRECHECK_FINISHED_EVENT);
}

export function finishPrecheckPlan(id: string, outcome: PrecheckOutcome) {
  const plans = readUpdatePlans();
  const current = plans.find((run) => run.id === id);
  if (!current || current.phase !== "Analyzing") return;

  const next: AgenticUpdateRun =
    outcome === "passed"
      ? {
          ...current,
          phase: "Analysed",
          status: "Completed",
          selectedOption: `No blockers found for update to ${current.targetVersion}`,
          recommendation: null,
        }
      : outcome === "cancelled"
        ? {
            ...current,
            phase: "Cancelled",
            status: "Cancelled",
            selectedOption: "Precheck cancelled before analysis completed",
            recommendation: null,
          }
        : {
            ...current,
            phase: "Failed",
            status: "Failed",
            selectedOption: `Block upgrade to ${current.targetVersion} until the cloud credential secret is restored and operator compatibility is confirmed. ${CLUSTER_BLOCKER_MESSAGE}`,
            recommendation: "not-recommended",
          };

  writeUpdatePlans(plans.map((run) => (run.id === id ? next : run)));
  notify(outcome === "cancelled" ? PRECHECK_CANCELLED_EVENT : PRECHECK_FINISHED_EVENT);
}

export function deleteUpdatePlan(id: string) {
  writeUpdatePlans(readUpdatePlans().filter((run) => run.id !== id));
}

export function downloadUpdatePlanReport(run: AgenticUpdateRun) {
  const isExtension =
    run.triggerDomain === AGENTIC_RUN_TRIGGER_CLUSTER_EXTENSION ||
    run.triggerDomain === AGENTIC_RUN_TRIGGER_CLUSTER_EXTENSION_TROUBLESHOOT;
  const body = [
    isExtension ? `Cluster extension pre-check report` : `Update plan report`,
    `Name: ${run.id}`,
    isExtension ? `Extension: ${run.extensionName}` : `Target version: ${run.targetVersion}`,
    isExtension
      ? `Proposed version: ${run.proposedVersion ?? run.targetVersion}`
      : `Current version: ${CLUSTER_CURRENT_VERSION}`,
    isExtension && run.currentVersion ? `Installed version: ${run.currentVersion}` : null,
    isExtension && run.versionRange ? `Version range: ${run.versionRange}` : null,
    `Channel: ${run.channel}`,
    `Update type: ${run.updateType}`,
    `Phase: ${run.phase}`,
    `Status: ${run.status}`,
    `Generated: ${run.generatedAt}`,
    `Sandbox: ${run.sandbox}`,
    `Trigger domain: ${run.triggerDomain}`,
    "",
    "Selected option",
    run.selectedOption,
    "",
    isExtension ? "Extension readiness" : "Cluster readiness",
    isExtension ? clusterExtensionReadinessJson(run) : clusterReadinessJson(run),
    "",
    "Analysis logs",
    analysisLogLines(run),
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");
  const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${run.id}-report.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function useUpdatePlans(): AgenticUpdateRun[] {
  const [runs, setRuns] = useState(readUpdatePlans);

  useEffect(() => {
    const sync = () => setRuns(readUpdatePlans());
    window.addEventListener(UPDATE_PLANS_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(UPDATE_PLANS_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return runs;
}
