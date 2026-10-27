import { useMemo, useState, type ReactNode } from "react";
import { ConsoleYamlEditor } from "../../console/ConsoleYamlEditor";
import {
  UpdateApprovalModal,
  UpdateChannelModal,
} from "./InstalledOperatorSubscriptionEditModals";
import {
  computeSubscriptionUpgradeStatus,
  subscriptionChannelCatalogForOperator,
} from "./installedOperatorSubscriptionState";
import {
  Button,
  Card,
  CardBody,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Flex,
  Label,
  Title,
} from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ExclamationTriangleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";
import OutlinedClockIcon from "@patternfly/react-icons/dist/esm/icons/outlined-clock-icon";
import PencilAltIcon from "@patternfly/react-icons/dist/esm/icons/pencil-alt-icon";
import {
  InnerScrollContainer,
  OuterScrollContainer,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import type { CatalogOperator } from "../../../pages/ecosystem/installedOperatorsTypes";

export type InstalledOperatorConsoleModel = {
  displayName: string;
  version: string;
  provider: string;
  subscriptionName: string;
  namespace: string;
  channel: string;
  description: string;
  csv: {
    name: string;
    namespace: string;
    status: string;
    statusReason: string;
    labels: string[];
    annotationsCount: number;
    managedNamespaces: string[];
    createdAt: string;
    operatorDeployments: string[];
    operatorGroup: string;
  };
};

export function operatorToConsoleModel(
  operator: CatalogOperator,
  overrides?: Partial<Pick<InstalledOperatorConsoleModel, "displayName" | "provider" | "subscriptionName">>,
): InstalledOperatorConsoleModel {
  const pkg = operator.packageName ?? operator.name.replace(/\s+\(cluster extension\)$/i, "").toLowerCase().replace(/\s+/g, "-");
  return {
    displayName: overrides?.displayName ?? operator.name,
    version: operator.version,
    provider: overrides?.provider ?? (operator.source === "Built-in" ? "Red Hat" : operator.source),
    subscriptionName: overrides?.subscriptionName ?? operator.packageName ?? `${pkg}-operator`,
    namespace: operator.namespace,
    channel: operator.channel,
    description:
      "Represents an Operator package that is available from a given CatalogSource which will resolve to a ClusterServiceVersion.",
    csv: {
      name: `${pkg}.v${operator.version}`,
      namespace: operator.namespace,
      status: operator.status === "Running" ? "Succeeded" : operator.status,
      statusReason: "install strategy completed with no errors",
      labels: [
        `operators.coreos.com/${pkg}.${operator.namespace}`,
        `olm.version=${operator.version}`,
      ],
      annotationsCount: 6,
      managedNamespaces: operator.managedNamespaces?.length ? operator.managedNamespaces : [operator.namespace],
      createdAt: operator.lastUpdated ?? "Just now",
      operatorDeployments: [pkg.replace(/-operator$/, "") || "operator-controller"],
      operatorGroup: "global-operators",
    },
  };
}

export function buildClusterServiceVersionYaml(model: InstalledOperatorConsoleModel): string {
  return `apiVersion: operators.coreos.com/v1alpha1
kind: ClusterServiceVersion
metadata:
  name: ${model.csv.name}
  namespace: ${model.csv.namespace}
  labels:
    olm.version: "${model.version}"
spec:
  displayName: ${model.displayName}
  version: ${model.version}
  provider:
    name: ${model.provider}
  installModes:
    - type: AllNamespaces
      supported: true`;
}

type InstalledOperatorYamlPanelProps = {
  initialYaml: string;
};

export function InstalledOperatorYamlPanel({ initialYaml }: InstalledOperatorYamlPanelProps) {
  return (
    <ConsoleYamlEditor
      initialYaml={initialYaml}
      downloadFileName="clusterserviceversion.yaml"
      ariaLabel="ClusterServiceVersion YAML"
    />
  );
}

function subscriptionConditions(updatedAt: string) {
  return [
    {
      type: "CatalogSourcesUnhealthy",
      status: "False",
      updated: updatedAt,
      reason: "AllCatalogSourcesHealthy",
      message: "all available catalogsources are healthy",
    },
  ];
}

const CSV_CONDITIONS = [
  { phase: "Pending", updated: "Just now", reason: "RequirementsUnknown", message: "requirements not yet checked" },
  { phase: "InstallReady", updated: "Just now", reason: "AllRequirementsMet", message: "all requirements found, attempting install" },
  { phase: "Installing", updated: "Just now", reason: "InstallSucceeded", message: "waiting for install components to report healthy" },
  { phase: "Succeeded", updated: "Just now", reason: "InstallSucceeded", message: "install strategy completed with no errors" },
];

type InstalledOperatorSubscriptionPanelProps = {
  model: InstalledOperatorConsoleModel;
  channel: string;
  version: string;
  autoUpdate: boolean;
  canEdit?: boolean;
  packageName?: string;
  onChannelVersionChange?: (channel: string, version: string) => void;
  onApprovalChange?: (autoUpdate: boolean) => void;
};

export function InstalledOperatorSubscriptionPanel({
  model,
  channel,
  version,
  autoUpdate,
  canEdit = true,
  packageName,
  onChannelVersionChange,
  onApprovalChange,
}: InstalledOperatorSubscriptionPanelProps) {
  const [channelModalOpen, setChannelModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);

  const approvalLabel = autoUpdate ? "Automatic" : "Manual";

  const channelCatalog = useMemo(
    () =>
      subscriptionChannelCatalogForOperator({
        channel,
        version,
        packageName,
        displayName: model.displayName,
      }),
    [channel, version, packageName, model.displayName],
  );

  const upgradeStatus = useMemo(
    () => computeSubscriptionUpgradeStatus(version, channel, channelCatalog),
    [version, channel, channelCatalog],
  );

  const installingCount =
    upgradeStatus.kind === "update-available" && autoUpdate ? 1 : 0;
  const installedCount = 1;

  const statusIcon =
    upgradeStatus.kind === "up-to-date"
      ? <CheckCircleIcon className="ocs-io-subscription-status-icon ocs-io-subscription-status-icon--success" aria-hidden />
      : upgradeStatus.kind === "update-available"
        ? <ExclamationTriangleIcon className="ocs-io-subscription-status-icon ocs-io-subscription-status-icon--warning" aria-hidden />
        : <InfoCircleIcon className="ocs-io-subscription-status-icon ocs-io-subscription-status-icon--info" aria-hidden />;

  const statusFootnote =
    upgradeStatus.kind === "update-available"
      ? `New version ${upgradeStatus.targetVersion} available`
      : upgradeStatus.kind === "newer-than-channel"
        ? "Change channel or version to align with the subscription"
        : null;

  const catalogSourceId = model.provider === "Red Hat" ? "redhat-operators" : "community-operators";
  const installPlanId =
    model.subscriptionName === "advanced-cluster-management"
      ? "install-2zkgm"
      : `install-${model.subscriptionName.replace(/[^a-z0-9]/gi, "").slice(0, 6)}`;
  const subscriptionUpdatedAt = model.csv.createdAt;

  return (
    <div className="ocs-io-operator-detail-sections">
      <UpdateChannelModal
        isOpen={channelModalOpen}
        channel={channel}
        version={version}
        catalog={channelCatalog}
        onClose={() => setChannelModalOpen(false)}
        onSave={(nextChannel, nextVersion) => onChannelVersionChange?.(nextChannel, nextVersion)}
      />
      <UpdateApprovalModal
        isOpen={approvalModalOpen}
        approval={approvalLabel}
        onClose={() => setApprovalModalOpen(false)}
        onSave={(next) => onApprovalChange?.(next === "Automatic")}
      />

      <section className="ocs-io-operator-detail-section">
      <Title headingLevel="h2" size="lg" className="ocs-io-operator-detail-section__title">Subscription details</Title>
      <div className="ocs-io-subscription-cards">
        <Card isCompact className="ocs-io-subscription-card">
          <CardBody className="ocs-io-subscription-card__body">
            <DescriptionList isCompact>
              <DescriptionListGroup>
                <DescriptionListTerm>Update channel</DescriptionListTerm>
                <DescriptionListDescription>
                  <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                    {channel}
                    {canEdit ? (
                      <Button
                        variant="plain"
                        aria-label="Edit update channel"
                        onClick={() => setChannelModalOpen(true)}
                      >
                        <PencilAltIcon aria-hidden />
                      </Button>
                    ) : null}
                  </Flex>
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
            <span className="ocs-io-subscription-card__footnote-spacer" aria-hidden />
          </CardBody>
        </Card>
        <Card isCompact className="ocs-io-subscription-card">
          <CardBody className="ocs-io-subscription-card__body">
            <DescriptionList isCompact>
              <DescriptionListGroup>
                <DescriptionListTerm>Update approval</DescriptionListTerm>
                <DescriptionListDescription>
                  <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                    {approvalLabel}
                    {canEdit ? (
                      <Button
                        variant="plain"
                        aria-label="Edit update approval"
                        onClick={() => setApprovalModalOpen(true)}
                      >
                        <PencilAltIcon aria-hidden />
                      </Button>
                    ) : null}
                  </Flex>
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
            <span className="ocs-io-subscription-card__footnote-spacer" aria-hidden />
          </CardBody>
        </Card>
        <Card isCompact className="ocs-io-subscription-card">
          <CardBody className="ocs-io-subscription-card__body">
            <DescriptionList isCompact>
              <DescriptionListGroup>
                <DescriptionListTerm>Upgrade status</DescriptionListTerm>
                <DescriptionListDescription>
                  <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                    {statusIcon}
                    {upgradeStatus.label}
                  </Flex>
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
            <ContentMuted className="ocs-io-subscription-card__footnote">
              <Flex gap={{ default: "gapXs" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
                <Button variant="link" isInline className="ocs-io-subscription-card__count-link">
                  {installedCount}
                </Button>
                <span>installed</span>
                <span aria-hidden>·</span>
                <Button variant="link" isInline className="ocs-io-subscription-card__count-link">
                  {installingCount}
                </Button>
                <span>installing</span>
              </Flex>
            </ContentMuted>
            {statusFootnote ? (
              <ContentMuted className="ocs-io-subscription-card__footnote">{statusFootnote}</ContentMuted>
            ) : (
              <span className="ocs-io-subscription-card__footnote-spacer" aria-hidden />
            )}
          </CardBody>
        </Card>
      </div>
      </section>

      <Divider className="ocs-io-operator-detail-section__divider" />

      <section className="ocs-io-operator-detail-section">
      <DescriptionList isHorizontal className="ocs-io-subscription-meta ocs-io-operator-detail-dl">
        <DescriptionListGroup>
          <DescriptionListTerm>Name</DescriptionListTerm>
          <DescriptionListDescription>{model.subscriptionName}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Installed version</DescriptionListTerm>
          <DescriptionListDescription>
            <Button variant="link" isInline>CSV {model.csv.name}</Button>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Namespace</DescriptionListTerm>
          <DescriptionListDescription>
            <Label color="green" isCompact>NS</Label> {model.namespace}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Starting version</DescriptionListTerm>
          <DescriptionListDescription>{model.csv.name}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Labels</DescriptionListTerm>
          <DescriptionListDescription>
            <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
              <Label color="blue" isCompact>{model.csv.labels[0]}</Label>
              <Button variant="link" isInline icon={<PencilAltIcon aria-hidden />}>Edit</Button>
            </Flex>
          </DescriptionListDescription>
        </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>CatalogSource</DescriptionListTerm>
            <DescriptionListDescription>
              <Button variant="link" isInline>
                <Label color="blue" isCompact className="pf-v6-u-mr-xs">CS</Label>
                {catalogSourceId}
              </Button>
              <Label color="green" className="pf-v6-u-ml-sm">Healthy</Label>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Created at</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                <OutlinedClockIcon aria-hidden />
                {model.csv.createdAt}
              </Flex>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>InstallPlan</DescriptionListTerm>
            <DescriptionListDescription>
              <Button variant="link" isInline>
                <Label color="blue" isCompact className="pf-v6-u-mr-xs">IP</Label>
                {installPlanId}
              </Button>
            </DescriptionListDescription>
          </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Owner</DescriptionListTerm>
          <DescriptionListDescription>No owner</DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
      </section>

      <Divider className="ocs-io-operator-detail-section__divider" />

      <section className="ocs-io-operator-detail-section">
      <Title headingLevel="h3" size="md" className="ocs-io-operator-detail-section__title">Conditions</Title>
      <OuterScrollContainer>
        <InnerScrollContainer>
          <Table variant="compact" aria-label="Subscription conditions">
            <Thead>
              <Tr>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th>Updated</Th>
                <Th>Reason</Th>
                <Th>Message</Th>
              </Tr>
            </Thead>
            <Tbody>
              {subscriptionConditions(subscriptionUpdatedAt).map((row) => (
                <Tr key={row.type}>
                  <Td dataLabel="Type">{row.type}</Td>
                  <Td dataLabel="Status">{row.status}</Td>
                  <Td dataLabel="Updated">
                    <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                      <OutlinedClockIcon aria-hidden />
                      {row.updated}
                    </Flex>
                  </Td>
                  <Td dataLabel="Reason">{row.reason}</Td>
                  <Td dataLabel="Message">{row.message}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </InnerScrollContainer>
      </OuterScrollContainer>
      </section>
    </div>
  );
}

function ContentMuted({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={`pf-v6-u-color-200 pf-v6-u-font-size-sm pf-v6-u-mt-sm ${className ?? ""}`.trim()}>
      {children}
    </p>
  );
}

export type InstalledOperatorDetailsSectionId = "description" | "csv" | "conditions";

const DEFAULT_DETAIL_SECTIONS: InstalledOperatorDetailsSectionId[] = ["description", "csv", "conditions"];

type InstalledOperatorDetailsSectionsProps = {
  model: InstalledOperatorConsoleModel;
  sections?: InstalledOperatorDetailsSectionId[];
  /** When true, draws a divider above the first rendered section (e.g. below Provided APIs). */
  leadingDivider?: boolean;
};

export function InstalledOperatorDetailsSections({
  model,
  sections = DEFAULT_DETAIL_SECTIONS,
  leadingDivider = false,
}: InstalledOperatorDetailsSectionsProps) {
  const visibleSections = DEFAULT_DETAIL_SECTIONS.filter((id) => sections.includes(id));

  const renderSection = (id: InstalledOperatorDetailsSectionId) => {
    if (id === "description") {
      return (
        <section className="ocs-io-operator-detail-section ocs-io-operator-detail-section--description">
          <Title headingLevel="h2" size="lg" className="ocs-io-operator-detail-section__title">Description</Title>
          <p className="ocs-io-operator-detail-section__body pf-v6-u-color-200">{model.description}</p>
        </section>
      );
    }

    if (id === "csv") {
      return (
        <section className="ocs-io-operator-detail-section">
          <Title headingLevel="h2" size="lg" className="ocs-io-operator-detail-section__title">
            ClusterServiceVersion details
          </Title>
          <DescriptionList isHorizontal className="ocs-io-csv-details ocs-io-operator-detail-dl">
          <DescriptionListGroup>
            <DescriptionListTerm>Name</DescriptionListTerm>
            <DescriptionListDescription>{model.csv.name}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Status</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                <CheckCircleIcon className="pf-v6-u-color-100" aria-hidden />
                {model.csv.status}
              </Flex>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Namespace</DescriptionListTerm>
            <DescriptionListDescription>
              <Label color="green" isCompact>NS</Label> {model.csv.namespace}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Status reason</DescriptionListTerm>
            <DescriptionListDescription>{model.csv.statusReason}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Labels</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
                {model.csv.labels.map((label) => (
                  <Label key={label} color="blue" isCompact>{label}</Label>
                ))}
                <Button variant="link" isInline icon={<PencilAltIcon aria-hidden />}>Edit</Button>
              </Flex>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Operator Deployments</DescriptionListTerm>
            <DescriptionListDescription>
              <Label color="blue" isCompact>D</Label> {model.csv.operatorDeployments[0]}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Annotations</DescriptionListTerm>
            <DescriptionListDescription>
              <Button variant="link" isInline icon={<PencilAltIcon aria-hidden />}>
                {model.csv.annotationsCount} annotations
              </Button>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>OperatorGroup</DescriptionListTerm>
            <DescriptionListDescription>
              <Label color="blue" isCompact>OG</Label> {model.csv.operatorGroup}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Managed Namespaces</DescriptionListTerm>
            <DescriptionListDescription>
              <Label color="green" isCompact>NS</Label> {model.csv.managedNamespaces.join(", ")}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Created at</DescriptionListTerm>
            <DescriptionListDescription>{model.csv.createdAt}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Owner</DescriptionListTerm>
            <DescriptionListDescription>No owner</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
        </section>
      );
    }

    return (
      <section className="ocs-io-operator-detail-section">
        <Title headingLevel="h3" size="md" className="ocs-io-operator-detail-section__title">Conditions</Title>
        <OuterScrollContainer>
          <InnerScrollContainer>
            <Table variant="compact" aria-label="ClusterServiceVersion conditions">
              <Thead>
                <Tr>
                  <Th>Phase</Th>
                  <Th>Updated</Th>
                  <Th>Reason</Th>
                  <Th>Message</Th>
                </Tr>
              </Thead>
              <Tbody>
                {CSV_CONDITIONS.map((row) => (
                  <Tr key={`${row.phase}-${row.reason}`}>
                    <Td dataLabel="Phase">{row.phase}</Td>
                    <Td dataLabel="Updated">{row.updated}</Td>
                    <Td dataLabel="Reason">{row.reason}</Td>
                    <Td dataLabel="Message">{row.message}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </InnerScrollContainer>
        </OuterScrollContainer>
      </section>
    );
  };

  return (
    <div className="ocs-io-operator-detail-sections">
      {visibleSections.map((id, index) => (
        <div key={id}>
          {index === 0 && leadingDivider ? <Divider className="ocs-io-operator-detail-section__divider" /> : null}
          {index > 0 ? <Divider className="ocs-io-operator-detail-section__divider" /> : null}
          {renderSection(id)}
        </div>
      ))}
    </div>
  );
}

export function useInstalledOperatorYaml(model: InstalledOperatorConsoleModel) {
  return useMemo(() => buildClusterServiceVersionYaml(model), [model]);
}
