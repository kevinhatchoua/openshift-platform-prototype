import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  Button,
  Card,
  CardBody,
  Flex,
  Form,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { Sparkles } from "@/lib/pfIcons";
import { agenticRunPath } from "../../constants/agenticUpdateRuns";
import { useClusterExtensionAiWorkflow } from "../../hooks/useClusterExtensionAiWorkflow";
import {
  clusterExtensionHasAvailableUpdate,
  proposedClusterExtensionVersion,
} from "../../lib/clusterExtensionAiWorkflow";
import type { CatalogOperator } from "../../pages/ecosystem/installedOperatorsTypes";
import { OlmV1ClusterExtensionSpecFields } from "./OlmV1ClusterExtensionSpecFields";
import {
  defaultClusterExtensionSpec,
  type OlmV1ClusterExtensionSpec,
} from "./olmV1ClusterExtensionSpec";
import { OlmV1ExtensionUpdateModal } from "./OlmV1ExtensionUpdateModal";

type OlmV1ClusterExtensionSubscriptionPanelProps = {
  operator: CatalogOperator;
  canManage: boolean;
  onSpecUpdated: (spec: OlmV1ClusterExtensionSpec) => void;
  onManageSubscription: () => void;
};

export function OlmV1ClusterExtensionSubscriptionPanel({
  operator,
  canManage,
  onSpecUpdated,
  onManageSubscription,
}: OlmV1ClusterExtensionSubscriptionPanelProps) {
  const { launchUpdatePrecheck } = useClusterExtensionAiWorkflow();
  const [spec, setSpec] = useState<OlmV1ClusterExtensionSpec>(() =>
    defaultClusterExtensionSpec({
      channel: operator.channel,
      version: operator.version,
      versionRange: operator.versionRange,
    }),
  );
  const [updateOpen, setUpdateOpen] = useState(false);
  const [lastPrecheckRunId, setLastPrecheckRunId] = useState<string | null>(null);

  useEffect(() => {
    setSpec(
      defaultClusterExtensionSpec({
        channel: operator.channel,
        version: operator.version,
        versionRange: operator.versionRange,
      }),
    );
  }, [operator.channel, operator.name, operator.version, operator.versionRange]);

  const hasChanges =
    spec.channel !== operator.channel ||
    spec.version !== operator.version ||
    (spec.versionRange ?? "") !== (operator.versionRange ?? "");

  const canUpdate = canManage && hasChanges && spec.channel.trim() && spec.version.trim();
  const canPrecheckUpdate =
    canManage && (clusterExtensionHasAvailableUpdate(operator) || hasChanges);

  const openPrecheckUpdate = () => {
    if (!canPrecheckUpdate) return;
    const opForRun: CatalogOperator = {
      ...operator,
      version: operator.version,
      updateAvailable: hasChanges ? spec.version : operator.updateAvailable,
      channel: hasChanges ? spec.channel : operator.channel,
      versionRange: hasChanges ? spec.versionRange : operator.versionRange,
    };
    const runId = launchUpdatePrecheck(opForRun);
    setLastPrecheckRunId(runId);
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <Card isPlain>
          <CardBody>
            <Form>
              <OlmV1ClusterExtensionSpecFields
                idPrefix="olm-v1-subscription"
                value={spec}
                onChange={setSpec}
                isReadOnly={!canManage}
              />
            </Form>
          </CardBody>
        </Card>
      </StackItem>

      <StackItem>
        <Flex
          alignItems={{ default: "alignItemsCenter" }}
          flexWrap={{ default: "wrap" }}
          gap={{ default: "gapMd" }}
        >
          <Button variant="primary" isDisabled={!canUpdate} onClick={() => setUpdateOpen(true)}>
            Update
          </Button>
          <Button variant="secondary" isDisabled={!canManage} onClick={onManageSubscription}>
            Manage Subscription
          </Button>
          <Button
            variant="link"
            isInline
            isDisabled={!canPrecheckUpdate}
            onClick={openPrecheckUpdate}
            icon={<Sparkles aria-hidden className="ocs-ai-sparkle-cta-icon" />}
          >
            Pre-check update with AI
          </Button>
        </Flex>
        {clusterExtensionHasAvailableUpdate(operator) ? (
          <p className="pf-v6-u-mt-sm pf-v6-u-color-200 pf-v6-u-font-size-sm">
            Catalog update available: <strong>{proposedClusterExtensionVersion(operator)}</strong>
          </p>
        ) : null}
        {lastPrecheckRunId ? (
          <p className="pf-v6-u-mt-sm pf-v6-u-color-200 pf-v6-u-font-size-sm">
            Latest agentic run:{" "}
            <Link to={agenticRunPath(lastPrecheckRunId)} className="pf-v6-u-font-weight-bold">
              {lastPrecheckRunId}
            </Link>
          </p>
        ) : null}
      </StackItem>

      <OlmV1ExtensionUpdateModal
        operator={operator}
        isOpen={updateOpen}
        onClose={() => setUpdateOpen(false)}
        initialSpec={spec}
        onComplete={(_op, nextSpec) => {
          onSpecUpdated(nextSpec);
          setSpec(nextSpec);
        }}
      />
    </Stack>
  );
}
