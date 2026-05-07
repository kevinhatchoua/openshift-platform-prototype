import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardExpandableContent,
  CardHeader,
  CardTitle,
  Content,
  Flex,
} from "@patternfly/react-core";
import { Sparkles } from "@/lib/pfIcons";
import { AiSparkleLabel } from "./lightspeed/LightspeedLegalCopy";
import { usePatternFlyGlassActive } from "@/lib/usePatternFlyGlassActive";

export type AiAssessmentVariant = "cluster-update" | "installed-operators";

type InstalledSummary = {
  totalOperators: number;
  updatesAvailable: number;
  clusterTargetVersion: string;
  channelLabel: string;
};

export type ClusterUpdateDemoVariant = "manual-and-agent" | "agent-only";

/** Shared AI Assessment card (OCPSTRAT-2701) — Cluster Update and Installed Operators. */
export function AiAssessmentSection({
  openChatbot,
  selectedVersion,
  variant = "cluster-update",
  installedSummary,
  /** When set on Cluster Update, tunes copy for Manual+Agent (OCP 5.1) vs Agent-only (OCP 5.0) demos. */
  clusterUpdateDemoVariant,
}: {
  openChatbot: (ctx: string) => void;
  selectedVersion: string;
  variant?: AiAssessmentVariant;
  /** Required when variant is installed-operators — drives contextual copy and the info callout. */
  installedSummary?: InstalledSummary;
  clusterUpdateDemoVariant?: ClusterUpdateDemoVariant;
}) {
  const [expanded, setExpanded] = useState(true);
  const isGlass = usePatternFlyGlassActive();

  const precheckContext =
    variant === "installed-operators" ? "installed-operators-precheck" : "ai-precheck";

  const onExpand = (_event: React.MouseEvent, _id: string) => {
    setExpanded((v) => !v);
  };

  return (
    <Card id="ai-assessment-section-card" isExpanded={expanded} isGlass={isGlass}>
      <CardHeader onExpand={onExpand}>
        <CardTitle component="h2">
          <AiSparkleLabel aria-label="AI Assessment">AI Assessment</AiSparkleLabel>
        </CardTitle>
      </CardHeader>
      <CardExpandableContent>
        <CardBody>
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            {variant === "installed-operators" && installedSummary ? (
              <>
                <Content component="p">
                  OpenShift LightSpeed can review your <strong>installed catalog operators</strong> against the
                  cluster&apos;s target OpenShift version. Use it to spot compatibility gaps, required updates, and
                  OLM v0 vs cluster extension (v1) differences before you approve installs or updates from this list.
                </Content>

                <Alert
                  variant="info"
                  isInline
                  title={
                    <>
                      Cluster target <code>{installedSummary.clusterTargetVersion}</code>
                      <Content component="small"> · {installedSummary.channelLabel}</Content>
                    </>
                  }
                >
                  <Content component="p">
                    {installedSummary.totalOperators} operators installed · {installedSummary.updatesAvailable} with
                    updates available
                  </Content>
                </Alert>
              </>
            ) : (
              <>
                <Content component="p">
                  {clusterUpdateDemoVariant === "agent-only" ? (
                    <>
                      In the <strong>OCP 5.0</strong> agent-led experience, the update agent proposes plans and drives
                      execution—OpenShift LightSpeed can still run a <strong>pre-check</strong> on cluster and{" "}
                      <strong>operator</strong> readiness before you approve, so risks and prerequisites stay visible
                      alongside automated planning.
                    </>
                  ) : (
                    <>
                      OpenShift LightSpeed can help you assess whether this <strong>cluster</strong> is ready to move
                      to the target version and how your <strong>operators</strong>—both platform and catalog—may be
                      affected. Use a pre-check to surface compatibility risks, blocking work, and follow-up actions
                      before you start the update.
                    </>
                  )}
                </Content>
              </>
            )}

            <Flex>
              <Button
                variant="secondary"
                icon={<Sparkles aria-hidden className="ocs-ai-sparkle-cta-icon" />}
                onClick={() => openChatbot(precheckContext)}
              >
                Pre-check with AI
              </Button>
            </Flex>
          </Flex>
        </CardBody>
      </CardExpandableContent>
    </Card>
  );
}
