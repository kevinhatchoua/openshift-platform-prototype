import { useState } from "react";
import { Link } from "react-router";
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  CodeBlock,
  CodeBlockCode,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Grid,
  GridItem,
  Label,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import PencilAltIcon from "@patternfly/react-icons/dist/esm/icons/pencil-alt-icon";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import {
  OlmV1ExtensionUpdateAlert,
  useOlmV1ExtensionLifecycleActions,
} from "../../components/ecosystem/OlmV1ExtensionLifecycleActions";
import { getPrototypeInstalledOperator } from "../ecosystem/installedOperatorsLookup";
import { ResourceName } from "./gitopsShared";

type ProvidedApi = {
  kind: string;
  abbrev: string;
  description: string;
  createDisabled?: boolean;
};

const GITOPS_PROVIDED_APIS: ProvidedApi[] = [
  {
    kind: "Argo CD",
    abbrev: "ACD",
    description: "Argo CD is the representation of an Argo CD deployment.",
  },
  {
    kind: "NamespaceManagement",
    abbrev: "NM",
    description: "Not available",
    createDisabled: true,
  },
  {
    kind: "AnalysisRun",
    abbrev: "AR",
    description:
      "An AnalysisRun is an instantiation of an AnalysisTemplate. AnalysisRuns are like Jobs in that they eventually complete.",
  },
  {
    kind: "AnalysisTemplate",
    abbrev: "AT",
    description:
      "An AnalysisTemplate is a template spec which defines how to perform a canary analysis, such as the metrics, its frequency, and the values which are considered successful or failed.",
  },
  {
    kind: "Application",
    abbrev: "A",
    description: "An Application is a group of Kubernetes resources as defined by a manifest.",
  },
  {
    kind: "ApplicationSet",
    abbrev: "AS",
    description: "ApplicationSet is the representation of an ApplicationSet controller deployment.",
  },
  {
    kind: "AppProject",
    abbrev: "AP",
    description: "An AppProject is a logical grouping of Argo CD Applications.",
  },
  {
    kind: "ClusterAnalysisTemplate",
    abbrev: "CAT",
    description:
      "A ClusterAnalysisTemplate is like an AnalysisTemplate, but it is not limited to its namespace. It can be used by any Rollout throughout the cluster.",
  },
  {
    kind: "Experiment",
    abbrev: "E",
    description:
      "An Experiment is limited run of one or more ReplicaSets for the purposes of analysis.",
  },
  {
    kind: "ImageUpdater",
    abbrev: "U",
    description: "ImageUpdater is the Schema for the imageupdaters API",
  },
  {
    kind: "NotificationsConfiguration",
    abbrev: "NC",
    description:
      "NotificationsConfigurations contains the notification template used to generate notifications.",
  },
  {
    kind: "RolloutManager",
    abbrev: "RM",
    description: "A controller for managing Argo Rollouts",
  },
  {
    kind: "Rollout",
    abbrev: "R",
    description: "Not available",
    createDisabled: true,
  },
];

const OPERATOR_TABS = [
  "details",
  "yaml",
  "subscription",
  "events",
  "all-instances",
  ...GITOPS_PROVIDED_APIS.map((api) => api.kind.toLowerCase().replace(/\s+/g, "-")),
] as const;

type OperatorTab = (typeof OPERATOR_TABS)[number];

function tabLabel(tab: OperatorTab): string {
  if (tab === "all-instances") return "All instances";
  if (tab === "details") return "Details";
  return tab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ProvidedApiCard({ api }: { api: ProvidedApi }) {
  return (
    <Card isCompact className="ocs-gitops-operator-api-card">
      <CardTitle>
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <ResourceName kind={api.kind} name={api.kind} />
        </Flex>
      </CardTitle>
      <CardBody>
        <p className="ocs-gitops-operator-api-card__desc">{api.description}</p>
        {api.createDisabled ? (
          <span className="ocs-gitops-operator-api-card__create ocs-gitops-operator-api-card__create--disabled">
            Create instance
          </span>
        ) : (
          <Button variant="link" isInline className="ocs-gitops-operator-api-card__create">
            Create instance
          </Button>
        )}
      </CardBody>
    </Card>
  );
}

export default function GitOpsOperatorDetailView({ operatorName }: { operatorName: string }) {
  const [activeTab, setActiveTab] = useState<OperatorTab>("details");
  const lookupOperator = getPrototypeInstalledOperator(operatorName);
  const [operator, setOperator] = useState(
    () =>
      lookupOperator ?? {
        name: operatorName,
        namespace: "openshift-gitops-operator",
        version: "1.12.4",
        channel: "gitops-1.12",
        source: "redhat-operators",
        status: "Running" as const,
        autoUpdate: true,
        clusterCompatibility: "Compatible" as const,
        isOlmV1Extension: true,
        updateAvailable: "1.13.0",
        managedNamespaces: ["openshift-gitops"],
      },
  );
  const operatorPath = `/ecosystem/installed-operators/${encodeURIComponent(operatorName)}`;
  const displayName = "Red Hat OpenShift GitOps";
  const version = operator.version;

  const { actionsDropdown, lifecycleModals, openUpdate } = useOlmV1ExtensionLifecycleActions({
    operator,
    onVersionUpdated: (newVersion) => {
      setOperator((prev) => ({
        ...prev,
        version: newVersion,
        updateAvailable: undefined,
      }));
    },
  });

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Installed Operators", path: "/ecosystem/installed-operators" },
          { label: "Operator details" },
        ]}
      >
        <Grid hasGutter>
          <GridItem md={9}>
            <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
              <Flex
                alignItems={{ default: "alignItemsCenter" }}
                justifyContent={{ default: "justifyContentSpaceBetween" }}
                flexWrap={{ default: "wrap" }}
                gap={{ default: "gapMd" }}
              >
                <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                  <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
                    <ResourceName kind="ArgoCD" name={displayName} />
                  </Flex>
                  <span className="ocs-gitops-operator-detail__subtitle">
                    {version} provided by Red Hat Inc
                  </span>
                </Flex>
                <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                  <FavoriteButton name={displayName} path={operatorPath} />
                  {actionsDropdown}
                </Flex>
              </Flex>

              <OlmV1ExtensionUpdateAlert operator={operator} onUpdate={openUpdate} />

              <div className="ocs-gitops-operator-tabs">
                <Tabs
                  activeKey={activeTab}
                  onSelect={(_e, key) => setActiveTab(String(key) as OperatorTab)}
                  aria-label="GitOps operator details"
                  role="region"
                >
                  {OPERATOR_TABS.map((tab) => (
                    <Tab key={tab} eventKey={tab} title={<TabTitleText>{tabLabel(tab)}</TabTitleText>} />
                  ))}
                </Tabs>
              </div>

              {activeTab === "details" ? (
                <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
                  <Title headingLevel="h2" size="lg">
                    Provided APIs
                  </Title>
                  <div className="ocs-gitops-operator-api-grid">
                    {GITOPS_PROVIDED_APIS.map((api) => (
                      <ProvidedApiCard key={api.kind} api={api} />
                    ))}
                  </div>
                </Flex>
              ) : null}

              {activeTab === "yaml" ? (
                <CodeBlock>
                  <CodeBlockCode>{`apiVersion: operators.coreos.com/v1alpha1
kind: ClusterServiceVersion
metadata:
  name: openshift-gitops.v${version}
  namespace: openshift-gitops-operator
spec:
  displayName: ${displayName}
  version: ${version}
  provider:
    name: Red Hat Inc`}</CodeBlockCode>
                </CodeBlock>
              ) : null}

              {activeTab === "subscription" ? (
                <DescriptionList isHorizontal isCompact>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Channel</DescriptionListTerm>
                    <DescriptionListDescription>gitops-1.12</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Approval</DescriptionListTerm>
                    <DescriptionListDescription>Automatic</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Starting version</DescriptionListTerm>
                    <DescriptionListDescription>{version}</DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              ) : null}

              {activeTab === "events" ? (
                <DescriptionList isHorizontal isCompact>
                  <DescriptionListGroup>
                    <DescriptionListTerm>InstallSucceeded</DescriptionListTerm>
                    <DescriptionListDescription>install strategy completed with no errors</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>AllCatalogSourcesHealthy</DescriptionListTerm>
                    <DescriptionListDescription>all available catalogsources are healthy</DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              ) : null}

              {activeTab === "all-instances" ? (
                <DescriptionList isHorizontal isCompact>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Argo CD</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Link to="/gitops/argocd">openshift-gitops</Link>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              ) : null}

              {activeTab !== "details" &&
              activeTab !== "yaml" &&
              activeTab !== "subscription" &&
              activeTab !== "events" &&
              activeTab !== "all-instances" ? (
                <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
                  <Title headingLevel="h2" size="lg">
                    {tabLabel(activeTab)}
                  </Title>
                  <p className="ocs-gitops-operator-cr-tab__empty">
                    No {tabLabel(activeTab)} instances in this namespace. Use Create instance on the Details tab to add
                    one.
                  </p>
                </Flex>
              ) : null}
            </Flex>
          </GridItem>

          <GridItem md={3}>
            <Card isPlain className="ocs-gitops-operator-sidebar">
              <CardBody>
                <DescriptionList isCompact>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Provider</DescriptionListTerm>
                    <DescriptionListDescription>Red Hat Inc</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Created at</DescriptionListTerm>
                    <DescriptionListDescription>2 minutes ago</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Console plugin</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                        <code>gitops-plugin</code>: <Label color="green">Enabled</Label>
                        <Button variant="plain" aria-label="Edit console plugin">
                          <PencilAltIcon aria-hidden />
                        </Button>
                      </Flex>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Links</DescriptionListTerm>
                    <DescriptionListDescription>Not available</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Maintainers</DescriptionListTerm>
                    <DescriptionListDescription>
                      OpenShift GitOps Team (
                      <a href="mailto:team-gitops@redhat.com">team-gitops@redhat.com</a>)
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </Breadcrumbs>
      {lifecycleModals}
    </div>
  );
}
