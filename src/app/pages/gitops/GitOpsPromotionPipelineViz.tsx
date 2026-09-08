import { Button, Flex, Label } from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import { promotionStageLabelColor } from "../../lib/pfSemanticColors";
import type { PromotionPipelineRecord, PromotionStage } from "./gitopsData";

function stageColor(status: PromotionStage["status"]) {
  return promotionStageLabelColor(status);
}

export default function GitOpsPromotionPipelineViz({
  pipeline,
  selectedStage,
  onStageSelect,
  onApprove,
}: {
  pipeline: PromotionPipelineRecord;
  selectedStage?: string;
  onStageSelect?: (stageName: string) => void;
  onApprove?: (stageName: string) => void;
}) {
  const stages = pipeline.stages;
  return (
    <Flex
      className="ocs-gitops-promo-pipeline"
      alignItems={{ default: "alignItemsStretch" }}
      gap={{ default: "gapMd" }}
      flexWrap={{ default: "wrap" }}
    >
      {stages.map((stage, index) => {
        const isSelected = selectedStage === stage.name;
        return (
          <Flex key={stage.name} alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
            <button
              type="button"
              className={`ocs-gitops-promo-stage ocs-gitops-promo-stage--interactive${isSelected ? " ocs-gitops-promo-stage--selected" : ""}`}
              onClick={() => onStageSelect?.(stage.name)}
              aria-pressed={isSelected}
              aria-label={`Inspect ${stage.name} stage — ${stage.status}`}
            >
              <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsFlexStart" }}>
                <Label color={stageColor(stage.status)} isCompact>
                  {stage.name}
                </Label>
                <span className="ocs-gitops-promo-stage__status">{stage.status}</span>
                {stage.gate ? <span className="ocs-gitops-promo-stage__gate">Gate: {stage.gate}</span> : null}
                {stage.status === "blocked" && stage.gate?.includes("approval") && onApprove ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApprove(stage.name);
                    }}
                  >
                    Approve
                  </Button>
                ) : null}
                {stage.status === "succeeded" ? (
                  <CheckCircleIcon className="ocs-gitops-promo-stage__icon pf-v6-u-color-200" aria-hidden />
                ) : null}
                {stage.status === "failed" ? (
                  <ExclamationCircleIcon className="ocs-gitops-promo-stage__icon pf-v6-u-color-danger" aria-hidden />
                ) : null}
              </Flex>
            </button>
            {index < stages.length - 1 ? <span className="ocs-gitops-promo-arrow" aria-hidden>→</span> : null}
          </Flex>
        );
      })}
    </Flex>
  );
}
