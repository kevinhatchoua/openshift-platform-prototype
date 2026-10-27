import type { ApplicationRecord, GitOpsHealth } from "../pages/gitops/gitopsData";
import {
  finishGitOpsRolloutDiagnoseRun,
  finishGitOpsSyncTroubleshootRun,
  startGitOpsRolloutDiagnoseRun,
  startGitOpsSyncTroubleshootRun,
} from "./updatePlansStore";

export type GitOpsAiLaunchers = {
  launchSyncTroubleshoot: (app: { name: string; ns: string; sync: string; health: string; errorSummary: string }) => string;
  launchRolloutDiagnose: (rollout: { name: string; ns: string; health: string; strategy: string; errorSummary: string }) => string;
  launchFleetAssessment: () => void;
};

const SYNC_FINISH_MS = 3400;
const ROLLOUT_FINISH_MS = 3800;

export function createGitOpsAiLaunchers(deps: {
  clearMessages: () => void;
  setContext: (ctx: string) => void;
  setIsOpen: (open: boolean) => void;
}): GitOpsAiLaunchers {
  const activeSyncRef = { current: null as string | null };
  const activeRolloutRef = { current: null as string | null };
  const syncTimerRef = { current: undefined as number | undefined };
  const rolloutTimerRef = { current: undefined as number | undefined };

  const launchSyncTroubleshoot: GitOpsAiLaunchers["launchSyncTroubleshoot"] = (app) => {
    deps.clearMessages();
    const run = startGitOpsSyncTroubleshootRun({
      applicationName: app.name,
      namespace: app.ns,
      syncStatus: app.sync,
      healthStatus: app.health,
      errorSummary: app.errorSummary,
    });
    activeSyncRef.current = run.id;
    deps.setContext(`ols-gitops-sync-troubleshoot:${run.id}`);
    deps.setIsOpen(true);
    if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => {
      if (activeSyncRef.current !== run.id) return;
      finishGitOpsSyncTroubleshootRun(run.id, "completed");
      activeSyncRef.current = null;
    }, SYNC_FINISH_MS);
    return run.id;
  };

  const launchRolloutDiagnose: GitOpsAiLaunchers["launchRolloutDiagnose"] = (rollout) => {
    deps.clearMessages();
    const run = startGitOpsRolloutDiagnoseRun({
      rolloutName: rollout.name,
      namespace: rollout.ns,
      healthStatus: rollout.health,
      strategy: rollout.strategy,
      errorSummary: rollout.errorSummary,
    });
    activeRolloutRef.current = run.id;
    deps.setContext(`ols-gitops-rollout-diagnose:${run.id}`);
    deps.setIsOpen(true);
    if (rolloutTimerRef.current) window.clearTimeout(rolloutTimerRef.current);
    rolloutTimerRef.current = window.setTimeout(() => {
      if (activeRolloutRef.current !== run.id) return;
      finishGitOpsRolloutDiagnoseRun(run.id, "completed");
      activeRolloutRef.current = null;
    }, ROLLOUT_FINISH_MS);
    return run.id;
  };

  const launchFleetAssessment = () => {
    deps.clearMessages();
    deps.setContext("ols-gitops-fleet-assess");
    deps.setIsOpen(true);
  };

  return { launchSyncTroubleshoot, launchRolloutDiagnose, launchFleetAssessment };
}

/** Whether an application is in a state where AI troubleshooting adds value. */
export function applicationNeedsAiTroubleshoot(app: { sync: string; health: string }): boolean {
  if (app.sync === "OutOfSync") return true;
  if (app.health === "Degraded" || app.health === "Aborting") return true;
  return false;
}

/** Whether a rollout is in a state where AI diagnosis adds value. */
export function rolloutNeedsAiDiagnose(health: GitOpsHealth): boolean {
  return health === "Degraded" || health === "Aborting";
}
