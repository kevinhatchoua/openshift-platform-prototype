import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Content,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  StackItem,
  TextInput,
} from "@patternfly/react-core";
import type { CatalogOperator } from "../../pages/ecosystem/installedOperatorsTypes";
import { OLM_MODE_LABELS } from "../../contexts/OlmOperatingModeContext";

type RollbackPhase = "warn" | "confirm";

type OlmOperatorRollbackModalProps = {
  operator: CatalogOperator | null;
  isOpen: boolean;
  onClose: () => void;
  onRollbackConfirmed: (operatorName: string) => void;
};

export function OlmOperatorRollbackModal({
  operator,
  isOpen,
  onClose,
  onRollbackConfirmed,
}: OlmOperatorRollbackModalProps) {
  const [phase, setPhase] = useState<RollbackPhase>("warn");
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setPhase("warn");
      setAcknowledged(false);
      setConfirmName("");
    }
  }, [isOpen]);

  if (!operator) {
    return null;
  }

  const nameMatches = confirmName.trim() === operator.name;
  const canConfirmRollback = acknowledged && nameMatches;

  const handleClose = () => {
    setPhase("warn");
    setAcknowledged(false);
    setConfirmName("");
    onClose();
  };

  return (
    <Modal
      variant="medium"
      isOpen={isOpen}
      onClose={handleClose}
      aria-labelledby="olm-rollback-title"
    >
      <ModalHeader
        title={
          phase === "warn"
            ? `Roll back ${operator.name} to ${OLM_MODE_LABELS.classic}?`
            : "Confirm rollback"
        }
        labelId="olm-rollback-title"
      />
      <ModalBody>
        {phase === "warn" ? (
          <Stack hasGutter>
            <StackItem>
              <Alert variant="warning" isInline title="Manual rollback moves management only">
                Rollback returns operator management from {OLM_MODE_LABELS.nextgen} to{" "}
                {OLM_MODE_LABELS.classic}.
                The installed bundle version ({operator.version}) does not change. Running workloads
                should remain available, but expect a brief management handover.
              </Alert>
            </StackItem>
            <StackItem>
              <Content component="ul">
                <Content component="li">Use when migration succeeded but the wrong operator was moved.</Content>
                <Content component="li">Not a substitute for fixing operand or subscription issues.</Content>
                <Content component="li">Failed migrations during bulk runs roll back automatically — no manual step.</Content>
              </Content>
            </StackItem>
          </Stack>
        ) : (
          <Stack hasGutter>
            <StackItem>
              <Alert variant="danger" isInline title="This action cannot be undone from the console">
                Confirm you want to roll back <strong>{operator.name}</strong> to Classic management.
              </Alert>
            </StackItem>
            <StackItem>
              <Checkbox
                id="olm-rollback-ack"
                label={`I understand management will return to ${OLM_MODE_LABELS.classic} and I may need to migrate again later.`}
                isChecked={acknowledged}
                onChange={(_e, checked) => setAcknowledged(checked)}
              />
            </StackItem>
            <StackItem>
              <FormGroup label={`Type ${operator.name} to confirm`} isRequired>
                <TextInput
                  id="olm-rollback-confirm-name"
                  value={confirmName}
                  onChange={(_e, value) => setConfirmName(value)}
                  aria-label={`Confirm operator name ${operator.name}`}
                />
              </FormGroup>
            </StackItem>
          </Stack>
        )}
      </ModalBody>
      <ModalFooter>
        {phase === "warn" ? (
          <>
            <Button variant="link" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setPhase("confirm")}>
              Continue
            </Button>
          </>
        ) : (
          <>
            <Button variant="link" onClick={() => setPhase("warn")}>
              Back
            </Button>
            <Button
              variant="danger"
              isDisabled={!canConfirmRollback}
              onClick={() => {
                onRollbackConfirmed(operator.name);
                handleClose();
              }}
            >
              Roll back operator
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
