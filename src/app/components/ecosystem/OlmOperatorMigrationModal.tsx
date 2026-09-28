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

export type MigrationRunResult = import("../../pages/ecosystem/installedOperatorsTypes").OlmMigrationRunResult;

export type OperatorMigrationRow = {
  operator: CatalogOperator;
  result: MigrationRunResult;
  message: string;
};

type ModalPhase = "select" | "confirm" | "blocked";

const ELIGIBILITY_LABEL: Record<
  OlmMigrationEligibility,
  { text: string; color: "green" | "orange" | "blue" | "red" | "grey" }
> = {
  eligible: { text: "Eligible", color: "green" },
  ineligible: { text: "Ineligible", color: "grey" },
  migrated: { text: "Already migrated", color: "blue" },
  conflict: { text: "Conflict", color: "red" },
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

  const reset = () => {
    setSelected(new Set());
    setPhase("select");
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
    setBlockedOperator(null);
    setPhase("select");

    if (initialSelection && initialSelection.length > 0) {
      const eligible = initialSelection.filter((name) =>
        classicOperators.some(
          (row) => row.name === name && row.olmMigrationEligibility === "eligible",
        ),
      );
      setSelected(new Set(eligible));
      setPhase(eligible.length > 0 ? "confirm" : "select");
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

  const confirmAndStart = () => {
    if (selectedOperators.length === 0) {
      return;
    }
    onConfirmMigration(selectedOperators);
    handleClose();
  };

  const title =
    phase === "select"
      ? `Migrate operators to ${OLM_MODE_LABELS.nextgen}`
      : phase === "confirm"
        ? isSingleOperatorFlow
          ? `Migrate ${selectedOperators[0]?.name}?`
          : "Confirm bulk migration"
        : "Migration unavailable";

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
                Migration moves operator <strong>management</strong> from {OLM_MODE_LABELS.classic} to{" "}
                {OLM_MODE_LABELS.nextgen}. Bundle versions and operands are unchanged — only the catalog
                that manages the operator changes.
              </Content>
            </StackItem>
            <StackItem>
              <Alert variant="info" isInline title="Migration runs in the background">
                After you confirm, this dialog closes. Track progress in the{" "}
                <strong>Migration status</strong> column and toast notifications. You can keep working in
                the console while operators migrate.
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

        {phase === "confirm" && (
          <Stack hasGutter>
            <StackItem>
              <Content>
                {isSingleOperatorFlow ? (
                  <>
                    Migrate <strong>{selectedOperators[0]?.name}</strong> to {OLM_MODE_LABELS.nextgen}{" "}
                    management? The installed version stays at{" "}
                    <strong>{selectedOperators[0]?.version}</strong>.
                  </>
                ) : (
                  <>
                    Migrate <strong>{selectedOperators.length}</strong> eligible operators in this
                    cluster? Ineligible operators are not included. Failures roll back individually
                    without blocking successful operators in the same run.
                  </>
                )}
              </Content>
            </StackItem>
            {!isSingleOperatorFlow ? (
              <StackItem>
                <Content component="ul">
                  {selectedOperators.map((op) => (
                    <Content component="li" key={op.name}>
                      {op.name}
                    </Content>
                  ))}
                </Content>
              </StackItem>
            ) : null}
            <StackItem>
              <Content component="small">
                The table updates as each operator completes. Toast alerts summarize success, rollback,
                and errors.
              </Content>
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
            <Button
              variant="primary"
              isDisabled={selected.size === 0}
              onClick={() => setPhase("confirm")}
            >
              Review selection ({selected.size})
            </Button>
          </>
        )}
        {phase === "confirm" && (
          <>
            <Button variant="link" onClick={() => setPhase("select")}>
              Back
            </Button>
            <Button variant="primary" onClick={confirmAndStart}>
              {isSingleOperatorFlow ? "Migrate operator" : "Start migration"}
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
