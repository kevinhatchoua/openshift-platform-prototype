import type { CatalogOperator, OlmMigrationRunResult } from "../../pages/ecosystem/installedOperatorsTypes";
import type { OlmMigrationScenario } from "../../contexts/PrototypeDemoContext";
import { getMigrationResultDetails } from "./olmMigrationRemediations";
import type { OperatorMigrationRow } from "./OlmOperatorMigrationModal";

export function resolveMigrationDemoResult(
  op: CatalogOperator,
  scenario: OlmMigrationScenario,
): OlmMigrationRunResult {
  if (scenario === "interactive" || scenario.startsWith("preview-dry-run-")) {
    if (op.olmMigrationEligibility === "ineligible") return "skipped";
    if (op.olmMigrationEligibility === "conflict") return "error";
    if (op.olmMigrationEligibility === "migrated") return "skipped";
    if (op.olmMigrationDemoResult) return op.olmMigrationDemoResult;
    return "success";
  }

  if (op.olmMigrationEligibility !== "eligible") {
    return "skipped";
  }

  if (scenario === "preview-success") {
    return "success";
  }

  if (scenario === "preview-failed-rollback") {
    if (op.name === "Kiali Operator") return "failed";
    if (op.name === "Cert Manager") return "failed_ponr";
    return "success";
  }

  if (scenario === "preview-errors") {
    if (op.name === "Cert Manager") return "failed_ponr";
    if (op.name === "Kiali Operator") return "error";
    return "success";
  }

  return "success";
}

export function buildPreviewMigrationResults(
  scenario: Exclude<OlmMigrationScenario, "interactive">,
  operators: CatalogOperator[],
): OperatorMigrationRow[] {
  const eligible = operators.filter(
    (op) => !op.isOlmV1Extension && op.olmMigrationEligibility === "eligible",
  );

  const sample =
    scenario === "preview-success"
      ? eligible.slice(0, 3)
      : eligible.filter((op) =>
          ["Elasticsearch Operator", "Kiali Operator", "Cert Manager"].includes(op.name),
        );

  return sample.map((op) => {
    const result = resolveMigrationDemoResult(op, scenario);
    const details = getMigrationResultDetails(op, result);
    return {
      operator: op,
      result,
      message: details.detail,
    };
  });
}
