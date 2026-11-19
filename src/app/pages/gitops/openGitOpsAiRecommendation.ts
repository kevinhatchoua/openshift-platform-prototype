import { getAgenticUpdateRun } from "../../constants/agenticUpdateRuns";
import {
  applicationAgenticRef,
  navigateToGitOpsAgenticRun,
  type ApplicationAgenticRef,
} from "./gitopsAgenticContract";
import type { ApplicationRecord } from "./gitopsData";
import type { GitOpsAiHandoff } from "../../contexts/PrototypeDemoContext";

export type GitOpsAiRecommendationDeps = {
  navigate: (path: string) => void;
  clearMessages: () => void;
  setContext: (context: string) => void;
  setIsOpen: (open: boolean) => void;
};

function lightspeedContextForApp(app: ApplicationRecord, ref: ApplicationAgenticRef): string {
  const run = getAgenticUpdateRun(ref.runId);
  if (run?.attentionSummary) {
    return `ols-gitops-sync-troubleshoot:${ref.runId}`;
  }
  if (app.sync === "OutOfSync") {
    return `ols-gitops-sync-troubleshoot:${ref.runId}`;
  }
  return `ols-gitops-health-remediation:${app.ns}:${app.name}`;
}

/** Primary GITOPS-11005 CTA — Agentic run details by default; optional OLS-first for field captures. */
export function openGitOpsAiRecommendation(
  app: ApplicationRecord,
  handoff: GitOpsAiHandoff,
  deps: GitOpsAiRecommendationDeps,
): boolean {
  const ref = applicationAgenticRef(app);
  if (!ref) return false;

  if (handoff === "lightspeed") {
    deps.clearMessages();
    deps.setContext(lightspeedContextForApp(app, ref));
    deps.setIsOpen(true);
    return true;
  }

  return navigateToGitOpsAgenticRun(app, deps.navigate);
}