import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
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

export type OperatorSubscriptionUpdateTarget = {
  channel: string;
  version: string;
  approval: "Automatic" | "Manual";
};

type OperatorSubscriptionUpdateModalProps = {
  operatorName: string;
  isOpen: boolean;
  current: OperatorSubscriptionUpdateTarget;
  target: OperatorSubscriptionUpdateTarget;
  onClose: () => void;
  onComplete: (target: OperatorSubscriptionUpdateTarget) => void;
};

type ModalPhase = "confirm" | "progress" | "complete";

const UPDATE_PROGRESS_STEPS = [
  "Updating Subscription resource…",
  "Creating InstallPlan…",
  "Waiting for InstallPlan to complete…",
  "Installing ClusterServiceVersion…",
  "Verifying operator health…",
];

export function OperatorSubscriptionUpdateModal({
  operatorName,
  isOpen,
  current,
  target,
  onClose,
  onComplete,
}: OperatorSubscriptionUpdateModalProps) {
  const [phase, setPhase] = useState<ModalPhase>("confirm");
  const [progressStep, setProgressStep] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setPhase("confirm");
    setProgressStep(0);
  }, [isOpen, target.channel, target.version, target.approval]);

  const startUpdate = () => {
    setPhase("progress");
    setProgressStep(0);

    const interval = window.setInterval(() => {
      setProgressStep((prev) => {
        if (prev >= UPDATE_PROGRESS_STEPS.length - 1) {
          window.clearInterval(interval);
          setPhase("complete");
          onComplete(target);
          return prev;
        }
        return prev + 1;
      });
    }, 850);
  };

  const handleClose = () => {
    if (phase === "progress") return;
    onClose();
  };

  return (
    <Modal
      variant="medium"
      isOpen={isOpen}
      onClose={handleClose}
      aria-labelledby="operator-subscription-update-title"
      aria-describedby="operator-subscription-update-body"
    >
      <ModalHeader
        title={
          <span id="operator-subscription-update-title">
            {phase === "complete" ? "Update complete" : "Update operator"}
          </span>
        }
      />
      <ModalBody id="operator-subscription-update-body">
        {phase === "confirm" ? (
          <Stack hasGutter>
            <StackItem>
              <Alert variant="info" title="Subscription update" isInline>
                The console will update the Subscription and reconcile an InstallPlan for{" "}
                <strong>{operatorName}</strong>.
              </Alert>
            </StackItem>
            <StackItem>
              <DescriptionList isHorizontal isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>Channel</DescriptionListTerm>
                  <DescriptionListDescription>
                    {current.channel} → {target.channel}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Version</DescriptionListTerm>
                  <DescriptionListDescription>
                    {current.version} → {target.version}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Update approval</DescriptionListTerm>
                  <DescriptionListDescription>{target.approval}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </StackItem>
          </Stack>
        ) : null}

        {phase === "progress" ? (
          <Stack hasGutter>
            <StackItem>
              <Progress
                value={(progressStep / (UPDATE_PROGRESS_STEPS.length - 1)) * 100}
                size={ProgressSize.sm}
                aria-label="Operator update progress"
              />
            </StackItem>
            <StackItem>
              {UPDATE_PROGRESS_STEPS.map((step, index) => (
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
          <Alert variant="success" title={`${operatorName} updated`} isInline>
            Channel <strong>{target.channel}</strong>, version <strong>{target.version}</strong>, approval{" "}
            <strong>{target.approval}</strong>.
          </Alert>
        ) : null}
      </ModalBody>
      <ModalFooter>
        {phase === "confirm" ? (
          <>
            <Button variant="link" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" onClick={startUpdate}>Update</Button>
          </>
        ) : null}
        {phase === "complete" ? (
          <Button variant="primary" onClick={handleClose}>Close</Button>
        ) : null}
      </ModalFooter>
    </Modal>
  );
}
