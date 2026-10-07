import type { ReactNode } from "react";
import { Link } from "react-router";
import {
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Icon,
  Popover,
  Spinner,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { AlertCircle, CheckCircle, Clock, ExternalLink } from "@/lib/pfIcons";
import { OLM_MODE_LABELS } from "../../contexts/OlmOperatingModeContext";
import type {
  CatalogOperator,
  OlmMigrationBlocker,
  OlmMigrationEligibility,
  OlmMigrationActivityStatus,
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
        title: `Already managed by ${OLM_MODE_LABELS.nextgen}`,
        description: `${op.name} is already under OLMv1 management.`,
        resolution: `Switch to the ${OLM_MODE_LABELS.nextgen} tab to review or update this operator.`,
        actionLabel: `View in ${OLM_MODE_LABELS.nextgen}`,
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
          `Migration requires a healthy operator before management can move to ${OLM_MODE_LABELS.nextgen}.`,
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

type MigrationStatusPresentation = {
  label: string;
  iconStatus: "success" | "danger" | "warning" | "info" | "custom";
  icon: ReactNode;
  tooltipTitle: string;
  tooltipBody: string;
  showSpinner?: boolean;
};

/** Tooltip body tokens aligned with phase-end-date tooltips (inverse surface on dark/glass pages). */
function migrationTooltipBody(title: string, body: string) {
  return (
    <div className="ocs-io-phase-end-date-tooltip-body">
      <div className="ocs-io-phase-end-date-tooltip-body__details">
        <Content component="p" className="pf-v6-u-mb-sm">
          <strong className="ocs-io-phase-end-date-tooltip-body__heading">{title}</strong>
        </Content>
        <Content component="small">{body}</Content>
      </div>
    </div>
  );
}

function presentationForActivity(
  op: CatalogOperator,
  activity: OlmMigrationActivityStatus,
): MigrationStatusPresentation {
  const detail = op.olmMigrationActivityDetail?.trim();
  switch (activity) {
    case "queued":
      return {
        label: "Queued",
        iconStatus: "info",
        icon: <Clock aria-hidden />,
        tooltipTitle: "Migration queued",
        tooltipBody:
          detail ??
          "This operator is waiting to start migration. Work continues in the background; you can leave this page.",
        showSpinner: false,
      };
    case "migrating":
      return {
        label: "In progress",
        iconStatus: "info",
        icon: <Clock aria-hidden />,
        tooltipTitle: "Migration in progress",
        tooltipBody:
          detail ??
          "Catalog management is moving to Next-Gen Operators. Bundle version does not change. Watch toasts for completion.",
        showSpinner: true,
      };
    case "failed_rollback":
      return {
        label: "Failed (rolled back)",
        iconStatus: "danger",
        icon: <AlertCircle aria-hidden />,
        tooltipTitle: "Migration failed — rolled back",
        tooltipBody:
          detail ??
          "Migration did not complete before the point of no return. The operator was automatically rolled back to Classic management. Resolve issues and retry.",
      };
    case "failed_manual":
      return {
        label: "Failed (manual action required)",
        iconStatus: "danger",
        icon: <AlertCircle aria-hidden />,
        tooltipTitle: "Migration failed after point of no return",
        tooltipBody:
          detail ??
          "Automatic rollback does not apply. Review operator conditions, managed resources, and CRDs. Restore from backup if custom resources were removed.",
      };
    case "error":
      return {
        label: "Error",
        iconStatus: "danger",
        icon: <AlertCircle aria-hidden />,
        tooltipTitle: "Migration error",
        tooltipBody:
          detail ??
          "An unexpected error stopped migration. Review operator details and subscription before retrying.",
      };
    case "incomplete":
      return {
        label: "Incomplete",
        iconStatus: "warning",
        icon: <AlertCircle aria-hidden />,
        tooltipTitle: "Migration incomplete",
        tooltipBody:
          detail ??
          "Migration did not finish cleanly. Review the operator and managed resources before you retry.",
      };
    case "succeeded":
      return {
        label: "Migrated",
        iconStatus: "success",
        icon: <CheckCircle aria-hidden />,
        tooltipTitle: "Migration succeeded",
        tooltipBody:
          detail ??
          `This operator is now managed under ${OLM_MODE_LABELS.nextgen}. Bundle version is unchanged.`,
      };
  }
}

function presentationForEligibility(op: CatalogOperator): MigrationStatusPresentation | null {
  const eligibility = op.olmMigrationEligibility;
  if (!eligibility) {
    return null;
  }

  switch (eligibility) {
    case "eligible":
      return {
        label: "Eligible",
        iconStatus: "success",
        icon: <CheckCircle aria-hidden />,
        tooltipTitle: "Migration available",
        tooltipBody: `This operator can migrate to ${OLM_MODE_LABELS.nextgen}. Only catalog management changes; bundle version (${op.version}) stays the same. Use Actions or the row menu to start migration.`,
      };
    case "ineligible": {
      const reason = getMigrationSummaryReason(op);
      const blockers = getMigrationBlockers(op);
      const blockerDetail = blockers[0]?.description;
      return {
        label: "Not eligible",
        iconStatus: "warning",
        icon: <AlertCircle aria-hidden />,
        tooltipTitle: "Migration not available",
        tooltipBody: blockerDetail ? `${reason}. ${blockerDetail}` : reason,
      };
    }
    case "conflict":
      return {
        label: "Blocked",
        iconStatus: "danger",
        icon: <AlertCircle aria-hidden />,
        tooltipTitle: "Migration blocked",
        tooltipBody:
          op.olmMigrationReason ??
          "Platform constraints prevent migration for this operator. Follow platform guidance before retrying.",
      };
    case "migrated":
      return {
        label: "Migrated",
        iconStatus: "success",
        icon: <CheckCircle aria-hidden />,
        tooltipTitle: `Already on ${OLM_MODE_LABELS.nextgen}`,
        tooltipBody: `This operator is already managed under ${OLM_MODE_LABELS.nextgen}. Switch tabs to update or roll back.`,
      };
    default:
      return null;
  }
}

function migrationDetailHref(operator: CatalogOperator): string {
  return `/ecosystem/installed-operators/${encodeURIComponent(operator.name)}`;
}

/** Installed Operators list — migration column (parity with cluster compatibility icon + text). */
export function InstalledOperatorMigrationStatusCell({ operator }: { operator: CatalogOperator }) {
  const presentation = operator.olmMigrationActivity
    ? presentationForActivity(operator, operator.olmMigrationActivity)
    : presentationForEligibility(operator);

  if (!presentation) {
    return <>—</>;
  }

  const row = (
    <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
      {presentation.showSpinner ? (
        <Spinner size="sm" aria-label="Migration in progress" />
      ) : (
        <Icon status={presentation.iconStatus}>{presentation.icon}</Icon>
      )}
      {presentation.label}
    </Flex>
  );

  const tooltipSummary = `${presentation.tooltipTitle}. ${presentation.tooltipBody}`;
  const showMigrationDetails =
    operator.olmMigrationActivity != null || operator.olmMigrationEligibility === "migrated";

  const popoverBody = (
    <Stack hasGutter>
      <StackItem>{migrationTooltipBody(presentation.tooltipTitle, presentation.tooltipBody)}</StackItem>
      {operator.olmMigrationActivityDetail ? (
        <StackItem>
          <Content component="small">
            <strong>Last update:</strong> {operator.olmMigrationActivityDetail}
          </Content>
        </StackItem>
      ) : null}
      {showMigrationDetails ? (
        <StackItem>
          <Button
            component={(props) => <Link {...props} to={migrationDetailHref(operator)} />}
            variant="link"
            isInline
          >
            View migration details
          </Button>
        </StackItem>
      ) : null}
    </Stack>
  );

  return (
    <Popover
      aria-label={`Migration status for ${operator.name}`}
      headerContent={presentation.tooltipTitle}
      bodyContent={popoverBody}
      maxWidth="24rem"
      trigger="click"
    >
      <button
        type="button"
        className="ocs-io-migration-status-tooltip-target pf-v6-c-button pf-m-plain"
        aria-label={`Migration status: ${presentation.label}. ${tooltipSummary}`}
      >
        {row}
      </button>
    </Popover>
  );
}
