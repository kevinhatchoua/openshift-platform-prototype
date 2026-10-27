import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Flex,
  Form,
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
import { OlmV1ClusterExtensionSpecFields } from "./OlmV1ClusterExtensionSpecFields";
import {
  defaultClusterExtensionSpec,
  type OlmV1ClusterExtensionSpec,
} from "./olmV1ClusterExtensionSpec";

type OlmV1ExtensionUpdateModalProps = {
  operator: CatalogOperator | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (operator: CatalogOperator, spec: OlmV1ClusterExtensionSpec) => void;
  /** When set, seeds the form instead of operator fields (Subscription tab Update flow). */
  initialSpec?: OlmV1ClusterExtensionSpec;
};

type ModalPhase = "edit" | "progress" | "complete";

const APPLY_PROGRESS_STEPS = [
  "Patching ClusterExtension spec…",
  "Reconciling controller workloads…",
  "Verifying extension health…",
];

export function OlmV1ExtensionUpdateModal({
  operator,
  isOpen,
  onClose,
  onComplete,
  initialSpec,
}: OlmV1ExtensionUpdateModalProps) {
  const [phase, setPhase] = useState<ModalPhase>("edit");
  const [spec, setSpec] = useState<OlmV1ClusterExtensionSpec>(() => defaultClusterExtensionSpec());
  const [progressStep, setProgressStep] = useState(0);

  useEffect(() => {
    if (!isOpen || !operator) return;
    setPhase("edit");
    setProgressStep(0);
    setSpec(
      initialSpec ??
        defaultClusterExtensionSpec({
          channel: operator.channel,
          version: operator.version,
          versionRange: operator.versionRange,
        }),
    );
  }, [isOpen, operator?.name, operator?.channel, operator?.version, operator?.versionRange, initialSpec]);

  if (!operator) {
    return null;
  }

  const canSubmit =
    phase === "edit" &&
    spec.channel.trim().length > 0 &&
    spec.version.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setPhase("progress");
    setProgressStep(0);

    const interval = window.setInterval(() => {
      setProgressStep((prev) => {
        if (prev >= APPLY_PROGRESS_STEPS.length - 1) {
          window.clearInterval(interval);
          setPhase("complete");
          onComplete?.(operator, spec);
          return prev;
        }
        return prev + 1;
      });
    }, 900);
  };

  return (
    <Modal
      variant="medium"
      isOpen={isOpen}
      onClose={phase === "progress" ? () => undefined : onClose}
      aria-labelledby="olm-v1-edit-title"
      aria-describedby="olm-v1-edit-body"
    >
      <ModalHeader
        title={
          <span id="olm-v1-edit-title">
            {phase === "complete" ? "Changes applied" : "Update subscription"}
          </span>
        }
      />
      <ModalBody id="olm-v1-edit-body">
        {phase === "edit" ? (
          <Stack hasGutter>
            <StackItem>
              <Form>
                <OlmV1ClusterExtensionSpecFields
                  idPrefix="olm-v1-edit"
                  value={spec}
                  onChange={setSpec}
                />
              </Form>
            </StackItem>
          </Stack>
        ) : null}

        {phase === "progress" ? (
          <Stack hasGutter>
            <StackItem>
              <Progress
                value={(progressStep / (APPLY_PROGRESS_STEPS.length - 1)) * 100}
                size={ProgressSize.sm}
              />
            </StackItem>
            <StackItem>
              {APPLY_PROGRESS_STEPS.map((step, index) => (
                <Flex key={step} gap={{ default: "gapSm" }} className="pf-v6-u-mb-xs">
                  <span className={index <= progressStep ? undefined : "pf-v6-u-color-200"}>
                    {index <= progressStep ? "✓" : "○"} {step}
                  </span>
                </Flex>
              ))}
            </StackItem>
          </Stack>
        ) : null}

        {phase === "complete" ? (
          <Alert
            variant="success"
            title={`${operator.name} targeting updated.`}
            isInline
          >
            Channel <strong>{spec.channel}</strong>, version <strong>{spec.version}</strong>
            {spec.versionRange ? (
              <>
                , range <strong>{spec.versionRange}</strong>
              </>
            ) : null}
            .
          </Alert>
        ) : null}
      </ModalBody>
      <ModalFooter>
        {phase === "edit" ? (
          <>
            <Button key="cancel" variant="link" onClick={onClose}>
              Cancel
            </Button>
            <Button key="submit" variant="primary" isDisabled={!canSubmit} onClick={handleSubmit}>
              Update
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
