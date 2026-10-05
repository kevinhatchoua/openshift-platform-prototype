import type {
  CatalogOperator,
  OlmMigrationActivityStatus,
  OlmMigrationRunResult,
} from "../../pages/ecosystem/installedOperatorsTypes";
import type { OlmMigrationScenario } from "../../contexts/PrototypeDemoContext";
import { OLM_MODE_LABELS } from "../../contexts/OlmOperatingModeContext";
import type { ToastInput } from "../../contexts/ToastContext";
import { getMigrationResultDetails } from "./olmMigrationRemediations";
import { resolveMigrationDemoResult } from "./olmMigrationScenarioPreview";
import type { OperatorMigrationRow } from "./OlmOperatorMigrationModal";

export type { OlmMigrationActivityStatus };

export function migrationActivityFromResult(result: OlmMigrationRunResult): OlmMigrationActivityStatus | undefined {
  switch (result) {
    case "success":
      return "succeeded";
    case "failed":
      return "failed_rollback";
    case "failed_ponr":
      return "failed_manual";
    case "error":
      return "error";
    case "incomplete":
      return "incomplete";
    default:
      return undefined;
  }
}

export function migrationActivityLabel(status: OlmMigrationActivityStatus | undefined): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "migrating":
      return "Migrating";
    case "succeeded":
      return "Migrated";
    case "failed_rollback":
      return "Failed (rolled back)";
    case "failed_manual":
      return "Failed (manual action required)";
    case "error":
      return "Error";
    case "incomplete":
      return "Incomplete";
    default:
      return "—";
  }
}

export function toastForMigrationResult(op: CatalogOperator, result: OlmMigrationRunResult): ToastInput {
  const details = getMigrationResultDetails(op, result);
  switch (result) {
    case "success":
      return {
        variant: "success",
        title: `${op.name} migrated to ${OLM_MODE_LABELS.nextgen}. Bundle version unchanged (${op.version}).`,
      };
    case "failed":
      return {
        variant: "danger",
        title: `${op.name}: migration failed — automatically rolled back to ${OLM_MODE_LABELS.classic}.`,
      };
    case "failed_ponr":
      return {
        variant: "danger",
        title: `${op.name}: migration failed after point of no return — manual recovery may be required.`,
      };
    case "error":
      return {
        variant: "danger",
        title: `${op.name}: migration error — ${details.headline}`,
      };
    case "incomplete":
      return {
        variant: "warning",
        title: `${op.name}: migration incomplete — review operator before retry.`,
      };
    default:
      return { variant: "info", title: `${op.name}: migration skipped.` };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export type MigrationRunCallbacks = {
  onQueued: (operatorNames: string[]) => void;
  onMigrating: (operatorName: string) => void;
  onComplete: (row: OperatorMigrationRow) => void;
  onRunFinished?: (rows: OperatorMigrationRow[]) => void;
};

export async function runOlmMigrationInBackground(
  targets: CatalogOperator[],
  scenario: OlmMigrationScenario,
  callbacks: MigrationRunCallbacks,
  options?: { stepDelayMs?: number },
): Promise<OperatorMigrationRow[]> {
  const delay = options?.stepDelayMs ?? 1200;
  const names = targets.map((op) => op.name);
  callbacks.onQueued(names);

  const rows: OperatorMigrationRow[] = [];

  for (const op of targets) {
    callbacks.onMigrating(op.name);
    await sleep(delay);

    const result = resolveMigrationDemoResult(op, scenario);
    const details = getMigrationResultDetails(op, result);
    const row: OperatorMigrationRow = {
      operator: op,
      result,
      message: details.detail,
    };
    rows.push(row);
    callbacks.onComplete(row);
  }

  callbacks.onRunFinished?.(rows);
  return rows;
}
