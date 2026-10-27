import { useMemo, useState } from "react";
import { useLocation } from "react-router";
import {
  Alert,
  Card,
  CardBody,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Label,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import {
  InstalledOperatorDetailsSections,
  InstalledOperatorYamlPanel,
  operatorToConsoleModel,
  useInstalledOperatorYaml,
} from "../../components/ecosystem/installedOperator/InstalledOperatorConsolePanels";
import type { CatalogOperator } from "./installedOperatorsTypes";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { OlmV1ClusterExtensionSubscriptionPanel } from "../../components/ecosystem/OlmV1ClusterExtensionSubscriptionPanel";
import { useOlmV1ExtensionLifecycleActions } from "../../components/ecosystem/OlmV1ExtensionLifecycleActions";
import type { OlmV1ClusterExtensionSpec } from "../../components/ecosystem/olmV1ClusterExtensionSpec";
import { OlmMigrationStatusPanel } from "../../components/ecosystem/OlmMigrationStatusPanel";
import { getPrototypeInstalledOperator } from "./installedOperatorsLookup";

type OlmV1ExtensionDetailViewProps = {
  operatorName: string;
};

type ExtensionDetailTab = "details" | "yaml" | "subscription";

function OlmV1ExtensionDetailContent({
  initial,
}: {
  initial: NonNullable<ReturnType<typeof getPrototypeInstalledOperator>>;
}) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<ExtensionDetailTab>(
    location.pathname.endsWith("/subscription") ? "subscription" : "details",
  );
  const [operator, setOperator] = useState(initial);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const operatorPath = `/ecosystem/installed-operators/${encodeURIComponent(operator.name)}`;

  const applySpec = (spec: OlmV1ClusterExtensionSpec) => {
    setOperator((prev) =>
      prev
        ? {
            ...prev,
            channel: spec.channel,
            version: spec.version,
            versionRange: spec.versionRange,
          }
        : prev,
    );
    setSaveMessage("Cluster extension targeting saved (prototype stub).");
  };

  const { actionsDropdown, lifecycleModals, openManageSubscription, canManageClusterExtension } =
    useOlmV1ExtensionLifecycleActions({
      operator,
      onSpecUpdated: applySpec,
    });

  const consoleModel = useMemo(
    () => operatorToConsoleModel(operator as CatalogOperator),
    [operator],
  );
  const operatorYaml = useInstalledOperatorYaml(consoleModel);

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Installed Operators", path: "/ecosystem/installed-operators" },
          { label: operator.name },
        ]}
      >
            <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
              <Flex
                alignItems={{ default: "alignItemsCenter" }}
                justifyContent={{ default: "justifyContentSpaceBetween" }}
                flexWrap={{ default: "wrap" }}
                gap={{ default: "gapMd" }}
              >
                <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                  <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
                    <Title headingLevel="h1" size="2xl">
                      {operator.name}
                    </Title>
                    <Label color="blue" isCompact>
                      Cluster extension
                    </Label>
                  </Flex>
                  <span className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                    {operator.version} · channel {operator.channel} · {operator.source}
                  </span>
                </Flex>
                <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                  <FavoriteButton name={operator.name} path={operatorPath} />
                  {actionsDropdown}
                </Flex>
              </Flex>

              {saveMessage ? (
                <Alert
                  variant="success"
                  title={saveMessage}
                  isInline
                  onTimeout={() => setSaveMessage(null)}
                  timeout={8000}
                />
              ) : null}

              <div className="ocs-gitops-operator-tabs ocs-console-page-tabs">
                <Tabs
                  activeKey={activeTab}
                  onSelect={(_e, key) => setActiveTab(String(key) as ExtensionDetailTab)}
                  aria-label="Cluster extension operator details"
                  className="ocs-console-page-tabs"
                >
                  <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
                  <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
                  <Tab eventKey="subscription" title={<TabTitleText>Subscription</TabTitleText>} />
                </Tabs>
              </div>

              {activeTab === "yaml" ? <InstalledOperatorYamlPanel initialYaml={operatorYaml} /> : null}

              {activeTab === "subscription" ? (
                <OlmV1ClusterExtensionSubscriptionPanel
                  operator={operator}
                  canManage={canManageClusterExtension}
                  onSpecUpdated={applySpec}
                  onManageSubscription={openManageSubscription}
                />
              ) : null}

              {activeTab === "details" ? (
                <>
                  <InstalledOperatorDetailsSections model={consoleModel} />

                  <OlmMigrationStatusPanel operator={operator} variant="cluster-extension" />

                  <Card isPlain>
                    <CardBody>
                      <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-md">
                        Cluster extension details
                      </Title>
                      <DescriptionList isHorizontal isCompact>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Package name</DescriptionListTerm>
                          <DescriptionListDescription>{operator.packageName ?? "—"}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Namespace</DescriptionListTerm>
                          <DescriptionListDescription>{operator.namespace}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Status</DescriptionListTerm>
                          <DescriptionListDescription>{operator.status}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Cluster compatibility</DescriptionListTerm>
                          <DescriptionListDescription>{operator.clusterCompatibility}</DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Managed namespaces</DescriptionListTerm>
                          <DescriptionListDescription>
                            {(operator.managedNamespaces ?? []).join(", ") || "—"}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Automatic updates</DescriptionListTerm>
                          <DescriptionListDescription>
                            {operator.autoUpdate ? "Enabled" : "Manual approval"}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </CardBody>
                  </Card>

                  {operator.compatibilityMessage ? (
                    <Alert variant="warning" title="Compatibility note" isInline>
                      {operator.compatibilityMessage}
                    </Alert>
                  ) : null}
                </>
              ) : null}
            </Flex>
      </Breadcrumbs>
      {lifecycleModals}
    </div>
  );
}

export default function OlmV1ExtensionDetailView({ operatorName }: OlmV1ExtensionDetailViewProps) {
  const initialOperator = useMemo(
    () => getPrototypeInstalledOperator(operatorName),
    [operatorName],
  );

  if (!initialOperator) {
    return (
      <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
        <Breadcrumbs
          items={[
            { label: "Installed Operators", path: "/ecosystem/installed-operators" },
            { label: operatorName },
          ]}
        >
          <Alert variant="warning" title="Operator not found" isInline>
            No prototype data is available for this cluster extension.
          </Alert>
        </Breadcrumbs>
      </div>
    );
  }

  return <OlmV1ExtensionDetailContent initial={initialOperator} />;
}
