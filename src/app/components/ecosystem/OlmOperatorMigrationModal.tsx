import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Alert,
  Button,
  Checkbox,
  Content,
  ExpandableSection,
  Flex,
  FormGroup,
  Label,
  Title,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Spinner,
  Stack,
  StackItem,
  Wizard,
  WizardFooter,
  WizardFooterWrapper,
  WizardHeader,
  WizardStep,
  useWizardContext,
} from "@patternfly/react-core";
import type { WizardStepType } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import { OLM_MODE_LABELS } from "../../contexts/OlmOperatingModeContext";
import type { CatalogOperator, OlmMigrationEligibility } from "../../pages/ecosystem/installedOperatorsTypes";
import {
  OlmMigrationBlockersPanel,
  OlmMigrationEligibilityDetailsPopover,
  getMigrationSummaryReason,
} from "./olmMigrationEligibility";
import {
  type MigrationDryRunDetail,
  type MigrationDryRunRow,
  simulateMigrationDryRun,
} from "./olmMigrationDryRun";

export type MigrationRunResult = import("../../pages/ecosystem/installedOperatorsTypes").OlmMigrationRunResult;

export type OperatorMigrationRow = {
  operator: CatalogOperator;
  result: MigrationRunResult;
  message: string;
};

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

type DryRunOperatorPhase = "idle" | "pending" | "running" | "complete";

const STEP_SELECT = "migrate-select";
const STEP_DRY_RUN = "migrate-dry-run";
const STEP_REVIEW = "migrate-review";

function downloadMigrationDryRunDebugLog(lines: string[]): void {
  if (lines.length === 0) {
    return;
  }
  const stamp = new Date().toISOString().replace(/:/g, "-");
  const blob = new Blob([`${lines.join("\n")}\n`], {
    type: "application/x-ndjson;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `olm-migration-dry-run-${stamp}.jsonl`;
  anchor.click();
  URL.revokeObjectURL(url);
}

type OlmOperatorMigrationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  operators: CatalogOperator[];
  /** Called when user confirms; modal closes and migration continues on the list. */
  onConfirmMigration: (targets: CatalogOperator[]) => void;
  initialOperatorName?: string | null;
  initialSelection?: string[] | null;
};

type MigrationWizardFooterProps = {
  selectedCount: number;
  dryRunLoading: boolean;
  dryRunPassCount: number;
  selectedOperatorCount: number;
  canExecute: boolean;
  isSingleOperatorFlow: boolean;
  onRunDryRun: () => void;
  onRunDryRunAgain: () => void;
  dryRunHasRun: boolean;
  /** Selection came from the list; dry run is the first wizard step (no Back). */
  skipSelectStep: boolean;
};

function MigrationDryRunStatusCell({
  phase,
  dryRow,
}: {
  phase: DryRunOperatorPhase;
  dryRow?: MigrationDryRunRow;
}) {
  if (phase === "running") {
    return (
      <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
        <Spinner size="sm" aria-label="Running dry run" />
        <Content component="small">Running</Content>
      </Flex>
    );
  }
  if (phase === "pending") {
    return (
      <Label color="grey" isCompact>
        Pending
      </Label>
    );
  }
  if (dryRow) {
    const meta = DRY_RUN_LABEL[dryRow.status];
    return (
      <Label color={meta.color} isCompact>
        {meta.text}
      </Label>
    );
  }
  return (
    <Content component="small" className="pf-v6-u-color-200">
      Not started
    </Content>
  );
}

function MigrationDryRunOperatorsTable({
  operators,
  dryRunRows,
  operatorPhases,
  showPlanColumns,
}: {
  operators: CatalogOperator[];
  dryRunRows: MigrationDryRunRow[];
  operatorPhases: Record<string, DryRunOperatorPhase>;
  showPlanColumns: boolean;
}) {
  const rowByName = useMemo(
    () => new Map(dryRunRows.map((row) => [row.operator.name, row])),
    [dryRunRows],
  );

  return (
    <Table
      aria-label="Migration dry run operators"
      variant="compact"
      className="ocs-olm-migration-dry-run-table"
    >
      <Thead>
        <Tr>
          <Th scope="col">Operator</Th>
          <Th scope="col">Package</Th>
          <Th scope="col">Version</Th>
          <Th scope="col">Channel</Th>
          <Th scope="col">Install namespace</Th>
          <Th scope="col">Dry run</Th>
          {showPlanColumns ? <Th scope="col">Planned action</Th> : null}
          {showPlanColumns ? <Th scope="col">Target catalog</Th> : null}
        </Tr>
      </Thead>
      <Tbody>
        {operators.map((op) => {
          const dryRow = rowByName.get(op.name);
          const phase = operatorPhases[op.name] ?? "idle";
          return (
            <Tr key={op.name}>
              <Td dataLabel="Operator">{op.name}</Td>
              <Td dataLabel="Package">{op.name}</Td>
              <Td dataLabel="Version">{op.version}</Td>
              <Td dataLabel="Channel">{op.channel}</Td>
              <Td dataLabel="Install namespace">{op.namespace}</Td>
              <Td dataLabel="Dry run">
                <MigrationDryRunStatusCell phase={phase} dryRow={dryRow} />
              </Td>
              {showPlanColumns ? (
                <Td dataLabel="Planned action">
                  {dryRow ? (
                    <Content component="small">{dryRow.plannedAction}</Content>
                  ) : (
                    "—"
                  )}
                </Td>
              ) : null}
              {showPlanColumns ? (
                <Td dataLabel="Target catalog">
                  {dryRow ? (
                    <Content component="small">{dryRow.targetCatalog}</Content>
                  ) : (
                    "—"
                  )}
                </Td>
              ) : null}
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
}

function MigrationDryRunResourceSummary({ detail }: { detail: MigrationDryRunDetail }) {
  const kinds = Object.entries(detail.kind_counts).sort(([a], [b]) => a.localeCompare(b));
  return (
    <Table aria-label="Resources included in dry run plan" variant="compact">
      <Thead>
        <Tr>
          <Th scope="col">Kind</Th>
          <Th scope="col">Count</Th>
        </Tr>
      </Thead>
      <Tbody>
        {kinds.map(([kind, count]) => (
          <Tr key={kind}>
            <Td dataLabel="Kind">{kind}</Td>
            <Td dataLabel="Count">{count}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}

function MigrationWizardFooter({
  selectedCount,
  dryRunLoading,
  dryRunPassCount,
  selectedOperatorCount,
  canExecute,
  isSingleOperatorFlow,
  onRunDryRun,
  onRunDryRunAgain,
  dryRunHasRun,
  skipSelectStep,
}: MigrationWizardFooterProps) {
  const { activeStep, goToNextStep, goToPrevStep, close } = useWizardContext();

  if (activeStep?.id === STEP_SELECT) {
    return (
      <WizardFooter
        activeStep={activeStep}
        onNext={goToNextStep}
        onBack={goToPrevStep}
        onClose={close}
        isBackHidden
        nextButtonText="Next"
        isNextDisabled={selectedCount === 0}
        cancelButtonText="Cancel"
      />
    );
  }

  if (activeStep?.id === STEP_DRY_RUN) {
    const dryRunComplete =
      !dryRunLoading && dryRunPassCount > 0 && dryRunPassCount === selectedOperatorCount;

    return (
      <WizardFooterWrapper>
        <ActionList>
          <ActionListGroup>
            {!skipSelectStep ? (
              <ActionListItem>
                <Button variant="secondary" onClick={goToPrevStep}>
                  Back
                </Button>
              </ActionListItem>
            ) : null}
            {!dryRunHasRun ? (
              <ActionListItem>
                <Button
                  variant="primary"
                  onClick={onRunDryRun}
                  isDisabled={dryRunLoading || selectedOperatorCount === 0}
                  isLoading={dryRunLoading}
                >
                  Run dry run
                </Button>
              </ActionListItem>
            ) : (
              <ActionListItem>
                <Button
                  variant="secondary"
                  onClick={onRunDryRunAgain}
                  isDisabled={dryRunLoading || selectedOperatorCount === 0}
                  isLoading={dryRunLoading}
                >
                  Rerun
                </Button>
              </ActionListItem>
            )}
            <ActionListItem>
              <Button variant="primary" onClick={goToNextStep} isDisabled={!dryRunComplete}>
                Review and execute migration
              </Button>
            </ActionListItem>
            <ActionListItem>
              <Button variant="link" onClick={close}>
                Cancel
              </Button>
            </ActionListItem>
          </ActionListGroup>
        </ActionList>
      </WizardFooterWrapper>
    );
  }

  if (activeStep?.id === STEP_REVIEW) {
    return (
      <WizardFooter
        activeStep={activeStep}
        onNext={goToNextStep}
        onBack={goToPrevStep}
        onClose={close}
        isCancelHidden
        nextButtonText={
          isSingleOperatorFlow ? "Start migration" : `Start migration (${dryRunPassCount})`
        }
        isNextDisabled={!canExecute}
        nextButtonProps={{
          variant: "danger",
          ...(canExecute ? {} : { "aria-describedby": "olm-migration-execute-prereq" }),
        }}
      />
    );
  }

  return null;
}

function resolvePreselectedOperatorNames(
  classicOperators: CatalogOperator[],
  initialSelection: string[] | null | undefined,
  initialOperatorName: string | null | undefined,
): string[] {
  if (initialSelection && initialSelection.length > 0) {
    return initialSelection.filter((name) =>
      classicOperators.some(
        (row) => row.name === name && row.olmMigrationEligibility === "eligible",
      ),
    );
  }
  if (initialOperatorName) {
    const op = classicOperators.find((row) => row.name === initialOperatorName);
    if (op?.olmMigrationEligibility === "eligible") {
      return [op.name];
    }
  }
  return [];
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
  const [blockedOperator, setBlockedOperator] = useState<CatalogOperator | null>(null);
  const [wizardSessionKey, setWizardSessionKey] = useState(0);
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [dryRunHasRun, setDryRunHasRun] = useState(false);
  const [dryRunRows, setDryRunRows] = useState<MigrationDryRunRow[]>([]);
  const [dryRunLogLines, setDryRunLogLines] = useState<string[]>([]);
  const [dryRunOperatorPhases, setDryRunOperatorPhases] = useState<Record<string, DryRunOperatorPhase>>(
    {},
  );
  const [ackReviewedDryRun, setAckReviewedDryRun] = useState(false);
  const [ackPonr, setAckPonr] = useState(false);
  const [ackBackup, setAckBackup] = useState(false);
  /** List/bulk/single-row migrate: skip re-selecting operators in the wizard. */
  const [skipSelectStep, setSkipSelectStep] = useState(false);
  const [activeWizardStepId, setActiveWizardStepId] = useState<string | undefined>(undefined);

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
  const dryRunComplete =
    dryRunPassCount > 0 && dryRunPassCount === selectedOperators.length && !dryRunLoading;
  const canExecute =
    ackReviewedDryRun &&
    ackPonr &&
    ackBackup &&
    dryRunComplete;

  const executeBlockers: string[] = [];
  if (!ackReviewedDryRun) {
    executeBlockers.push("Confirm you reviewed the dry run results.");
  }
  if (!ackPonr) {
    executeBlockers.push("Confirm you understand point-of-no-return and manual recovery risks.");
  }
  if (!ackBackup) {
    executeBlockers.push("Confirm you have an appropriate cluster backup or recovery plan.");
  }
  if (!dryRunComplete) {
    executeBlockers.push("Complete a successful dry run for all selected operators.");
  }

  const wizardStepCount = skipSelectStep ? 2 : 3;
  const reviewAcknowledgmentsIncomplete = !ackReviewedDryRun || !ackPonr || !ackBackup;

  const wizardHeaderTitle = useMemo(() => {
    if (activeWizardStepId === STEP_REVIEW && isSingleOperatorFlow && selectedOperators[0]) {
      return `Execute migration for ${selectedOperators[0].name}?`;
    }
    return `Migrate operators to ${OLM_MODE_LABELS.nextgen}`;
  }, [activeWizardStepId, isSingleOperatorFlow, selectedOperators]);

  const wizardHeaderDescription = useMemo(() => {
    if (activeWizardStepId === STEP_SELECT) {
      return `Step 1 of ${wizardStepCount} — Select operators to migrate`;
    }
    if (activeWizardStepId === STEP_DRY_RUN) {
      const stepIndex = skipSelectStep ? 1 : 2;
      return `Step ${stepIndex} of ${wizardStepCount} — Run migration dry run`;
    }
    if (activeWizardStepId === STEP_REVIEW) {
      return `Step ${wizardStepCount} of ${wizardStepCount} — Review and execute`;
    }
    if (skipSelectStep) {
      return "Dry run and review migration for the operators you selected on the list. Bundle versions stay the same; only the managing catalog changes.";
    }
    return "Move operator management to Next-Gen Operators without changing bundle versions. Dry run first, then review before execute.";
  }, [activeWizardStepId, skipSelectStep, wizardStepCount]);

  const reset = () => {
    setSelected(new Set());
    setBlockedOperator(null);
    setDryRunLoading(false);
    setDryRunHasRun(false);
    setDryRunRows([]);
    setDryRunLogLines([]);
    setDryRunOperatorPhases({});
    setAckReviewedDryRun(false);
    setAckPonr(false);
    setAckBackup(false);
    setSkipSelectStep(false);
    setActiveWizardStepId(undefined);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const runDryRun = useCallback(async (targets: CatalogOperator[]) => {
    setDryRunLoading(true);
    setDryRunRows([]);
    setDryRunLogLines([]);
    setDryRunOperatorPhases(
      Object.fromEntries(targets.map((op) => [op.name, "pending" as DryRunOperatorPhase])),
    );
    try {
      const rows = await simulateMigrationDryRun(targets, {
        onLogLine: (line) => {
          setDryRunLogLines((prev) => [...prev, line]);
        },
        onOperatorStart: (op) => {
          setDryRunOperatorPhases((prev) => ({ ...prev, [op.name]: "running" }));
        },
        onOperatorComplete: (row) => {
          setDryRunRows((prev) => {
            const rest = prev.filter((item) => item.operator.name !== row.operator.name);
            return [...rest, row];
          });
          setDryRunOperatorPhases((prev) => ({ ...prev, [row.operator.name]: "complete" }));
        },
      });
      setDryRunRows(rows);
      setDryRunHasRun(true);
    } finally {
      setDryRunLoading(false);
    }
  }, []);

  const runDryRunLaunch = useCallback(() => {
    void runDryRun(selectedOperators);
  }, [runDryRun, selectedOperators]);

  const runDryRunAgain = useCallback(() => {
    void runDryRun(selectedOperators);
  }, [runDryRun, selectedOperators]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset();

    const preselected = resolvePreselectedOperatorNames(
      classicOperators,
      initialSelection,
      initialOperatorName,
    );

    if (preselected.length > 0) {
      setSelected(new Set(preselected));
      setSkipSelectStep(true);
      setActiveWizardStepId(STEP_DRY_RUN);
      setWizardSessionKey((key) => key + 1);
      return;
    }

    setSkipSelectStep(false);
    setActiveWizardStepId(STEP_SELECT);

    if (!initialOperatorName) {
      setWizardSessionKey((key) => key + 1);
      return;
    }

    const op = classicOperators.find((row) => row.name === initialOperatorName);
    if (!op) {
      setWizardSessionKey((key) => key + 1);
      return;
    }

    setBlockedOperator(op);
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

  const confirmAndStart = () => {
    if (!canExecute) {
      return;
    }
    onConfirmMigration(selectedOperators);
    handleClose();
  };

  const handleWizardStepChange = (
    _event: MouseEvent<HTMLButtonElement>,
    newStep: WizardStepType,
  ) => {
    setActiveWizardStepId(newStep?.id ? String(newStep.id) : undefined);
  };

  const wizardFooter = (
    <MigrationWizardFooter
      selectedCount={selected.size}
      dryRunLoading={dryRunLoading}
      dryRunPassCount={dryRunPassCount}
      selectedOperatorCount={selectedOperators.length}
      canExecute={canExecute}
      isSingleOperatorFlow={isSingleOperatorFlow}
      onRunDryRun={runDryRunLaunch}
      onRunDryRunAgain={runDryRunAgain}
      dryRunHasRun={dryRunHasRun}
      skipSelectStep={skipSelectStep}
    />
  );

  if (isOpen && blockedOperator) {
    return (
      <Modal
        className="ocs-olm-migration-modal"
        variant={ModalVariant.medium}
        isOpen={isOpen}
        onClose={handleClose}
        aria-labelledby="olm-migration-blocked-title"
      >
        <ModalHeader title="Migration unavailable" labelId="olm-migration-blocked-title" />
        <ModalBody>
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
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={handleClose}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal
      className="ocs-olm-migration-modal ocs-olm-migration-modal--wizard"
      variant={ModalVariant.large}
      isOpen={isOpen}
      onEscapePress={handleClose}
      width="min(76rem, 96vw)"
      maxWidth="96vw"
      aria-labelledby="olm-migration-title"
      aria-describedby="olm-migration-modal-desc"
    >
      <Wizard
        key={`${wizardSessionKey}-${skipSelectStep ? "preselected" : "select"}`}
        className="ocs-olm-migration-wizard"
        navAriaLabel="Migration steps"
        isVisitRequired
        shouldFocusContent
        onClose={handleClose}
        onSave={confirmAndStart}
        onStepChange={handleWizardStepChange}
        header={
          <WizardHeader
            title={wizardHeaderTitle}
            onClose={handleClose}
            titleId="olm-migration-title"
            description={wizardHeaderDescription}
            descriptionId="olm-migration-modal-desc"
            closeButtonAriaLabel="Close migration wizard"
          />
        }
        footer={wizardFooter}
      >
        {!skipSelectStep ? (
          <WizardStep name="Select operators" id={STEP_SELECT}>
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
              <StackItem>
                <Table
                  aria-label="Operator migration eligibility"
                  variant="compact"
                  className="ocs-olm-migration-eligibility-table"
                >
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
          </WizardStep>
        ) : null}

        <WizardStep name="Run migration dry run" id={STEP_DRY_RUN}>
          <Stack hasGutter>
            <StackItem>
              <Title headingLevel="h3" size="md">
                What is a dry run?
              </Title>
              <Content>
                A dry run calls the migration library with <strong>--dry-run</strong> and{" "}
                <strong>--output=jsonl</strong>. It profiles each operator, resolves the target{" "}
                {OLM_MODE_LABELS.nextgen} catalog, and returns a read-only plan: resource counts, planned
                cleanup actions, and catalog targets. The cluster is not modified.
              </Content>
            </StackItem>
            <StackItem aria-live="polite" aria-busy={dryRunLoading}>
              <MigrationDryRunOperatorsTable
                operators={selectedOperators}
                dryRunRows={dryRunRows}
                operatorPhases={dryRunOperatorPhases}
                showPlanColumns={dryRunLoading || dryRunHasRun}
              />
            </StackItem>
            {dryRunHasRun && !dryRunLoading ? (
              <StackItem>
                <Content>
                  {dryRunPassCount} of {selectedOperators.length} operator
                  {selectedOperators.length === 1 ? "" : "s"} passed dry run and can proceed to execute.
                </Content>
              </StackItem>
            ) : null}
            {dryRunHasRun && !dryRunLoading ? (
              <>
                {dryRunRows
                  .filter((row) => row.detail)
                  .map((row) => (
                    <StackItem key={`${row.operator.name}-detail`}>
                      <ExpandableSection
                        toggleText={`Dry run details for ${row.operator.name}`}
                        isIndented
                      >
                        <Stack hasGutter>
                          <StackItem>
                            <Content component="small">
                              ClusterObjectSet: {row.detail?.cluster_object_set}; ClusterExtension:{" "}
                              {row.detail?.cluster_extension}; system namespace:{" "}
                              {row.detail?.system_namespace}
                            </Content>
                          </StackItem>
                          <StackItem>
                            <MigrationDryRunResourceSummary detail={row.detail!} />
                          </StackItem>
                          <StackItem>
                            <Title headingLevel="h4" size="md">
                              Planned cleanup actions
                            </Title>
                            <ul className="ocs-olm-migration-modal__operator-list">
                              {row.detail?.cleanup_actions.map((action) => (
                                <li key={action}>{action}</li>
                              ))}
                            </ul>
                          </StackItem>
                          <StackItem>
                            <Content component="small">{row.summary}</Content>
                          </StackItem>
                        </Stack>
                      </ExpandableSection>
                    </StackItem>
                  ))}
              </>
            ) : null}
            {(dryRunLoading || dryRunLogLines.length > 0) && (
              <StackItem>
                <Flex
                  justifyContent={{ default: "justifyContentSpaceBetween" }}
                  alignItems={{ default: "alignItemsCenter" }}
                  className="ocs-olm-migration-dry-run-log__header"
                >
                  <Title headingLevel="h4" size="md">
                    Dry run log
                  </Title>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<DownloadIcon aria-hidden />}
                    isDisabled={dryRunLogLines.length === 0}
                    onClick={() => downloadMigrationDryRunDebugLog(dryRunLogLines)}
                  >
                    Download debug logs
                  </Button>
                </Flex>
                <Content component="small">
                  JSONL output from <code>migrate-operators-v0-to-v1 --output=jsonl … --dry-run</code>
                </Content>
                <pre className="ocs-olm-migration-dry-run-log" aria-label="Migration dry run JSONL log">
                  {dryRunLogLines.length > 0
                    ? dryRunLogLines.join("\n")
                    : "Waiting for library output…"}
                </pre>
              </StackItem>
            )}
          </Stack>
        </WizardStep>

        <WizardStep name="Review and execute" id={STEP_REVIEW}>
          <Stack hasGutter>
            <StackItem>
              <Alert variant="warning" isInline title="Point of no return">
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
            {reviewAcknowledgmentsIncomplete ? (
              <StackItem>
                <Alert
                  variant="warning"
                  isInline
                  title="Complete required acknowledgments to enable Start migration"
                  id="olm-migration-execute-prereq"
                >
                  <ul className="ocs-olm-migration-modal__prereq-list">
                    {!ackReviewedDryRun ? (
                      <li>Confirm you reviewed the dry run results.</li>
                    ) : null}
                    {!ackPonr ? (
                      <li>
                        Confirm you understand point-of-no-return and manual recovery risks.
                      </li>
                    ) : null}
                    {!ackBackup ? (
                      <li>Confirm you have an appropriate cluster backup or recovery plan.</li>
                    ) : null}
                  </ul>
                </Alert>
              </StackItem>
            ) : null}
            <StackItem>
              {isSingleOperatorFlow && selectedOperators[0] ? (
                <Content>
                  {selectedOperators[0].name} — bundle stays at {selectedOperators[0].version}
                </Content>
              ) : (
                <ul className="ocs-olm-migration-modal__operator-list">
                  {selectedOperators.map((op) => (
                    <li key={op.name}>
                      {op.name} — bundle stays at {op.version}
                    </li>
                  ))}
                </ul>
              )}
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
                      label="I have an appropriate cluster backup or recovery plan."
                      isChecked={ackBackup}
                      onChange={(_e, checked) => setAckBackup(checked)}
                    />
                  </StackItem>
                </Stack>
              </FormGroup>
            </StackItem>
          </Stack>
        </WizardStep>
      </Wizard>
    </Modal>
  );
}
