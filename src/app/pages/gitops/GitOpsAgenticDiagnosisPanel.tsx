import { Link } from "react-router";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  EmptyState,
  EmptyStateBody,
  Flex,
  Label,
  Title,
} from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";
import InProgressIcon from "@patternfly/react-icons/dist/esm/icons/in-progress-icon";
import { useToast } from "../../contexts/ToastContext";
import {
  gitOpsPhaseLabel,
  type AgenticUpdateRun,
  type GitOpsWorkflowPhase,
} from "../../constants/agenticUpdateRuns";
import { gitopsDetailPath } from "./gitopsData";

const PHASES: GitOpsWorkflowPhase[] = ["queued", "running", "succeeded"];

function stepState(phase: GitOpsWorkflowPhase, step: GitOpsWorkflowPhase): "done" | "current" | "pending" | "failed" {
  if (phase === "failed") {
    if (step === "succeeded") return "failed";
    return "done";
  }
  const order = PHASES.indexOf(phase);
  const stepOrder = PHASES.indexOf(step);
  if (stepOrder < order) return "done";
  if (stepOrder === order) return "current";
  return "pending";
}

function StepIcon({ state }: { state: "done" | "current" | "pending" | "failed" }) {
  if (state === "done") return <CheckCircleIcon color="var(--pf-t--global--icon--color--status--success--default)" />;
  if (state === "failed") return <ExclamationCircleIcon color="var(--pf-t--global--icon--color--status--danger--default)" />;
  if (state === "current") return <InProgressIcon />;
  return <ClockIcon />;
}

export function GitOpsAgenticDiagnosisPanel({ run }: { run: AgenticUpdateRun }) {
  const diagnosis = run.gitops;
  const { pushToast } = useToast();
  if (!diagnosis) return null;

  const phase = diagnosis.phase;
  const appPath = gitopsDetailPath("applications", diagnosis.applicationNamespace, diagnosis.applicationName);
  const finishedLabel = phase === "failed" ? "Failed" : "Succeeded";

  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }} className="pf-v6-u-pt-lg">
      <section aria-label="Workflow progress">
        <Title headingLevel="h2" size="lg">
          Progress
        </Title>
        <Flex gap={{ default: "gapLg" }} flexWrap={{ default: "wrap" }} className="pf-v6-u-mt-md">
          {PHASES.map((step) => {
            const state = stepState(phase, step);
            const label = step === "succeeded" ? finishedLabel : gitOpsPhaseLabel(step);
            return (
              <Flex key={step} alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                <StepIcon state={state} />
                <Content component="p" className="pf-v6-u-mb-0">
                  <strong>{label}</strong>
                  {state === "current" ? " (current)" : null}
                </Content>
              </Flex>
            );
          })}
        </Flex>
        <Content component="p" className="pf-v6-u-color-200 pf-v6-u-mt-sm">
          Current state: {gitOpsPhaseLabel(phase)}. Status and health only. Tokens and certificates are not shown.
        </Content>
      </section>

      {phase === "failed" && diagnosis.recovery ? (
        <Alert isInline variant="danger" title="Analysis failed" actionLinks={
          <>
            <Button
              variant="link"
              isInline
              onClick={() =>
                pushToast({
                  variant: "info",
                  title: `Retry queued for ${diagnosis.applicationName}`,
                })
              }
            >
              Retry
            </Button>
            <Button variant="link" isInline component={(props) => <Link {...props} to={appPath} />}>
              Open Application
            </Button>
          </>
        }>
          {diagnosis.recovery}
        </Alert>
      ) : null}

      {phase === "queued" ? (
        <EmptyState headingLevel="h3" titleText="Waiting to start">
          <EmptyStateBody>
            This run is queued. Diagnosis, evidence, and remediation options appear after it starts.
          </EmptyStateBody>
        </EmptyState>
      ) : null}

      {phase === "running" ? (
        <Alert isInline variant="info" title="Analysis is running">
          {diagnosis.diagnosis}
        </Alert>
      ) : null}

      {diagnosis.evidence.length > 0 ? (
        <section aria-label="Evidence">
          <Title headingLevel="h2" size="lg">
            Evidence
          </Title>
          <DescriptionList isHorizontal isCompact className="pf-v6-u-mt-md">
            {diagnosis.evidence.map((item) => (
              <DescriptionListGroup key={item.label}>
                <DescriptionListTerm>{item.label}</DescriptionListTerm>
                <DescriptionListDescription>{item.detail}</DescriptionListDescription>
              </DescriptionListGroup>
            ))}
          </DescriptionList>
        </section>
      ) : null}

      {phase === "succeeded" || phase === "failed" ? (
        <section aria-label="Diagnosis">
          <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
            <Title headingLevel="h2" size="lg">
              Diagnosis
            </Title>
            <Label isCompact color="purple">
              AI-generated
            </Label>
          </Flex>
          <Content component="p">{diagnosis.diagnosis}</Content>
        </section>
      ) : null}

      {diagnosis.options.length > 0 ? (
        <section aria-label="Remediation options">
          <Title headingLevel="h2" size="lg">
            Remediation options
          </Title>
          <Content component="p" className="pf-v6-u-color-200">
            Proposed only. This page does not change the Application. Apply a change from Git, then sync.
          </Content>
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            {diagnosis.options.map((option) => (
              <Card key={option.title} isCompact>
                <CardTitle>
                  <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
                    <span>{option.title}</span>
                    {option.proposed ? (
                      <Label isCompact color="blue">
                        Proposed
                      </Label>
                    ) : null}
                    <Label isCompact color={option.risk === "Low" ? "green" : option.risk === "Medium" ? "orange" : "red"}>
                      Risk: {option.risk}
                    </Label>
                  </Flex>
                </CardTitle>
                <CardBody>
                  <Content component="p" className="pf-v6-u-mb-0">
                    <strong>Rollback: </strong>
                    {option.rollback}
                  </Content>
                </CardBody>
              </Card>
            ))}
          </Flex>
        </section>
      ) : null}

      {phase !== "failed" ? (
        <Button variant="link" isInline component={(props) => <Link {...props} to={appPath} />}>
          Back to {diagnosis.applicationName}
        </Button>
      ) : null}
    </Flex>
  );
}
