import { agenticRunPath } from "../../constants/agenticUpdateRuns";
import type { ApplicationRecord } from "./gitopsData";

/**
 * UI ↔ controller contract (GITOPS-11005 / Siddhesh). Prototype keys; confirm with controller before ship.
 */
export const GITOPS_AGENTIC_ANNOTATION_RUN_ID = "agentic.openshift.redhat.com/run-id";
export const GITOPS_AGENTIC_ANNOTATION_RUN_NAMESPACE = "agentic.openshift.redhat.com/run-namespace";

export const GITOPS_SEED_RUN_PAYMENTS_API = "gitops-sync-payments-api-seed";
export const GITOPS_SEED_RUN_LEGACY_BATCH = "gitops-sync-legacy-batch-seed";

export type ApplicationAgenticRef = {
  runId: string;
  runNamespace: string;
};

export function applicationAgenticRef(app: Pick<ApplicationRecord, "annotations">): ApplicationAgenticRef | null {
  const annotations = app.annotations;
  if (!annotations) return null;
  const runId = annotations[GITOPS_AGENTIC_ANNOTATION_RUN_ID]?.trim();
  const runNamespace = annotations[GITOPS_AGENTIC_ANNOTATION_RUN_NAMESPACE]?.trim();
  if (!runId || !runNamespace) return null;
  return { runId, runNamespace };
}

/** Controller published a remediation run for this Application. */
export function applicationHasAgenticRemediation(app: ApplicationRecord): boolean {
  return applicationAgenticRef(app) !== null;
}

export function formatAgenticAnnotations(app: ApplicationRecord): string[] {
  const ref = applicationAgenticRef(app);
  if (!ref) return [];
  return [
    `${GITOPS_AGENTIC_ANNOTATION_RUN_ID}=${ref.runId}`,
    `${GITOPS_AGENTIC_ANNOTATION_RUN_NAMESPACE}=${ref.runNamespace}`,
  ];
}

export function navigateToGitOpsAgenticRun(app: ApplicationRecord, navigate: (path: string) => void): boolean {
  const ref = applicationAgenticRef(app);
  if (!ref) return false;
  navigate(agenticRunPath(ref.runId));
  return true;
}
