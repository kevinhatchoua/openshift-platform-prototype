import type { CatalogOperator } from "../../pages/ecosystem/installedOperatorsTypes";
import { OLM_MODE_LABELS } from "../../contexts/OlmOperatingModeContext";

export type MigrationDryRunStatus = "pass" | "blocked";

export type MigrationDryRunDetail = {
  package: string;
  version: string;
  channel: string;
  cluster_object_set: string;
  cluster_extension: string;
  install_namespace: string;
  system_namespace: string;
  manual_approval: boolean;
  kind_counts: Record<string, number>;
  cleanup_actions: string[];
};

export type MigrationDryRunRow = {
  operator: CatalogOperator;
  status: MigrationDryRunStatus;
  plannedAction: string;
  targetCatalog: string;
  summary: string;
  detail?: MigrationDryRunDetail;
};

export type MigrationDryRunSimulationOptions = {
  delayMs?: number;
  /** Emits JSONL lines as the library would with `--output=jsonl`. */
  onLogLine?: (line: string) => void;
  onOperatorStart?: (operator: CatalogOperator) => void;
  onOperatorComplete?: (row: MigrationDryRunRow) => void;
};

const DEFAULT_KIND_COUNTS: Record<string, number> = {
  ClusterRole: 3,
  ClusterRoleBinding: 2,
  ConfigMap: 1,
  CustomResourceDefinition: 2,
  Deployment: 1,
  Role: 1,
  RoleBinding: 1,
  Secret: 2,
  Service: 1,
  ServiceAccount: 1,
};

function buildCleanupActions(op: CatalogOperator): string[] {
  const sub = `${op.namespace}/${op.name}`;
  const csv = `${op.namespace}/${op.name}.v${op.version}`;
  return [
    `Delete Subscription ${sub} with orphan propagation (operator workloads remain).`,
    `Delete ClusterServiceVersion ${csv} with orphan propagation (operator workloads remain).`,
    `Delete Operator CR ${op.name}.${op.namespace}.`,
    `Delete OperatorCondition ${csv} if present.`,
    `Delete copied ClusterServiceVersions derived from ${op.name}.v${op.version} if present, with orphan propagation.`,
    "Retain InstallPlan resources; conversion does not delete them.",
    "Retain OperatorGroups; --delete-operatorgroup was not specified.",
  ];
}

function buildDryRunDetail(op: CatalogOperator): MigrationDryRunDetail {
  const extension = op.name.replace(/-operator$/, "") || op.name;
  return {
    package: op.name,
    version: op.version,
    channel: op.channel,
    cluster_object_set: `${extension}-1`,
    cluster_extension: extension,
    install_namespace: op.namespace,
    system_namespace: "olmv1-system",
    manual_approval: false,
    kind_counts: { ...DEFAULT_KIND_COUNTS },
    cleanup_actions: buildCleanupActions(op),
  };
}

function emitLog(
  onLogLine: MigrationDryRunSimulationOptions["onLogLine"],
  payload: Record<string, unknown>,
) {
  onLogLine?.(JSON.stringify(payload));
}

/** Prototype stand-in for OCPSTRAT-2693 library dry run (scan + plan, no mutations). */
export function buildMigrationDryRunResults(operators: CatalogOperator[]): MigrationDryRunRow[] {
  return operators.map((op) => {
    const detail = buildDryRunDetail(op);
    const targetCatalog = `ClusterCatalog / operatorhubio (${op.source || "redhat-operators"})`;
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
      detail,
    };
  });
}

async function simulateOperatorDryRunLogs(
  op: CatalogOperator,
  onLogLine: MigrationDryRunSimulationOptions["onLogLine"],
  catalogDelayMs: number,
): Promise<void> {
  const catalog = op.source?.includes("community") ? "community-operators" : "operatorhubio";
  emitLog(onLogLine, {
    type: "progress",
    step: "catalog",
    status: "waiting",
    message: `Querying catalog ${catalog} for package ${op.name}@${op.version}...`,
  });
  await new Promise((resolve) => {
    window.setTimeout(resolve, catalogDelayMs);
  });

  if (op.olmMigrationEligibility !== "eligible") {
    emitLog(onLogLine, {
      type: "result",
      status: "failed",
      target: `${op.namespace}/${op.name}`,
      message: op.olmMigrationReason ?? "Operator is not eligible for migration.",
    });
    return;
  }

  const detail = buildDryRunDetail(op);
  emitLog(onLogLine, {
    type: "dry_run",
    target: `${op.namespace}/${op.name}`,
    ...detail,
  });
  await new Promise((resolve) => {
    window.setTimeout(resolve, 120);
  });
  emitLog(onLogLine, {
    type: "result",
    status: "completed",
    target: `${op.namespace}/${op.name}`,
  });
}

export async function simulateMigrationDryRun(
  operators: CatalogOperator[],
  options: MigrationDryRunSimulationOptions = {},
): Promise<MigrationDryRunRow[]> {
  const operatorCount = operators.length;
  const delayMs = options.delayMs ?? (operatorCount > 12 ? 180 : 400);
  const catalogDelayMs = operatorCount > 12 ? 90 : 280;
  const { onLogLine, onOperatorStart, onOperatorComplete } = options;

  if (operators.length > 0) {
    emitLog(onLogLine, {
      type: "progress",
      step: "profile",
      status: "started",
      message: "Profiling selected operators for OLMv0 → OLMv1 conversion (dry run).",
    });
  }

  await new Promise((resolve) => {
    window.setTimeout(resolve, delayMs);
  });

  for (const op of operators) {
    onOperatorStart?.(op);
    await simulateOperatorDryRunLogs(op, onLogLine, catalogDelayMs);
    onOperatorComplete?.(buildMigrationDryRunResults([op])[0]);
  }

  if (operators.length > 0) {
    emitLog(onLogLine, {
      type: "result",
      status: "completed",
      message: `Dry run finished for ${operators.length} operator${operators.length === 1 ? "" : "s"}.`,
    });
  }

  return buildMigrationDryRunResults(operators);
}
