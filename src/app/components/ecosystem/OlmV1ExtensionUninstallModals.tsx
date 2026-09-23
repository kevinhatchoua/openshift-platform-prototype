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
  TextInput,
} from "@patternfly/react-core";
import type { CatalogOperator } from "../../pages/ecosystem/installedOperatorsTypes";

type UninstallModalKind = "unsubscribe" | "delete";

type OlmV1ExtensionUninstallModalsProps = {
  operator: CatalogOperator | null;
  kind: UninstallModalKind | null;
  onClose: () => void;
};

type ModalPhase = "confirm" | "progress" | "complete";

const DELETE_PROGRESS_STEPS = [
  "Removing cluster extension…",
  "Deleting managed custom resources…",
  "Cleaning up operator workloads…",
  "Finalizing cascading deletions…",
];

export function OlmV1ExtensionUninstallModals({
  operator,
  kind,
  onClose,
}: OlmV1ExtensionUninstallModalsProps) {
  const [phase, setPhase] = useState<ModalPhase>("confirm");
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [progressStep, setProgressStep] = useState(0);

  const isOpen = Boolean(operator && kind);

  useEffect(() => {
    if (!isOpen) {
      setPhase("confirm");
      setAcknowledged(false);
      setConfirmName("");
      setProgressStep(0);
    }
  }, [isOpen, operator?.name, kind]);

  if (!operator || !kind) {
    return null;
  }

  const requiresNameConfirm = kind === "delete";
  const nameMatches = confirmName.trim() === operator.name;
  const canSubmit =
    acknowledged && (!requiresNameConfirm || nameMatches) && phase === "confirm";

  const handleSubmit = () => {
    if (!canSubmit) return;
    setPhase("progress");
    setProgressStep(0);

    const interval = window.setInterval(() => {
      setProgressStep((prev) => {
        if (prev >= DELETE_PROGRESS_STEPS.length - 1) {
          window.clearInterval(interval);
          setPhase("complete");
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
  };

  const title =
    kind === "unsubscribe"
      ? phase === "complete"
        ? "Unsubscribed from updates"
        : "Unsubscribe from updates"
      : phase === "complete"
        ? "Cluster extension deleted"
        : "Delete cluster extension";

  const primaryLabel =
    kind === "unsubscribe"
      ? phase === "complete"
        ? "Close"
        : "Unsubscribe"
      : phase === "complete"
        ? "Close"
        : "Delete extension and managed resources";

  return (
    <Modal
      variant="medium"
      isOpen={isOpen}
      onClose={phase === "progress" ? () => undefined : onClose}
      aria-labelledby="olm-v1-uninstall-title"
      aria-describedby="olm-v1-uninstall-body"
    >
      <ModalHeader title={<span id="olm-v1-uninstall-title">{title}</span>} />
      <ModalBody id="olm-v1-uninstall-body">
        {phase === "confirm" ? (
          <Stack hasGutter>
            {kind === "unsubscribe" ? (
              <StackItem>
                <Alert variant="warning" title="Updates will stop" isInline>
                  Unsubscribing stops future catalog updates for{" "}
                  <strong>{operator.name}</strong>. The cluster extension and its managed
                  resources remain installed until you delete them separately.
                </Alert>
              </StackItem>
            ) : (
              <StackItem>
                <Alert variant="danger" title="This action cannot be undone" isInline>
                  Deleting this cluster extension uses standard Kubernetes owner-reference
                  semantics. Child objects created by the extension are removed through{" "}
                  <strong>cascading deletion</strong>, which can disrupt running workloads.
                </Alert>
              </StackItem>
            )}

            <StackItem>
              <Content component="dl" className="pf-v6-c-description-list pf-m-horizontal">
                <Content component="dt">Extension</Content>
                <Content component="dd">{operator.name}</Content>
                <Content component="dt">Version</Content>
                <Content component="dd">{operator.version}</Content>
                <Content component="dt">Namespace</Content>
                <Content component="dd">{operator.namespace}</Content>
              </Content>
            </StackItem>

            {kind === "delete" ? (
              <StackItem>
                <Content component="p" className="pf-v6-u-mb-sm">
                  Deleting will remove:
                </Content>
                <Content component="ul">
                  <Content component="li">The cluster extension and its update subscription</Content>
                  <Content component="li">Managed custom resources and operands</Content>
                  <Content component="li">Operator controller workloads and related RBAC</Content>
                </Content>
              </StackItem>
            ) : (
              <StackItem>
                <Content component="p">
                  You can resubscribe later from OperatorHub when a compatible update is available.
                </Content>
              </StackItem>
            )}

            <StackItem>
              <Checkbox
                id="olm-v1-uninstall-ack"
                label={
                  kind === "delete"
                    ? "I understand that cascading deletion will remove managed resources and operands."
                    : "I understand that this operator will no longer receive catalog updates."
                }
                isChecked={acknowledged}
                onChange={(_event, checked) => setAcknowledged(checked)}
              />
            </StackItem>

            {requiresNameConfirm ? (
              <StackItem>
                <Content component="p" className="pf-v6-u-mb-sm">
                  Type <strong>{operator.name}</strong> to confirm deletion.
                </Content>
                <TextInput
                  id="olm-v1-delete-confirm-name"
                  aria-label="Confirm extension name"
                  value={confirmName}
                  onChange={(_event, value) => setConfirmName(value)}
                  placeholder={operator.name}
                />
              </StackItem>
            ) : null}
          </Stack>
        ) : null}

        {phase === "progress" ? (
          <Stack hasGutter>
            <StackItem>
              <Progress value={(progressStep / (DELETE_PROGRESS_STEPS.length - 1)) * 100} size={ProgressSize.sm} />
            </StackItem>
            <StackItem>
              <Content component="p" className="pf-v6-u-font-weight-bold pf-v6-u-mb-sm">
                {kind === "unsubscribe" ? "Unsubscribing…" : DELETE_PROGRESS_STEPS[progressStep]}
              </Content>
              {kind === "delete"
                ? DELETE_PROGRESS_STEPS.map((step, index) => (
                    <Flex key={step} gap={{ default: "gapSm" }} className="pf-v6-u-mb-xs">
                      <Content component="small" className={index <= progressStep ? undefined : "pf-v6-u-color-200"}>
                        {index <= progressStep ? "✓" : "○"} {step}
                      </Content>
                    </Flex>
                  ))
                : null}
            </StackItem>
          </Stack>
        ) : null}

        {phase === "complete" ? (
          <Alert
            variant="success"
            title={
              kind === "unsubscribe"
                ? `${operator.name} is unsubscribed from catalog updates.`
                : `${operator.name} and its managed resources were deleted.`
            }
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
            <Button
              key="submit"
              variant={kind === "delete" ? "danger" : "primary"}
              isDisabled={!canSubmit}
              onClick={handleSubmit}
            >
              {primaryLabel}
            </Button>
          </>
        ) : null}
        {phase === "complete" ? (
          <Button key="done" variant="primary" onClick={onClose}>
            {primaryLabel}
          </Button>
        ) : null}
      </ModalFooter>
    </Modal>
  );
}
