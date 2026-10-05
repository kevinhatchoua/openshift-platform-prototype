import type { CatalogOperator } from "../../pages/ecosystem/installedOperatorsTypes";
import { OLM_MODE_LABELS } from "../../contexts/OlmOperatingModeContext";

export type MigrationDryRunStatus = "pass" | "blocked";

export type MigrationDryRunRow = {
  operator: CatalogOperator;
  status: MigrationDryRunStatus;
  plannedAction: string;
  targetCatalog: string;
  summary: string;
};

/** Prototype stand-in for OCPSTRAT-2693 library dry run (scan + plan, no mutations). */
export function buildMigrationDryRunResults(operators: CatalogOperator[]): MigrationDryRunRow[] {
  return operators.map((op) => {
    const targetCatalog = `ClusterCatalog / ${op.source || "redhat-operators"}`;
    const plannedAction = `Transfer management to ${OLM_MODE_LABELS.nextgen} (cluster extension); keep bundle ${op.version}`;

    if (op.olmMigrationEligibility !== "eligible") {
      return {
        operator: op,
        status: "blocked",
        plannedAction: "No migration planned",
        targetCatalog: "—",
        summary:
          op.olmMigrationReason ??
          "Operator is not eligible for migration in this dry run scope.",
      };
    }

    return {
      operator: op,
      status: "pass",
      plannedAction,
      targetCatalog,
      summary:
        "Dry run succeeded. Execute will hand management to the Next-Gen catalog. Operands stay running; auto-rollback applies only if failure occurs before the point of no return.",
    };
  });
}

export async function simulateMigrationDryRun(
  operators: CatalogOperator[],
  delayMs = 900,
): Promise<MigrationDryRunRow[]> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
  return buildMigrationDryRunResults(operators);
}
