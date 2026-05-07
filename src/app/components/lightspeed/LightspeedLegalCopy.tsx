import type { ReactNode } from "react";
import { Alert, Content, Flex, Title } from "@patternfly/react-core";
import { css } from "@patternfly/react-styles";
import textStyles from "@patternfly/react-styles/css/utilities/Text/text.mjs";
import { Sparkles } from "@/lib/pfIcons";

export const LIGHTSPEED_AI_RESPONSE_FOOTER =
  "Always check AI/LLM generated responses for accuracy prior to use.";

/** PM / legal — AI privacy notice for cluster update AI surfaces (exact approved copy). */
export const CLUSTER_UPDATE_AI_IMPORTANT_TITLE = "Important";

export const CLUSTER_UPDATE_AI_PRIVACY_BODY =
  "This feature uses AI technology. Do not include any personal information or other sensitive information in your input. Interactions may be used to improve Red Hat's products or services.";

export const CLUSTER_UPDATE_AI_PRIVACY_FOOTER_PREFIX =
  "For more information about Red Hat's privacy practices, please refer to the ";

export const CLUSTER_UPDATE_AI_PRIVACY_LINK_LABEL = "Red Hat Privacy Statement";

export const CLUSTER_UPDATE_AI_PRIVACY_LINK_HREF = "https://www.redhat.com/en/about/privacy-policy";

/** Section heading for the agent proposed plan (use spaces, not a hyphen, per product copy). */
export const AI_GENERATED_PLAN_HEADING = "AI generated plan";

/** Shared body (paragraphs + link) for banner and agent logs panel. */
export function ClusterUpdateAiPrivacyDisclaimerBody() {
  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
      <Content component="p" style={{ margin: 0 }}>
        {CLUSTER_UPDATE_AI_PRIVACY_BODY}
      </Content>
      <Content component="p" style={{ margin: 0 }}>
        {CLUSTER_UPDATE_AI_PRIVACY_FOOTER_PREFIX}
        <a href={CLUSTER_UPDATE_AI_PRIVACY_LINK_HREF} target="_blank" rel="noopener noreferrer">
          {CLUSTER_UPDATE_AI_PRIVACY_LINK_LABEL}
        </a>
        .
      </Content>
    </Flex>
  );
}

/** Non-dismissible banner for Cluster Update (Update plan tab — shown for manual and agent-based flows). Uses PatternFly custom alert styling. */
export function ClusterUpdateAiImportantPrivacyBanner() {
  return (
    <Alert
      variant="custom"
      className="ocs-cluster-update-ai-privacy-alert"
      customIcon={<Sparkles aria-hidden />}
      title={CLUSTER_UPDATE_AI_IMPORTANT_TITLE}
    >
      <ClusterUpdateAiPrivacyDisclaimerBody />
    </Alert>
  );
}

/** Same disclaimer as {@link ClusterUpdateAiImportantPrivacyBanner}, for agent logs panel chrome. */
export function ClusterUpdateAiImportantPrivacyPanelNotice() {
  return (
    <Alert
      variant="custom"
      className="ocs-cluster-update-ai-privacy-alert"
      customIcon={<Sparkles aria-hidden />}
      title={CLUSTER_UPDATE_AI_IMPORTANT_TITLE}
    >
      <ClusterUpdateAiPrivacyDisclaimerBody />
    </Alert>
  );
}

export function LightspeedHeaderNotice() {
  return (
    <div
      className={`ols-legal-header-notice ${css(textStyles.fontSizeSm)}`}
      role="region"
      aria-label="Important notice about AI features and privacy"
    >
      <ClusterUpdateAiPrivacyDisclaimerBody />
    </div>
  );
}

export function LightspeedAiMessageFooter() {
  return (
    <p
      className="ols-legal-message-footer"
      style={{
        margin: "0.5rem 0 0 0",
        fontSize: "var(--pf-t--global--font--size--body--sm, 0.75rem)",
        lineHeight: 1.4,
        color: "var(--pf-t--global--text--color--subtle)",
      }}
    >
      {LIGHTSPEED_AI_RESPONSE_FOOTER}
    </p>
  );
}

/** Inline PatternFly alert for AI generated plan / assessment surfaces (uses approved accuracy copy). */
export function LightspeedAiContentBanner() {
  return (
    <Alert variant="info" isInline title="AI generated content">
      <Content component="p" style={{ margin: 0 }}>
        {LIGHTSPEED_AI_RESPONSE_FOOTER}
      </Content>
    </Alert>
  );
}

/**
 * Design language — AI-enabled features: sparkles icon immediately left of the label (see PM guideline slides).
 * Use anywhere AI generated or AI-assisted output is introduced (plans, logs, assessment).
 */
export function AiSparkleLabel({
  children,
  className,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Flex
      alignItems={{ default: "alignItemsCenter" }}
      gap={{ default: "gapSm" }}
      className={className ? `ocs-ai-sparkle-label ${className}` : "ocs-ai-sparkle-label"}
      role="group"
      aria-label={ariaLabel}
    >
      <Sparkles aria-hidden className="ocs-ai-sparkle-label__icon shrink-0" />
      <span className={`ocs-ai-sparkle-label__text ${css(textStyles.fontWeightBold)}`}>{children}</span>
    </Flex>
  );
}

/** Agent proposed-plan section — same heading scale as “AI Update Agent” + leading sparkle. */
export function AiGeneratedPlanMarker({ className }: { className?: string }) {
  return (
    <Flex
      alignItems={{ default: "alignItemsCenter" }}
      gap={{ default: "gapSm" }}
      className={className ? `ocs-ai-plan-marker ${className}` : "ocs-ai-plan-marker"}
      role="group"
      aria-label={AI_GENERATED_PLAN_HEADING}
    >
      <Sparkles aria-hidden className="ocs-ai-plan-marker__icon" />
      <Title headingLevel="h2" size="xl" style={{ margin: 0, hyphens: "none" }}>
        {AI_GENERATED_PLAN_HEADING}
      </Title>
    </Flex>
  );
}

/** Agent execution log drawer heading — sparkles + “AI agent logs”. */
export function AiAgentLogsHeading({ className }: { className?: string }) {
  return (
    <AiSparkleLabel className={className} aria-label="AI agent logs">
      AI agent logs
    </AiSparkleLabel>
  );
}

/** Subtle inline disclaimer for dense layouts (e.g. next to metrics). */
export function LightspeedAiAccuracyInline({ className }: { className?: string }) {
  return (
    <p
      className={className}
      style={{
        margin: 0,
        fontSize: "var(--pf-t--global--font--size--body--sm, 0.75rem)",
        lineHeight: 1.4,
        color: "var(--pf-t--global--text--color--subtle)",
      }}
    >
      {LIGHTSPEED_AI_RESPONSE_FOOTER}
    </p>
  );
}
