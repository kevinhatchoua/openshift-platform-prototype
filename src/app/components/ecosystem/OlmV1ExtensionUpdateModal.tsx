import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Content,
  Flex,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Progress,
  ProgressSize,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import type { CatalogOperator } from "../../pages/ecosystem/installedOperatorsTypes";

type OlmV1ExtensionUpdateModalProps = {
  operator: CatalogOperator | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (operator: CatalogOperator, newVersion: string) => void;
};

type ModalPhase = "confirm" | "progress" | "complete";

const UPDATE_PROGRESS_STEPS = [
  "Applying cluster extension update…",
  "Updating controller workloads…",
  "Reconciling managed resources…",
  "Verifying extension health…",
];

export function OlmV1ExtensionUpdateModal({
  operator,
  isOpen,
  onClose,
  onComplete,
}: OlmV1ExtensionUpdateModalProps) {
  const [phase, setPhase] = useState<ModalPhase>("confirm");
  const [acknowledged, setAcknowledged] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

  const targetVersion = operator?.updateAvailable ?? "";

  useEffect(() => {
    if (!isOpen) {
      setPhase("confirm");
      setAcknowledged(false);
      setProgressStep(0);
    }
  }, [isOpen, operator?.name]);

  if (!operator || !targetVersion) {
    return null;
  }

  const canSubmit = acknowledged && phase === "confirm";

  const handleSubmit = () => {
    if (!canSubmit) return;
    setPhase("progress");
    setProgressStep(0);

    const interval = window.setInterval(() => {
      setProgressStep((prev) => {
        if (prev >= UPDATE_PROGRESS_STEPS.length - 1) {
          window.clearInterval(interval);
          setPhase("complete");
          onComplete?.(operator, targetVersion);
          return prev;
        }
        return prev + 1;
      });
    }, 1100);
  };

  return (
    <Modal
      variant="medium"
      isOpen={isOpen}
      onClose={phase === "progress" ? () => undefined : onClose}
      aria-labelledby="olm-v1-update-title"
      aria-describedby="olm-v1-update-body"
    >
      <ModalHeader
        title={
          <span id="olm-v1-update-title">
            {phase === "complete" ? "Update complete" : "Update cluster extension"}
          </span>
        }
      />
      <ModalBody id="olm-v1-update-body">
        {phase === "confirm" ? (
          <Stack hasGutter>
            <StackItem>
              <Alert variant="info" title="Single-target update" isInline>
                This prototype models a basic OLMv1 update (OCPSTRAT-2620 Goal 2). Update
                availability paths and release notes are out of scope (OCPSTRAT-3761 / 3762).
              </Alert>
            </StackItem>
            <StackItem>
              <Content component="dl" className="pf-v6-c-description-list pf-m-horizontal">
                <Content component="dt">Extension</Content>
                <Content component="dd">{operator.name}</Content>
                <Content component="dt">Current version</Content>
                <Content component="dd">{operator.version}</Content>
                <Content component="dt">Target version</Content>
                <Content component="dd">{targetVersion}</Content>
                <Content component="dt">Channel</Content>
                <Content component="dd">{operator.channel}</Content>
              </Content>
            </StackItem>
            <StackItem>
              <Checkbox
                id="olm-v1-update-ack"
                label="I understand this update may restart controller pods and reconcile managed resources."
                isChecked={acknowledged}
                onChange={(_event, checked) => setAcknowledged(checked)}
              />
            </StackItem>
          </Stack>
        ) : null}

        {phase === "progress" ? (
          <Stack hasGutter>
            <StackItem>
              <Progress
                value={(progressStep / (UPDATE_PROGRESS_STEPS.length - 1)) * 100}
                size={ProgressSize.sm}
              />
            </StackItem>
            <StackItem>
              {UPDATE_PROGRESS_STEPS.map((step, index) => (
                <Flex key={step} gap={{ default: "gapSm" }} className="pf-v6-u-mb-xs">
                  <Content component="small" className={index <= progressStep ? undefined : "pf-v6-u-color-200"}>
                    {index <= progressStep ? "✓" : "○"} {step}
                  </Content>
                </Flex>
              ))}
            </StackItem>
          </Stack>
        ) : null}

        {phase === "complete" ? (
          <Alert
            variant="success"
            title={`${operator.name} updated to ${targetVersion}.`}
            isInline
          />
        ) : null}
      </ModalBody>
      <ModalFooter>
        {phase === "confirm" ? (
          <>
            <Button key="cancel" variant="link" onClick={onClose}>
              Cancel
            </Button>
            <Button key="submit" variant="primary" isDisabled={!canSubmit} onClick={handleSubmit}>
              Approve update
            </Button>
          </>
        ) : null}
        {phase === "complete" ? (
          <Button key="done" variant="primary" onClick={onClose}>
            Close
          </Button>
        ) : null}
      </ModalFooter>
    </Modal>
  );
}
