import { Alert, Button, Content, Flex, Tooltip } from "@patternfly/react-core";
import { RhAiExperienceIcon } from "@/components/icons/RhAiExperienceIcon";
import {
  GITOPS_AI_REMEDIATION_BANNER_BODY,
  GITOPS_AI_REMEDIATION_BANNER_DISCLAIMER,
  GITOPS_AI_REMEDIATION_BANNER_TITLE,
  GITOPS_VIEW_AGENTIC_RUN_LABEL,
  GITOPS_VIEW_AGENTIC_RUN_TOOLTIP,
} from "./gitopsAgenticCopy";
import { GitOpsTechPreviewBadge } from "./gitopsShared";

type GitOpsAiRemediationBannerProps = {
  onViewRecommendation: () => void;
};

/** GITOPS-11005 entry pattern: info banner + tech preview + primary View AI Recommendation CTA. */
export function GitOpsAiRemediationBanner({ onViewRecommendation }: GitOpsAiRemediationBannerProps) {
  return (
    <Alert
      variant="info"
      isInline
      title={
        <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
          <span>{GITOPS_AI_REMEDIATION_BANNER_TITLE}</span>
          <GitOpsTechPreviewBadge />
        </Flex>
      }
      actionLinks={
        <Tooltip content={GITOPS_VIEW_AGENTIC_RUN_TOOLTIP}>
          <Button
            variant="primary"
            size="sm"
            icon={<RhAiExperienceIcon aria-hidden />}
            onClick={onViewRecommendation}
          >
            {GITOPS_VIEW_AGENTIC_RUN_LABEL}
          </Button>
        </Tooltip>
      }
    >
      <Content component="p">{GITOPS_AI_REMEDIATION_BANNER_BODY}</Content>
      <Content component="p" className="pf-v6-u-mt-sm pf-v6-u-font-size-sm pf-v6-u-color-200">
        {GITOPS_AI_REMEDIATION_BANNER_DISCLAIMER}
      </Content>
    </Alert>
  );
}