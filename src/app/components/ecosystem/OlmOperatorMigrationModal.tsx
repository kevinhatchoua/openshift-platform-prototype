import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Content,
  Flex,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Progress,
  ProgressSize,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import type { CatalogOperator, OlmMigrationEligibility } from "../../pages/ecosystem/installedOperatorsTypes";
import {
  OlmMigrationBlockersPanel,
  OlmMigrationEligibilityDetailsPopover,
  getMigrationSummaryReason,
} from "./olmMigrationEligibility";

const ELIGIBILITY_LABEL: Record<
  OlmMigrationEligibility,
  { text: string; color: "green" | "orange" | "blue" | "red" | "grey" }
> = {
  eligible: { text: "Eligible", color: "green" },
  ineligible: { text: "Ineligible", color: "grey" },
  migrated: { text: "Already migrated", color: "blue" },
  conflict: { text: "Conflict", color: "red" },
};

export type MigrationRunResult = "success" | "failed" | "error" | "incomplete" | "skipped";

type OperatorMigrationRow = {
  operator: CatalogOperator;
  result: MigrationRunResult;
  message: string;
};

type ModalPhase = "select" | "confirm" | "progress" | "results" | "blocked";

type OlmOperatorMigrationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  operators: CatalogOperator[];
  /** Pre-select one operator (row kebab → Migrate). */
  initialOperatorName?: string | null;
  /** Pre-select multiple operators (bulk selection → Migrate). */
  initialSelection?: string[] | null;
};

function demoResultForOperator(op: CatalogOperator): MigrationRunResult {
  if (op.olmMigrationEligibility === "ineligible") return "skipped";
  if (op.olmMigrationEligibility === "conflict") return "error";
  if (op.olmMigrationEligibility === "migrated") return "skipped";
  if (op.olmMigrationDemoResult) return op.olmMigrationDemoResult;
  return "success";
}

function resultLabel(result: MigrationRunResult): { text: string; color: "green" | "red" | "orange" | "grey" | "blue" } {
  switch (result) {
    case "success":
      return { text: "Migration successful", color: "green" };
    case "failed":
      return { text: "Migration failed — rolled back", color: "red" };
    case "error":
      return { text: "Migration error", color: "red" };
    case "incomplete":
      return { text: "Migration incomplete", color: "orange" };
    default:
      return { text: "Skipped", color: "grey" };
  }
}

function resultMessage(op: CatalogOperator, result: MigrationRunResult): string {
  if (result === "success") {
    return `${op.name} is now managed by OLMv1. Switch to Operators mode to review.`;
  }
  if (result === "failed") {
    return op.olmMigrationReason ?? "Migration failed and the operator was rolled back to Classic management.";
  }
  if (result === "error") {
    return op.olmMigrationReason ?? "An unexpected error blocked migration.";
  }
  if (result === "incomplete") {
    return "Migration started but did not finish. Resolve dependencies and retry.";
  }
  return getMigrationSummaryReason(op);
}

export function OlmOperatorMigrationModal({
  isOpen,
  onClose,
  operators,
  initialOperatorName = null,
  initialSelection = null,
}: OlmOperatorMigrationModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<ModalPhase>("select");
  const [progressIndex, setProgressIndex] = useState(0);
  const [results, setResults] = useState<OperatorMigrationRow[]>([]);
  const [blockedOperator, setBlockedOperator] = useState<CatalogOperator | null>(null);

  const classicOperators = useMemo(
    () => operators.filter((op) => !op.isOlmV1Extension),
    [operators],
  );

  const migrationCandidates = useMemo(
    () => classicOperators.filter((op) => op.olmMigrationEligibility),
    [classicOperators],
  );

  const eligibleOperators = useMemo(
    () => migrationCandidates.filter((op) => op.olmMigrationEligibility === "eligible"),
    [migrationCandidates],
  );

  const selectedOperators = useMemo(
    () => eligibleOperators.filter((op) => selected.has(op.name)),
    [eligibleOperators, selected],
  );

  const reset = () => {
    setSelected(new Set());
    setPhase("select");
    setProgressIndex(0);
    setResults([]);
    setBlockedOperator(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelected(new Set());
    setProgressIndex(0);
    setResults([]);
    setBlockedOperator(null);
    setPhase("select");

    if (initialSelection && initialSelection.length >= 2) {
      const eligible = initialSelection.filter((name) =>
        classicOperators.some(
          (row) => row.name === name && row.olmMigrationEligibility === "eligible",
        ),
      );
      setSelected(new Set(eligible));
      setPhase(eligible.length >= 2 ? "confirm" : "select");
      return;
    }

    if (!initialOperatorName) {
      return;
    }

    const op = classicOperators.find((row) => row.name === initialOperatorName);
    if (!op) {
      return;
    }

    if (op.olmMigrationEligibility === "eligible") {
      setSelected(new Set([op.name]));
      setPhase("confirm");
      return;
    }

    setBlockedOperator(op);
    setPhase("blocked");
  }, [isOpen, initialOperatorName, initialSelection, classicOperators]);

  const toggleRow = (name: string, eligibility: OlmMigrationEligibility | undefined) => {
    if (eligibility !== "eligible") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const startMigration = () => {
    const targets = selectedOperators;
    if (targets.length === 0) {
      setPhase("results");
      setResults([]);
      return;
    }

    setPhase("progress");
    setProgressIndex(0);

    let i = 0;
    const timer = window.setInterval(() => {
      i += 1;
      setProgressIndex(i);
      if (i >= targets.length) {
        window.clearInterval(timer);
        const rows = targets.map((op) => {
          const result = demoResultForOperator(op);
          return {
            operator: op,
            result,
            message: resultMessage(op, result),
          };
        });
        setResults(rows);
        setPhase("results");
      }
    }, 650);
  };

  const successCount = results.filter((r) => r.result === "success").length;
  const failedCount = results.filter((r) => r.result === "failed" || r.result === "error").length;
  const incompleteCount = results.filter((r) => r.result === "incomplete").length;

  const title =
    phase === "select"
      ? "Migrate operators to Operators (OLMv1)"
      : phase === "confirm"
        ? "Confirm migration"
        : phase === "progress"
          ? "Migrating operators"
          : phase === "blocked"
            ? "Migration unavailable"
            : "Migration results";

  return (
    <Modal variant="medium" isOpen={isOpen} onClose={handleClose} aria-labelledby="olm-migration-title">
      <ModalHeader title={title} labelId="olm-migration-title" />
      <ModalBody>
        {phase === "blocked" && blockedOperator ? (
          <Stack hasGutter>
            <StackItem>
              <Alert
                variant={
                  blockedOperator.olmMigrationEligibility === "conflict" ? "danger" : "warning"
                }
                isInline
                title={`${blockedOperator.name} cannot be migrated`}
              >
                {getMigrationSummaryReason(blockedOperator)}
              </Alert>
            </StackItem>
            <StackItem>
              <OlmMigrationBlockersPanel operator={blockedOperator} />
            </StackItem>
          </Stack>
        ) : null}

        {phase === "select" && (
          <Stack hasGutter>
            <StackItem>
              <Content>
                Migration moves operator <strong>management</strong> from Operators (Legacy) to Operators (OLMv1).
                Running workloads are not interrupted. Bundle versions do not change.
              </Content>
            </StackItem>
            <StackItem>
              <Alert variant="info" isInline title="Post-success rollback is under evaluation">
                Failed operators roll back automatically during bulk migration. Manual rollback after success is TBD
                (OCPSTRAT-2692).
              </Alert>
            </StackItem>
            <StackItem isFilled>
              <Table aria-label="Operator migration eligibility" variant="compact">
                <Thead>
                  <Tr>
                    <Th screenReaderText="Select operator" />
                    <Th>Operator</Th>
                    <Th>Status</Th>
                    <Th>Reason</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {migrationCandidates.map((op) => {
                    const eligibility = op.olmMigrationEligibility ?? "ineligible";
                    const meta = ELIGIBILITY_LABEL[eligibility];
                    const canSelect = eligibility === "eligible";
                    return (
                      <Tr key={op.name}>
                        <Td>
                          <Checkbox
                            id={`migrate-${op.name}`}
                            isChecked={selected.has(op.name)}
                            isDisabled={!canSelect}
                            onChange={() => toggleRow(op.name, op.olmMigrationEligibility)}
                            aria-label={`Select ${op.name} for migration`}
                          />
                        </Td>
                        <Td dataLabel="Operator">{op.name}</Td>
                        <Td dataLabel="Status">
                          <Label color={meta.color} isCompact>{meta.text}</Label>
                        </Td>
                        <Td dataLabel="Reason">
                          {eligibility === "eligible" ? (
                            "Ready to migrate"
                          ) : (
                            <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                              <Content component="small">{getMigrationSummaryReason(op)}</Content>
                              <OlmMigrationEligibilityDetailsPopover operator={op} />
                            </Flex>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </StackItem>
          </Stack>
        )}

        {phase === "confirm" && (
          <Content>
            Migrate <strong>{selectedOperators.length}</strong> eligible operator
            {selectedOperators.length === 1 ? "" : "s"} to Operators (OLMv1) management? Ineligible operators are
            skipped.
          </Content>
        )}

        {phase === "progress" && (
          <Stack hasGutter>
            <StackItem>
              <Progress
                value={(progressIndex / Math.max(selectedOperators.length, 1)) * 100}
                title={`Migrating ${progressIndex} of ${selectedOperators.length}`}
                size={ProgressSize.sm}
              />
            </StackItem>
            <StackItem>
              <Content component="small">
                {selectedOperators[Math.min(progressIndex, selectedOperators.length - 1)]?.name ?? "—"}
              </Content>
            </StackItem>
          </Stack>
        )}

        {phase === "results" && (
          <Stack hasGutter>
            <StackItem>
              <Flex gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
                {successCount > 0 ? (
                  <Label color="green" isCompact>{successCount} successful</Label>
                ) : null}
                {failedCount > 0 ? (
                  <Label color="red" isCompact>{failedCount} failed</Label>
                ) : null}
                {incompleteCount > 0 ? (
                  <Label color="orange" isCompact>{incompleteCount} incomplete</Label>
                ) : null}
              </Flex>
            </StackItem>
            {results.length === 0 ? (
              <StackItem>
                <Alert variant="warning" isInline title="No operators migrated">
                  Select at least one eligible operator to migrate.
                </Alert>
              </StackItem>
            ) : (
              results.map((row) => {
                const meta = resultLabel(row.result);
                return (
                  <StackItem key={row.operator.name}>
                    <Alert
                      variant={
                        row.result === "success"
                          ? "success"
                          : row.result === "incomplete"
                            ? "warning"
                            : row.result === "skipped"
                              ? "info"
                              : "danger"
                      }
                      isInline
                      title={`${row.operator.name} — ${meta.text}`}
                    >
                      {row.message}
                      {row.result === "incomplete" || row.result === "failed" ? (
                        <div className="pf-v6-u-mt-sm">
                          <Button variant="link" isInline onClick={() => setPhase("select")}>
                            Review issues and retry
                          </Button>
                        </div>
                      ) : null}
                    </Alert>
                  </StackItem>
                );
              })
            )}
          </Stack>
        )}
      </ModalBody>
      <ModalFooter>
        {phase === "select" && (
          <>
            <Button variant="link" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" isDisabled={selected.size === 0} onClick={() => setPhase("confirm")}>
              Review selection ({selected.size})
            </Button>
          </>
        )}
        {phase === "confirm" && (
          <>
            <Button variant="link" onClick={() => setPhase("select")}>Back</Button>
            <Button variant="primary" onClick={startMigration}>Migrate</Button>
          </>
        )}
        {phase === "progress" && (
          <Button variant="primary" isDisabled>
            Migrating…
          </Button>
        )}
        {(phase === "results" || phase === "blocked") && (
          <>
            {phase === "results" && failedCount + incompleteCount > 0 ? (
              <Button variant="secondary" onClick={() => setPhase("select")}>
                Migrate more
              </Button>
            ) : null}
            <Button variant="primary" onClick={handleClose}>Close</Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
