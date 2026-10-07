import type { OlmMigrationScenario } from "../../contexts/PrototypeDemoContext";
import type { CatalogOperator } from "../../pages/ecosystem/installedOperatorsTypes";
import {
  buildMigrationDryRunResults,
  type MigrationDryRunRow,
} from "./olmMigrationDryRun";

export type DryRunPreviewScenario = "preview-dry-run-all-pass" | "preview-dry-run-bulk-blocked";

export function isDryRunPreviewScenario(
  scenario: OlmMigrationScenario,
): scenario is DryRunPreviewScenario {
  return scenario === "preview-dry-run-all-pass" || scenario === "preview-dry-run-bulk-blocked";
}

const BLOCKED_OPERATOR_NAMES = new Set(["Cert Manager", "Kiali Operator"]);

function blockDryRunRow(row: MigrationDryRunRow, reason: string): MigrationDryRunRow {
  return {
    ...row,
    status: "blocked",
    plannedAction: "No migration planned",
    targetCatalog: "—",
    summary: reason,
    detail: undefined,
  };
}

export function buildDryRunScenarioRows(
  scenario: DryRunPreviewScenario,
  operators: CatalogOperator[],
): MigrationDryRunRow[] {
  const base = buildMigrationDryRunResults(operators);

  if (scenario === "preview-dry-run-all-pass") {
    return base.map((row) => ({ ...row, status: "pass" }));
  }

  return base.map((row) => {
    if (BLOCKED_OPERATOR_NAMES.has(row.operator.name)) {
      return blockDryRunRow(
        row,
        row.operator.olmMigrationReason ??
          "Dry run blocked: catalog handover preflight failed for this operator. Resolve blockers or remove it from the batch.",
      );
    }
    return { ...row, status: "pass" };
  });
}

export async function simulateDryRunScenario(
  scenario: DryRunPreviewScenario,
  operators: CatalogOperator[],
  options: {
    onLogLine?: (line: string) => void;
    onOperatorStart?: (operator: CatalogOperator) => void;
    onOperatorComplete?: (row: MigrationDryRunRow) => void;
  },
): Promise<MigrationDryRunRow[]> {
  const emit = (payload: Record<string, unknown>) => {
    options.onLogLine?.(JSON.stringify(payload));
  };

  emit({
    type: "progress",
    step: "profile",
    status: "started",
    message: `[scenario:${scenario}] Profiling selected operators (prototype mock).`,
  });

  await new Promise((resolve) => {
    window.setTimeout(resolve, 320);
  });

  const rows = buildDryRunScenarioRows(scenario, operators);

  for (const op of operators) {
    options.onOperatorStart?.(op);
    await new Promise((resolve) => {
      window.setTimeout(resolve, 120);
    });
    const row = rows.find((item) => item.operator.name === op.name)!;
    if (row.status === "pass" && row.detail) {
      emit({
        type: "dry_run",
        target: `${op.namespace}/${op.name}`,
        ...row.detail,
      });
    } else {
      emit({
        type: "result",
        status: "failed",
        target: `${op.namespace}/${op.name}`,
        message: row.summary,
      });
    }
    options.onOperatorComplete?.(row);
  }

  emit({
    type: "result",
    status: rows.every((row) => row.status === "pass") ? "completed" : "failed",
    message: `Dry run finished for ${operators.length} operator${operators.length === 1 ? "" : "s"}.`,
  });

  return rows;
}
