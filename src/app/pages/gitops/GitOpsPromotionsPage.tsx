import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Alert,
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Title,
} from "@patternfly/react-core";
import { GitOpsSimpleListPage } from "./GitOpsSimpleListPage";
import GitOpsSimpleDetailPage, { GitOpsNotFound } from "./GitOpsSimpleDetailPage";
import {
  findPromotionPipeline,
  promotionsForInstance,
  type PromotionPipelineRecord,
  type PromotionStage,
} from "./gitopsData";
import { useGitOpsInstance } from "./GitOpsPageHeader";
import GitOpsPromotionPipelineViz from "./GitOpsPromotionPipelineViz";
import { promotionStageLabelColor, promotionStatusLabelColor } from "../../lib/pfSemanticColors";
import { useToast } from "../../contexts/ToastContext";

function promotionStatusColor(status: "Running" | "Blocked" | "Succeeded" | "Failed") {
  return promotionStatusLabelColor(status);
}

function stageStatusColor(status: PromotionStage["status"]) {
  return promotionStageLabelColor(status);
}

function stageLogLines(stage: PromotionStage): string[] {
  const lines = [
    `[${stage.name}] status=${stage.status}`,
    stage.gate ? `gate=${stage.gate}` : "gate=none",
  ];
  if (stage.status === "running") {
    lines.push("analysis job started", "waiting for metrics threshold");
  } else if (stage.status === "blocked") {
    lines.push("gate blocked progression", "awaiting approval or analysis result");
  } else if (stage.status === "succeeded") {
    lines.push("promotion completed", "artifacts synced to target environment");
  } else if (stage.status === "pending") {
    lines.push("waiting for upstream stage");
  }
  return lines;
}

export default function GitOpsPromotionsPage() {
  const { instance } = useGitOpsInstance();
  return (
    <GitOpsSimpleListPage
      title="Promotions"
      path="/gitops/promotions"
      createLabel="Create promotion"
      kind="Promotion"
      detailKind="promotions"
      items={promotionsForInstance(instance)}
      columns={[
        { key: "name", label: "Name" },
        { key: "namespace", label: "Namespace" },
        { key: "environments", label: "Environments" },
        { key: "status", label: "Status" },
        { key: "age", label: "Age" },
      ]}
      renderCell={(item, key) => {
        if (key === "environments") return item.environments;
        if (key === "status") {
          return (
            <Label color={promotionStatusColor(item.status)} isCompact>
              {item.status}
            </Label>
          );
        }
        if (key === "age") return item.age;
        return null;
      }}
      footnote={
        <>
          <Label color="purple" isCompact className="pf-v6-u-mr-sm">
            Tech Preview
          </Label>
          Promoter API is still moving — pipeline viz and setup wizard are prototype-only.
        </>
      }
    />
  );
}

export function GitOpsPromotionDetailPage() {
  const { namespace = "", name = "" } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const baseRec = findPromotionPipeline(decodeURIComponent(namespace), decodeURIComponent(name));
  const [pipeline, setPipeline] = useState<PromotionPipelineRecord | null>(baseRec ?? null);
  const [selectedStage, setSelectedStage] = useState<string | undefined>(baseRec?.stages[0]?.name);
  const [stageModalOpen, setStageModalOpen] = useState(false);

  const activeStage =
    pipeline?.stages.find((stage) => stage.name === selectedStage) ?? pipeline?.stages[0];

  if (!pipeline || !activeStage) return <GitOpsNotFound listPath="/gitops/promotions" listTitle="Promotions" />;

  const approveStage = (stageName: string) => {
    setPipeline((prev) => {
      if (!prev) return prev;
      const stages = prev.stages.map((stage) => {
        if (stage.name !== stageName) return stage;
        return { ...stage, status: "succeeded" as const };
      });
      const nextIndex = stages.findIndex((s) => s.name === stageName) + 1;
      if (nextIndex < stages.length && stages[nextIndex].status === "pending") {
        stages[nextIndex] = { ...stages[nextIndex], status: "running" };
      }
      return { ...prev, stages, status: "Running" };
    });
    pushToast({ variant: "success", title: `Approved ${stageName} gate.` });
  };

  const rerunPipeline = () => {
    setPipeline((prev) => {
      if (!prev) return prev;
      const stages = prev.stages.map((stage, index) => ({
        ...stage,
        status: index === 0 ? ("running" as const) : ("pending" as const),
      }));
      return { ...prev, stages, status: "Running" };
    });
    pushToast({ variant: "success", title: `Rerunning ${pipeline.name}.` });
  };

  const openStage = (stageName: string) => {
    setSelectedStage(stageName);
    setStageModalOpen(true);
  };

  return (
    <>
      <GitOpsSimpleDetailPage
        kindLabel="Promotion"
        listPath="/gitops/promotions"
        listTitle="Promotions"
        resourceKind="Promotion"
        detailKind="promotions"
        title={pipeline.name}
        ns={pipeline.ns}
        status={pipeline.status === "Succeeded" ? "Healthy" : pipeline.status === "Failed" ? "Degraded" : "Progressing"}
        extraActions={[
          { id: "rerun", label: "Rerun" },
          { id: "approve-gate", label: "Approve gate" },
          { id: "edit-yaml", label: "Edit YAML" },
        ]}
        onExtraAction={(actionId) => {
          if (actionId === "rerun") rerunPipeline();
          if (actionId === "approve-gate") {
            const blocked = pipeline.stages.find((s) => s.status === "blocked");
            if (blocked) approveStage(blocked.name);
            else pushToast({ variant: "warning", title: "No blocked gate to approve." });
          }
        }}
        fields={[
          { term: "Name", value: pipeline.name },
          { term: "Namespace", value: pipeline.ns },
          {
            term: "Pipeline",
            value: (
              <GitOpsPromotionPipelineViz
                pipeline={pipeline}
                selectedStage={selectedStage}
                onStageSelect={openStage}
                onApprove={approveStage}
              />
            ),
          },
          {
            term: "Status",
            value: (
              <Label color={promotionStatusColor(pipeline.status)} isCompact>
                {pipeline.status}
              </Label>
            ),
          },
          { term: "Age", value: pipeline.age },
        ]}
        extraContent={
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            <Title headingLevel="h2" size="lg">Gating</Title>
            <Content component="p" className="pf-v6-u-color-200">
              Gates are shown per environment stage to support pipelines with many approval and analysis gates.
              Select a row to inspect stage logs.
            </Content>
            <DescriptionList isHorizontal isCompact>
              {pipeline.stages
                .filter((stage) => stage.gate)
                .map((stage) => (
                  <DescriptionListGroup key={stage.name}>
                    <DescriptionListTerm>{stage.name}</DescriptionListTerm>
                    <DescriptionListDescription>
                      <button
                        type="button"
                        className={`ocs-gitops-promo-gate-row${selectedStage === stage.name ? " ocs-gitops-promo-gate-row--selected" : ""}`}
                        onClick={() => openStage(stage.name)}
                      >
                        <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }} alignItems={{ default: "alignItemsFlexStart" }}>
                          <Label color={stageStatusColor(stage.status)} isCompact>
                            {stage.status}
                          </Label>
                          <Content component="small">{stage.gate}</Content>
                        </Flex>
                      </button>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                ))}
            </DescriptionList>
          </Flex>
        }
        footnote={
          <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
            <Alert variant="info" isInline title="Promoter Tech Preview">
              Environment progression and gate approval are simulated. API contracts may change before GA.
            </Alert>
            <Button variant="link" isInline onClick={() => navigate("/gitops/create?kind=promotion")}>
              Open promotion setup wizard
            </Button>
          </Flex>
        }
      />

      <Modal
        variant="medium"
        isOpen={stageModalOpen}
        onClose={() => setStageModalOpen(false)}
        aria-labelledby="gitops-promo-stage-modal-title"
      >
        <ModalHeader title={`Stage: ${activeStage.name}`} labelId="gitops-promo-stage-modal-title" />
        <ModalBody>
          <DescriptionList isCompact>
            <DescriptionListGroup>
              <DescriptionListTerm>Status</DescriptionListTerm>
              <DescriptionListDescription>
                <Label color={stageStatusColor(activeStage.status)} isCompact>
                  {activeStage.status}
                </Label>
              </DescriptionListDescription>
            </DescriptionListGroup>
            {activeStage.gate ? (
              <DescriptionListGroup>
                <DescriptionListTerm>Gate</DescriptionListTerm>
                <DescriptionListDescription>{activeStage.gate}</DescriptionListDescription>
              </DescriptionListGroup>
            ) : null}
          </DescriptionList>
          <Title headingLevel="h3" size="md" className="pf-v6-u-mt-md">
            Stage logs
          </Title>
          <pre className="ocs-gitops-promo-stage-logs" aria-label={`${activeStage.name} stage logs`}>
            {stageLogLines(activeStage).join("\n")}
          </pre>
        </ModalBody>
        <ModalFooter>
          {activeStage.status === "blocked" && activeStage.gate?.includes("approval") ? (
            <Button
              variant="primary"
              onClick={() => {
                approveStage(activeStage.name);
                setStageModalOpen(false);
              }}
            >
              Approve gate
            </Button>
          ) : null}
          <Button variant="link" onClick={() => setStageModalOpen(false)}>Close</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
