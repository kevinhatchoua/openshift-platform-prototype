import type {
  CatalogOperator,
  OlmMigrationRunResult,
} from "../../pages/ecosystem/installedOperatorsTypes";
import { OLM_MODE_LABELS } from "../../contexts/OlmOperatingModeContext";
import { getMigrationBlockers } from "./olmMigrationEligibility";

export type MigrationRunResult = OlmMigrationRunResult;

export type MigrationRemediationAction = {
  label: string;
  href: string;
};

export type MigrationResultDetails = {
  headline: string;
  detail: string;
  autoRollbackApplied?: boolean;
  nextSteps: MigrationRemediationAction[];
};

function operatorBasePath(name: string): string {
  return `/ecosystem/installed-operators/${encodeURIComponent(name)}`;
}

export function getMigrationResultDetails(
  op: CatalogOperator,
  result: MigrationRunResult,
): MigrationResultDetails {
  const detailsHref = operatorBasePath(op.name);
  const updateHref = `${detailsHref}/update`;
  const subscriptionHref = `${detailsHref}/subscription`;

  if (result === "success") {
    return {
      headline: "Migration successful",
      detail:
        `${op.name} is now managed under ${OLM_MODE_LABELS.nextgen}. The operator bundle version (${op.version}) is unchanged; only the management catalog changed.`,
      nextSteps: [
        { label: `Review in ${OLM_MODE_LABELS.nextgen} tab`, href: detailsHref },
      ],
    };
  }

  if (result === "failed") {
    return {
      headline: "Migration failed — automatically rolled back",
      detail:
        op.olmMigrationReason ??
        `The migration library could not complete the OLMv0→OLMv1 handover. Management was restored to ${OLM_MODE_LABELS.classic}. Running workloads were not interrupted.`,
      autoRollbackApplied: true,
      nextSteps: [
        { label: "View operator details", href: detailsHref },
        ...(op.updateAvailable
          ? [{ label: `Update to ${op.updateAvailable}`, href: updateHref }]
          : []),
        { label: "Retry migration", href: detailsHref },
      ],
    };
  }

  if (result === "error") {
    return {
      headline: "Migration error",
      detail:
        op.olmMigrationReason ??
        "An unexpected error stopped migration before completion. No management change was applied.",
      nextSteps: [
        { label: "View operator details", href: detailsHref },
        { label: "Edit subscription", href: subscriptionHref },
      ],
    };
  }

  if (result === "incomplete") {
    return {
      headline: "Migration incomplete",
      detail:
        op.olmMigrationReason ??
        "Migration started but did not finish. Review operator conditions and migration logs before retrying.",
      nextSteps: [
        { label: "View operator details", href: detailsHref },
        { label: "Edit subscription", href: subscriptionHref },
      ],
    };
  }

  const blockers = getMigrationBlockers(op);
  return {
    headline: "Skipped",
    detail: blockers[0]?.description ?? "This operator was not migrated.",
    nextSteps: blockers[0]?.actionHref
      ? [{ label: blockers[0].actionLabel ?? "View details", href: blockers[0].actionHref! }]
      : [{ label: "View operator details", href: detailsHref }],
  };
}
