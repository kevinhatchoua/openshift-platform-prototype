import { Link } from "react-router";
import {
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Popover,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { ExternalLink } from "@/lib/pfIcons";
import type {
  CatalogOperator,
  OlmMigrationBlocker,
  OlmMigrationEligibility,
} from "../../pages/ecosystem/installedOperatorsTypes";

export type { OlmMigrationBlocker };

function defaultBlockersForEligibility(
  op: CatalogOperator,
  eligibility: OlmMigrationEligibility,
): OlmMigrationBlocker[] {
  const detailsHref = `/ecosystem/installed-operators/${encodeURIComponent(op.name)}`;
  const subscriptionHref = `/ecosystem/installed-operators/${encodeURIComponent(op.name)}/subscription`;
  const updateHref = `/ecosystem/installed-operators/${encodeURIComponent(op.name)}/update`;

  if (eligibility === "migrated") {
    return [
      {
        code: "already_migrated",
        title: "Already managed by Operators (OLMv1)",
        description: `${op.name} is already under OLMv1 management.`,
        resolution: "Switch to the Operators tab to review or update this operator.",
        actionLabel: "View in Operators mode",
        actionHref: detailsHref,
      },
    ];
  }

  if (eligibility === "conflict") {
    return [
      {
        code: "self_managed",
        title: "Migration blocked by platform constraints",
        description:
          op.olmMigrationReason ??
          "This operator cannot be migrated in the current cluster state because of a platform-level conflict.",
        resolution:
          "Follow platform guidance for this operator. Migration may be handled automatically during a cluster upgrade or require a documented runbook.",
        actionLabel: "View operator details",
        actionHref: detailsHref,
      },
    ];
  }

  if (op.status === "Degraded" || op.status === "Pending") {
    return [
      {
        code: "operator_unhealthy",
        title: `Operator is ${op.status.toLowerCase()}`,
        description:
          op.compatibilityMessage ??
          "Migration requires a healthy operator before management can move to Operators (OLMv1).",
        resolution:
          "Resolve operator health issues, confirm all operands are running, then retry migration from the row menu.",
        actionLabel: "View operator details",
        actionHref: detailsHref,
      },
    ];
  }

  if (op.clusterCompatibility === "Incompatible") {
    return [
      {
        code: "version_incompatible",
        title: "Operator version blocks migration",
        description:
          op.compatibilityMessage ??
          "The installed version is not compatible with migration prerequisites for this cluster.",
        resolution: op.updateAvailable
          ? `Update to ${op.updateAvailable} or a supported version, then retry migration.`
          : "Update the operator to a version that supports OLMv1 migration, then retry.",
        actionLabel: op.updateAvailable ? "Update operator" : "View operator details",
        actionHref: op.updateAvailable ? updateHref : detailsHref,
      },
    ];
  }

  return [
    {
      code: "requirements_unmet",
      title: "Migration requirements not met",
      description:
        op.olmMigrationReason ??
        "This operator does not meet one or more migration prerequisites in the current cluster state.",
      resolution:
        "Review install mode, catalog availability, and dependencies. Resolve blockers, then retry from the row menu or bulk migration.",
      actionLabel: "Edit subscription",
      actionHref: subscriptionHref,
    },
  ];
}

export function getMigrationBlockers(op: CatalogOperator): OlmMigrationBlocker[] {
  if (op.olmMigrationBlockers?.length) {
    return op.olmMigrationBlockers;
  }

  const eligibility = op.olmMigrationEligibility;
  if (!eligibility || eligibility === "eligible") {
    return [];
  }

  return defaultBlockersForEligibility(op, eligibility);
}

export function getMigrationSummaryReason(op: CatalogOperator): string {
  if (op.olmMigrationReason) {
    return op.olmMigrationReason;
  }

  const blockers = getMigrationBlockers(op);
  if (blockers.length === 1) {
    return blockers[0].title;
  }
  if (blockers.length > 1) {
    return `${blockers.length} issues block migration`;
  }

  return "Not eligible for migration";
}

type OlmMigrationBlockersPanelProps = {
  operator: CatalogOperator;
  showHeading?: boolean;
};

export function OlmMigrationBlockersPanel({ operator, showHeading = true }: OlmMigrationBlockersPanelProps) {
  const blockers = getMigrationBlockers(operator);

  if (blockers.length === 0) {
    return (
      <Content component="small">
        No blocking issues were found. If migration still fails, review operator details and retry.
      </Content>
    );
  }

  return (
    <Stack hasGutter>
      {showHeading ? (
        <StackItem>
          <Content>
            <strong>Why migration is unavailable</strong>
          </Content>
        </StackItem>
      ) : null}
      {blockers.map((blocker) => (
        <StackItem key={`${operator.name}-${blocker.code}`}>
          <DescriptionList isCompact>
            <DescriptionListGroup>
              <DescriptionListTerm>{blocker.title}</DescriptionListTerm>
              <DescriptionListDescription>{blocker.description}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Path to resolution</DescriptionListTerm>
              <DescriptionListDescription>
                {blocker.resolution}
                {blocker.actionLabel && blocker.actionHref ? (
                  <div className="pf-v6-u-mt-sm">
                    <Button
                      variant="link"
                      isInline
                      component={Link}
                      to={blocker.actionHref}
                      icon={<ExternalLink />}
                      iconPosition="right"
                    >
                      {blocker.actionLabel}
                    </Button>
                  </div>
                ) : null}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </StackItem>
      ))}
    </Stack>
  );
}

type OlmMigrationEligibilityDetailsPopoverProps = {
  operator: CatalogOperator;
  triggerLabel?: string;
};

export function OlmMigrationEligibilityDetailsPopover({
  operator,
  triggerLabel = "View details",
}: OlmMigrationEligibilityDetailsPopoverProps) {
  const eligibility = operator.olmMigrationEligibility;
  if (!eligibility || eligibility === "eligible") {
    return null;
  }

  return (
    <Popover
      aria-label={`Migration eligibility details for ${operator.name}`}
      headerContent={`${operator.name} — migration unavailable`}
      bodyContent={<OlmMigrationBlockersPanel operator={operator} showHeading={false} />}
      maxWidth="28rem"
    >
      <Button variant="link" isInline>
        {triggerLabel}
      </Button>
    </Popover>
  );
}
