import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Grid,
  GridItem,
  MenuToggle,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import ExternalLinkIcon from "@patternfly/react-icons/dist/esm/icons/external-link-alt-icon";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import {
  InstalledOperatorDetailsSections,
  InstalledOperatorSubscriptionPanel,
  InstalledOperatorYamlPanel,
  operatorToConsoleModel,
  useInstalledOperatorYaml,
} from "../../components/ecosystem/installedOperator/InstalledOperatorConsolePanels";
import { ResourceName } from "../gitops/gitopsShared";
import type { CatalogOperator } from "./installedOperatorsTypes";
import { getClassicOperatorChrome, type ClassicProvidedApi } from "./classicOlmOperatorUi";
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

type ClassicOperatorTab = "details" | "yaml" | "subscription" | "events" | "operands";

type ClassicOlmOperatorDetailViewProps = {
  operator: CatalogOperator;
  initialTab?: ClassicOperatorTab;
};

const OPERATOR_EVENTS = [
  {
    reason: "InstallSucceeded",
    message: "install strategy completed with no errors",
    time: "2m ago",
    type: "Normal" as const,
  },
  {
    reason: "AllCatalogSourcesHealthy",
    message: "all available catalogsources are healthy",
    time: "5m ago",
    type: "Normal" as const,
  },
  {
    reason: "UpdateAvailable",
    message: "A newer version is available in the current channel",
    time: "1h ago",
    type: "Warning" as const,
  },
];

function ProvidedApiCard({ api }: { api: ClassicProvidedApi }) {
  return (
    <Card isCompact className="ocs-gitops-operator-api-card">
      <CardTitle>
        <ResourceName kind={api.kind} name={api.kind} />
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

function MetadataSidebar({
  provider,
  createdAt,
  maintainerEmail,
  documentationUrl,
}: {
  provider: string;
  createdAt?: string;
  maintainerEmail: string;
  documentationUrl?: string;
}) {
  return (
    <Card isPlain className="ocs-gitops-operator-sidebar">
      <CardBody>
        <DescriptionList isCompact>
          <DescriptionListGroup>
            <DescriptionListTerm>Provider</DescriptionListTerm>
            <DescriptionListDescription>{provider}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Created at</DescriptionListTerm>
            <DescriptionListDescription>{createdAt ?? "Just now"}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Links</DescriptionListTerm>
            <DescriptionListDescription>
              {documentationUrl ? (
                <Button
                  variant="link"
                  isInline
                  component="a"
                  href={documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={<ExternalLinkIcon aria-hidden />}
                  iconPosition="right"
                >
                  Documentation
                </Button>
              ) : (
                "Not available"
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Maintainers</DescriptionListTerm>
            <DescriptionListDescription>
              {provider} (<a href={`mailto:${maintainerEmail}`}>{maintainerEmail}</a>)
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
    </Card>
  );
}

/**
 * Classic (OLMv0) operator details — matches live OCP 4.21+ Installed Operators console layout.
 */
export default function ClassicOlmOperatorDetailView({
  operator: initialOperator,
  initialTab = "details",
}: ClassicOlmOperatorDetailViewProps) {
  const navigate = useNavigate();
  const [operator, setOperator] = useState(initialOperator);
  const [activeTab, setActiveTab] = useState<ClassicOperatorTab>(initialTab);
  const [actionsOpen, setActionsOpen] = useState(false);

  const chrome = useMemo(() => getClassicOperatorChrome(operator), [operator]);
  const operatorPath = `/ecosystem/installed-operators/${encodeURIComponent(operator.name)}`;

  const consoleModel = useMemo(
    () =>
      operatorToConsoleModel(operator, {
        displayName: chrome.displayName,
        provider: chrome.provider,
      }),
    [operator, chrome.displayName, chrome.provider],
  );
  const operatorYaml = useInstalledOperatorYaml(consoleModel);

  const tabs: { id: ClassicOperatorTab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "yaml", label: "YAML" },
    { id: "subscription", label: "Subscription" },
    { id: "events", label: "Events" },
    { id: "operands", label: chrome.operandTabTitle },
  ];

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Installed Operators", path: "/ecosystem/installed-operators" },
          { label: "Operator details" },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }} className="ocs-gitops-operator-detail">
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
            className="ocs-gitops-operator-detail__page-header"
          >
            <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
              <ResourceName kind={chrome.iconKind} name={chrome.displayName} />
              <span className="ocs-gitops-operator-detail__subtitle">
                {operator.version} provided by {chrome.provider}
              </span>
            </Flex>
            <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
              <FavoriteButton name={chrome.displayName} path={operatorPath} />
              <Dropdown
                isOpen={actionsOpen}
                onOpenChange={setActionsOpen}
                popperProps={{ position: "right" }}
                toggle={(toggleRef) => (
                  <MenuToggle ref={toggleRef} onClick={() => setActionsOpen((v) => !v)} variant="secondary">
                    Actions
                  </MenuToggle>
                )}
              >
                <DropdownList>
                  <DropdownItem
                    itemId="migrate"
                    onClick={() => {
                      setActionsOpen(false);
                      navigate("/ecosystem/installed-operators?migrate=1");
                    }}
                  >
                    Migrate to cluster extensions
                  </DropdownItem>
                </DropdownList>
              </Dropdown>
            </Flex>
          </Flex>

          <div className="ocs-gitops-operator-tabs ocs-gitops-operator-detail__tabs ocs-console-page-tabs">
            <Tabs
              activeKey={activeTab}
              onSelect={(_e, key) => setActiveTab(String(key) as ClassicOperatorTab)}
              aria-label="Classic operator details"
              className="ocs-console-page-tabs"
            >
              {tabs.map((tab) => (
                <Tab key={tab.id} eventKey={tab.id} title={<TabTitleText>{tab.label}</TabTitleText>} />
              ))}
            </Tabs>
          </div>

          {activeTab === "details" ? (
            <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
              <Grid hasGutter className="ocs-gitops-operator-detail__summary">
                <GridItem md={9} lg={9}>
                  <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
                    <Title headingLevel="h2" size="lg">Provided APIs</Title>
                    <div className="ocs-gitops-operator-api-grid">
                      {chrome.providedApis.map((api) => (
                        <ProvidedApiCard key={api.kind} api={api} />
                      ))}
                    </div>
                    <InstalledOperatorDetailsSections model={consoleModel} sections={["description"]} />
                  </Flex>
                </GridItem>
                <GridItem md={3} lg={3}>
                  <MetadataSidebar
                    provider={chrome.provider}
                    createdAt={operator.lastUpdated}
                    maintainerEmail={chrome.maintainerEmail}
                    documentationUrl={chrome.documentationUrl}
                  />
                </GridItem>
              </Grid>
              <InstalledOperatorDetailsSections
                model={consoleModel}
                sections={["csv", "conditions"]}
                leadingDivider
              />
            </Flex>
          ) : null}

          {activeTab === "yaml" ? <InstalledOperatorYamlPanel initialYaml={operatorYaml} /> : null}

          {activeTab === "subscription" ? (
            <InstalledOperatorSubscriptionPanel
              model={consoleModel}
              channel={operator.channel}
              version={operator.version}
              autoUpdate={operator.autoUpdate}
              packageName={operator.packageName}
              onChannelVersionChange={(nextChannel, nextVersion) => {
                setOperator((prev) => ({ ...prev, channel: nextChannel, version: nextVersion }));
              }}
              onApprovalChange={(autoUpdate) => {
                setOperator((prev) => ({ ...prev, autoUpdate }));
              }}
            />
          ) : null}

          {activeTab === "events" ? (
            <Card isPlain>
              <CardBody>
                <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
                  {OPERATOR_EVENTS.map((event) => (
                    <Flex
                      key={event.reason}
                      justifyContent={{ default: "justifyContentSpaceBetween" }}
                      alignItems={{ default: "alignItemsFlexStart" }}
                      gap={{ default: "gapMd" }}
                      className="ocs-io-operator-event-row"
                    >
                      <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsFlexStart" }}>
                        <span
                          className={
                            event.type === "Normal"
                              ? "ocs-io-operator-event-dot ocs-io-operator-event-dot--success"
                              : "ocs-io-operator-event-dot ocs-io-operator-event-dot--warning"
                          }
                          aria-hidden
                        />
                        <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                          <strong>{event.reason}</strong>
                          <span className="pf-v6-u-color-200">{event.message}</span>
                        </Flex>
                      </Flex>
                      <span className="pf-v6-u-color-200 pf-v6-u-font-size-sm">{event.time}</span>
                    </Flex>
                  ))}
                </Flex>
              </CardBody>
            </Card>
          ) : null}

          {activeTab === "operands" ? (
            <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
              <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} alignItems={{ default: "alignItemsCenter" }}>
                <Title headingLevel="h2" size="lg">{chrome.operandTabTitle}s</Title>
                <Button variant="primary">Create {chrome.operandTabTitle}</Button>
              </Flex>
              <OuterScrollContainer>
                <InnerScrollContainer>
                  <Table variant="compact" aria-label={`${chrome.operandTabTitle} instances`}>
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Kind</Th>
                        <Th>Status</Th>
                        <Th>Labels</Th>
                        <Th>Last updated</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td dataLabel="Name">
                          <ResourceName kind={chrome.operandTabTitle} name={chrome.operandTabTitle.toLowerCase()} />
                        </Td>
                        <Td dataLabel="Kind">{chrome.operandTabTitle}</Td>
                        <Td dataLabel="Status">Phase: Pending</Td>
                        <Td dataLabel="Labels">No labels</Td>
                        <Td dataLabel="Last updated">{operator.lastUpdated ?? "Just now"}</Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </InnerScrollContainer>
              </OuterScrollContainer>
            </Flex>
          ) : null}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
