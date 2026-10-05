import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Content,
  Flex,
  Label,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OLM_MODE_LABELS } from "../../contexts/OlmOperatingModeContext";
import type { CatalogOperator, OlmMigrationEligibility } from "../../pages/ecosystem/installedOperatorsTypes";
import {
  OlmMigrationBlockersPanel,
  OlmMigrationEligibilityDetailsPopover,
  getMigrationSummaryReason,
} from "./olmMigrationEligibility";
import {
  type MigrationDryRunRow,
  simulateMigrationDryRun,
} from "./olmMigrationDryRun";

export type MigrationRunResult = import("../../pages/ecosystem/installedOperatorsTypes").OlmMigrationRunResult;

export type OperatorMigrationRow = {
  operator: CatalogOperator;
  result: MigrationRunResult;
  message: string;
};

type ModalPhase = "select" | "dryRun" | "review" | "blocked";

const ELIGIBILITY_LABEL: Record<
  OlmMigrationEligibility,
  { text: string; color: "green" | "orange" | "blue" | "red" | "grey" }
> = {
  eligible: { text: "Eligible", color: "green" },
  ineligible: { text: "Ineligible", color: "grey" },
  migrated: { text: "Already migrated", color: "blue" },
  conflict: { text: "Conflict", color: "red" },
};

const DRY_RUN_LABEL: Record<MigrationDryRunRow["status"], { text: string; color: "green" | "red" }> = {
  pass: { text: "Pass", color: "green" },
  blocked: { text: "Blocked", color: "red" },
};

type OlmOperatorMigrationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  operators: CatalogOperator[];
  /** Called when user confirms; modal closes and migration continues on the list. */
  onConfirmMigration: (targets: CatalogOperator[]) => void;
  initialOperatorName?: string | null;
  initialSelection?: string[] | null;
};

function stepHint(phase: ModalPhase): string | null {
  switch (phase) {
    case "select":
      return "Step 1 of 3 — Select operators";
    case "dryRun":
      return "Step 2 of 3 — Dry run (no changes)";
    case "review":
      return "Step 3 of 3 — Review and execute (point of no return)";
    default:
      return null;
  }
}

export function OlmOperatorMigrationModal({
  isOpen,
  onClose,
  operators,
  onConfirmMigration,
  initialOperatorName = null,
  initialSelection = null,
}: OlmOperatorMigrationModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<ModalPhase>("select");
  const [blockedOperator, setBlockedOperator] = useState<CatalogOperator | null>(null);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [dryRunRows, setDryRunRows] = useState<MigrationDryRunRow[]>([]);
  const [ackReviewedDryRun, setAckReviewedDryRun] = useState(false);
  const [ackPonr, setAckPonr] = useState(false);
  const [ackBackup, setAckBackup] = useState(false);

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

  const isSingleOperatorFlow = selectedOperators.length === 1;
  const dryRunPassCount = dryRunRows.filter((row) => row.status === "pass").length;
  const canExecute =
    ackReviewedDryRun &&
    ackPonr &&
    dryRunPassCount > 0 &&
    dryRunPassCount === selectedOperators.length;

  const executeBlockers: string[] = [];
  if (!ackReviewedDryRun) {
    executeBlockers.push("Confirm you reviewed the dry run results.");
  }
  if (!ackPonr) {
    executeBlockers.push("Confirm you understand point-of-no-return and manual recovery risks.");
  }
  if (dryRunPassCount !== selectedOperators.length || dryRunPassCount === 0) {
    executeBlockers.push("Complete a successful dry run for all selected operators.");
  }

  const reset = () => {
    setSelected(new Set());
    setPhase("select");
    setBlockedOperator(null);
    setDryRunLoading(false);
    setDryRunRows([]);
    setAckReviewedDryRun(false);
    setAckPonr(false);
    setAckBackup(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const runDryRun = useCallback(async (targets: CatalogOperator[]) => {
    setDryRunLoading(true);
    setDryRunRows([]);
    try {
      const rows = await simulateMigrationDryRun(targets);
      setDryRunRows(rows);
    } finally {
      setDryRunLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelected(new Set());
    setPhase("select");
    setBlockedOperator(null);
    setDryRunLoading(false);
    setDryRunRows([]);
    setAckReviewedDryRun(false);
    setAckPonr(false);
    setAckBackup(false);

    if (initialSelection && initialSelection.length > 0) {
      const eligible = initialSelection.filter((name) =>
        classicOperators.some(
          (row) => row.name === name && row.olmMigrationEligibility === "eligible",
        ),
      );
      setSelected(new Set(eligible));
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
      return;
    }

    setBlockedOperator(op);
    setPhase("blocked");
  }, [isOpen, initialOperatorName, initialSelection, classicOperators]);

  useEffect(() => {
    if (phase === "dryRun" && selectedOperators.length > 0 && dryRunRows.length === 0 && !dryRunLoading) {
      void runDryRun(selectedOperators);
    }
  }, [phase, selectedOperators, dryRunRows.length, dryRunLoading, runDryRun]);

  const toggleRow = (name: string, eligibility: OlmMigrationEligibility | undefined) => {
    if (eligibility !== "eligible") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const goToDryRun = () => {
    setDryRunRows([]);
    setAckReviewedDryRun(false);
    setAckPonr(false);
    setAckBackup(false);
    setPhase("dryRun");
  };

  const confirmAndStart = () => {
    if (!canExecute) {
      return;
    }
    onConfirmMigration(selectedOperators);
    handleClose();
  };

  const title =
    phase === "select"
      ? `Migrate operators to ${OLM_MODE_LABELS.nextgen}`
      : phase === "dryRun"
        ? "Dry run migration plan"
        : phase === "review"
          ? isSingleOperatorFlow
            ? `Execute migration for ${selectedOperators[0]?.name}?`
            : "Execute bulk migration"
          : "Migration unavailable";

  const step = stepHint(phase);

  return (
    <Modal
      className="ocs-olm-migration-modal"
      variant="medium"
      isOpen={isOpen}
      onClose={handleClose}
      aria-labelledby="olm-migration-title"
      aria-describedby="olm-migration-modal-desc"
    >
      <ModalHeader title={title} labelId="olm-migration-title" description={step ?? undefined} />
      <ModalBody id="olm-migration-modal-desc">
        {step ? (
          <p id="olm-migration-step-desc" className="pf-v6-u-screen-reader">
            {step}
          </p>
        ) : null}
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
                Migration moves operator <strong>management</strong> from {OLM_MODE_LABELS.classic} to{" "}
                {OLM_MODE_LABELS.nextgen}. Bundle versions and operands are unchanged — only the catalog
                that manages the operator changes.
              </Content>
            </StackItem>
            <StackItem>
              <Alert variant="info" isInline title="Three-step wizard">
                You will run a dry run (read-only), review results, then execute. Migration runs in the
                background after execute; track the <strong>Migration status</strong> column and toasts.
              </Alert>
            </StackItem>
            <StackItem>
              <Content component="small">
                Out of initial scope: catalog-source migration, namespace deletion in UI, operators with
                OLMv1 dependency constraints (filtered below).
              </Content>
            </StackItem>
            <StackItem isFilled>
              <Table aria-label="Operator migration eligibility" variant="compact">
                <Thead>
                  <Tr>
                    <Th screenReaderText="Select operator" />
                    <Th scope="col">Operator</Th>
                    <Th scope="col">Status</Th>
                    <Th scope="col">Reason</Th>
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
                          <Label color={meta.color} isCompact>
                            {meta.text}
                          </Label>
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

        {phase === "dryRun" && (
          <Stack hasGutter>
            <StackItem>
              <Alert variant="info" isInline title="Dry run does not change the cluster">
                The migration library scans selected operators and returns a plan. Failures here do not
                mutate the cluster.
              </Alert>
            </StackItem>
            <StackItem aria-live="polite" aria-busy={dryRunLoading}>
              {dryRunLoading ? (
                <Flex
                  direction={{ default: "column" }}
                  alignItems={{ default: "alignItemsCenter" }}
                  gap={{ default: "gapMd" }}
                >
                  <Spinner size="lg" aria-label="Running dry run" />
                  <Content component="small">Scanning operators and validating catalog targets…</Content>
                </Flex>
              ) : (
                <Stack hasGutter>
                  <StackItem>
                    <Content>
                      {dryRunPassCount} of {selectedOperators.length} operator
                      {selectedOperators.length === 1 ? "" : "s"} passed dry run and can proceed to execute.
                    </Content>
                  </StackItem>
                  <StackItem isFilled>
                    <Table aria-label="Migration dry run results" variant="compact">
                      <Thead>
                        <Tr>
                          <Th scope="col">Operator</Th>
                          <Th scope="col">Dry run</Th>
                          <Th scope="col">Planned action</Th>
                          <Th scope="col">Target catalog</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {dryRunRows.map((row) => {
                          const meta = DRY_RUN_LABEL[row.status];
                          return (
                            <Tr key={row.operator.name}>
                              <Td dataLabel="Operator">{row.operator.name}</Td>
                              <Td dataLabel="Dry run">
                                <Label color={meta.color} isCompact>
                                  {meta.text}
                                </Label>
                              </Td>
                              <Td dataLabel="Planned action">
                                <Content component="small">{row.plannedAction}</Content>
                              </Td>
                              <Td dataLabel="Target catalog">
                                <Content component="small">{row.targetCatalog}</Content>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </StackItem>
                  {dryRunRows.map((row) => (
                    <StackItem key={`${row.operator.name}-summary`}>
                      <Content component="small">
                        <strong>{row.operator.name}:</strong> {row.summary}
                      </Content>
                    </StackItem>
                  ))}
                </Stack>
              )}
            </StackItem>
          </Stack>
        )}

        {phase === "review" && (
          <Stack hasGutter>
            <StackItem>
              <Alert variant="danger" isInline title="Point of no return">
                When you start migration, the cluster begins irreversible steps for each operator. The
                migration library can <strong>automatically roll back</strong> only if failure occurs{" "}
                <strong>before</strong> the point of no return. After that,{" "}
                <strong>manual recovery</strong> may be required; custom resources tied to removed CRDs can
                be lost without a backup.
              </Alert>
            </StackItem>
            <StackItem>
              <Alert variant="info" isInline title="After migration starts">
                This dialog closes when you start migration. Track progress in the{" "}
                <strong>Migration status</strong> column. Failures before the point of no return appear as{" "}
                <strong>Failed (rolled back)</strong>. Failures after the point of no return appear as{" "}
                <strong>Failed (manual action required)</strong>.
              </Alert>
            </StackItem>
            {!canExecute && executeBlockers.length > 0 ? (
              <StackItem>
                <Alert
                  variant="warning"
                  isInline
                  title="Complete required acknowledgments to enable Start migration"
                  id="olm-migration-execute-prereq"
                >
                  <ul className="ocs-olm-migration-modal__prereq-list">
                    {executeBlockers.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </Alert>
              </StackItem>
            ) : null}
            <StackItem>
              <ul className="ocs-olm-migration-modal__operator-list">
                {selectedOperators.map((op) => (
                  <li key={op.name}>
                    {op.name} — bundle stays at {op.version}
                  </li>
                ))}
              </ul>
            </StackItem>
            <StackItem>
              <FormGroup label="Required acknowledgments" isRequired fieldId="olm-migration-ack-group">
                <Stack hasGutter>
                  <StackItem>
                    <Checkbox
                      id="olm-migrate-ack-dry-run"
                      label="I reviewed the dry run results for the selected operators."
                      isChecked={ackReviewedDryRun}
                      onChange={(_e, checked) => setAckReviewedDryRun(checked)}
                    />
                  </StackItem>
                  <StackItem>
                    <Checkbox
                      id="olm-migrate-ack-ponr"
                      label="I understand that failures after the point of no return require manual intervention and that automatic rollback may not apply."
                      isChecked={ackPonr}
                      onChange={(_e, checked) => setAckPonr(checked)}
                    />
                  </StackItem>
                  <StackItem>
                    <Checkbox
                      id="olm-migrate-ack-backup"
                      label="I have an appropriate cluster backup or recovery plan (recommended for production)."
                      isChecked={ackBackup}
                      onChange={(_e, checked) => setAckBackup(checked)}
                    />
                  </StackItem>
                </Stack>
              </FormGroup>
            </StackItem>
          </Stack>
        )}
      </ModalBody>
      <ModalFooter>
        {phase === "select" && (
          <>
            <Button variant="link" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" isDisabled={selected.size === 0} onClick={goToDryRun}>
              Next: Dry run ({selected.size})
            </Button>
          </>
        )}
        {phase === "dryRun" && (
          <>
            <Button variant="secondary" onClick={() => setPhase("select")}>
              Back
            </Button>
            <Button
              variant="link"
              onClick={() => void runDryRun(selectedOperators)}
              isDisabled={dryRunLoading || selectedOperators.length === 0}
            >
              Run dry run again
            </Button>
            <Button
              variant="primary"
              isDisabled={
                dryRunLoading || dryRunPassCount === 0 || dryRunPassCount !== selectedOperators.length
              }
              onClick={() => setPhase("review")}
            >
              Next: Review and execute
            </Button>
          </>
        )}
        {phase === "review" && (
          <>
            <Button variant="secondary" onClick={() => setPhase("dryRun")}>
              Back
            </Button>
            <Button
              variant="danger"
              isDisabled={!canExecute}
              aria-describedby={
                !canExecute ? "olm-migration-execute-prereq" : undefined
              }
              onClick={confirmAndStart}
            >
              {isSingleOperatorFlow ? "Start migration" : `Start migration (${dryRunPassCount})`}
            </Button>
          </>
        )}
        {phase === "blocked" && (
          <Button variant="primary" onClick={handleClose}>
            Close
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
