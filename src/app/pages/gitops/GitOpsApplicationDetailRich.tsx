import { useMemo, useState } from "react";
import { useParams } from "react-router";
import {
  Alert,
  Button,
  CodeBlock,
  CodeBlockCode,
  Content,
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
  ToggleGroup,
  ToggleGroupItem,
} from "@patternfly/react-core";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { OcsPrototypeListTable, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import {
  findApplication,
  findAppProject,
  gitopsDetailPath,
  GITOPS_PROMOTION_PIPELINES,
  applicationSyncError,
  applicationMetricsCharts,
  GITOPS_ALL_INSTANCES,
  type ApplicationRecord,
} from "./gitopsData";
import { GitOpsNotFound } from "./GitOpsSimpleDetailPage";
import { GitOpsEditDeleteMenu, GitOpsLink, HealthStatus, OwnerReferencesCell, ResourceName } from "./gitopsShared";
import { gitOpsHealthLabelColor, gitOpsSyncLabelColor, PF_CHART } from "../../lib/pfSemanticColors";
import { useToast } from "../../contexts/ToastContext";
import GitOpsTopologyView from "./GitOpsTopologyView";
import { buildApplicationResourceGraph } from "./gitopsTopologyData";
import GitOpsYamlUnifiedDiff from "./GitOpsYamlUnifiedDiff";
import GitOpsLogStream from "./GitOpsLogStream";
import GitOpsAccessTestPanel from "./GitOpsAccessTestPanel";
import { useGitOpsInstance } from "./GitOpsInstancePicker";

function promotionForApp(appName: string) {
  return GITOPS_PROMOTION_PIPELINES.find(
    (p) => p.name.includes(appName) || appName.includes(p.name.replace(/-promote$/, ""))
  );
}

const LOG_CONTAINERS = ["application-controller", "repo-server", "redis"] as const;

const MOCK_LOGS: Record<(typeof LOG_CONTAINERS)[number], string> = {
  "application-controller": `time="2026-08-25T14:22:01Z" level=info msg="Reconciliation started" app=payments-api
time="2026-08-25T14:22:01Z" level=info msg="Comparing desired state" revision=release-1.4
time="2026-08-25T14:22:02Z" level=warning msg="OutOfSync detected" resource=Deployment/payments-api
time="2026-08-25T14:22:02Z" level=info msg="Sync operation skipped (auto-sync disabled)"
time="2026-08-25T14:22:03Z" level=info msg="Health status Progressing"`,
  "repo-server": `time="2026-08-25T14:21:58Z" level=info msg="git fetch" repo=payments-api.git
time="2026-08-25T14:21:59Z" level=info msg="manifest generate" path=deploy/overlays/prod
time="2026-08-25T14:22:00Z" level=info msg="cache hit" revision=release-1.4`,
  redis: `1:M 25 Aug 2026 14:21:50.123 * Background saving started
1:M 25 Aug 2026 14:21:50.456 * DB saved on disk
1:M 25 Aug 2026 14:22:00.001 * Connected clients: 4`,
};

function liveYaml(rec: ApplicationRecord) {
  const image =
    rec.name === "payments-api" ? "quay.io/demo/payments-api:1.4.1" : "quay.io/demo/app:latest";
  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${rec.name}
  namespace: ${rec.destination.split(" / ").pop() ?? rec.ns}
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: ${rec.name}
          image: ${image}`;
}

function desiredYaml(rec: ApplicationRecord) {
  const image =
    rec.name === "payments-api" ? "quay.io/demo/payments-api:1.4.2" : "quay.io/demo/app:latest";
  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${rec.name}
  namespace: ${rec.destination.split(" / ").pop() ?? rec.ns}
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: ${rec.name}
          image: ${image}`;
}

function appYaml(rec: ApplicationRecord) {
  return `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ${rec.name}
  namespace: ${rec.ns}
spec:
  project: ${rec.project}
  source:
    repoURL: ${rec.repo}
    path: ${rec.path}
    targetRevision: ${rec.revision}
  destination:
    name: in-cluster
    namespace: ${rec.destination.split(" / ").pop() ?? rec.ns}
  syncPolicy: {}
status:
  sync:
    status: ${rec.sync}
  health:
    status: ${rec.health}`;
}

const MOCK_EVENTS = [
  { type: "Normal", reason: "ResourceUpdated", message: "Updated sync status", age: "2m" },
  { type: "Warning", reason: "ComparisonError", message: "Live manifest differs from desired", age: "5m" },
  { type: "Normal", reason: "OperationCompleted", message: "Last sync completed successfully", age: "1h" },
];

function metricsFor(rec: ApplicationRecord) {
  const outOfSync = rec.sync === "OutOfSync";
  return {
    syncTotals: outOfSync ? "12 synced · 1 out of sync" : "48 synced · 0 out of sync",
    successRate: outOfSync ? "91.2%" : "99.4%",
    reconciliations: outOfSync ? "186" : "412",
    resourceHealth: outOfSync ? "7 healthy · 1 progressing" : "14 healthy · 0 degraded",
  };
}

export default function GitOpsApplicationDetailRich() {
  const { namespace = "", name = "" } = useParams();
  const ns = decodeURIComponent(namespace);
  const appName = decodeURIComponent(name);
  const rec = findApplication(ns, appName);
  const [activeTab, setActiveTab] = useState("details");
  const [logContainer, setLogContainer] = useState<(typeof LOG_CONTAINERS)[number]>("application-controller");
  const { pushToast } = useToast();

  const metrics = useMemo(() => (rec ? metricsFor(rec) : null), [rec]);
  const metricCharts = useMemo(() => (rec ? applicationMetricsCharts(rec) : null), [rec]);
  const resourceGraph = useMemo(() => (rec ? buildApplicationResourceGraph(rec) : null), [rec]);
  const syncError = rec ? applicationSyncError(rec) : null;
  const { instance } = useGitOpsInstance();
  const instanceScoped = rec ? rec.instanceKey === instance || instance === GITOPS_ALL_INSTANCES : true;

  if (!rec) {
    return <GitOpsNotFound listPath="/gitops/applications" listTitle="Applications" />;
  }

  const href = gitopsDetailPath("applications", rec.ns, rec.name);
  const promotion = promotionForApp(rec.name);

  return (
    <div className="ocs-app-page-outer ocs-pod-details-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/overview" },
          { label: "Applications", path: "/gitops/applications" },
          { label: rec.name },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
              <ResourceName kind="Application" name={rec.name} />
              <HealthStatus status={rec.health} />
              <HealthStatus status={rec.sync} />
            </Flex>
            <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
              <FavoriteButton name={rec.name} path={href} />
              <GitOpsEditDeleteMenu
                kind="Application"
                name={rec.name}
                variant="secondary"
                extraItems={[
                  { id: "sync", label: "Sync" },
                  { id: "refresh", label: "Refresh" },
                  { id: "hard-refresh", label: "Hard refresh" },
                ]}
              />
            </Flex>
          </Flex>

          {syncError ? (
            <Alert variant="warning" isInline title={syncError.title}>
              {syncError.detail}
              {syncError.agentHint ? (
                <Content component="p" className="pf-v6-u-mt-sm">
                  {syncError.agentHint}
                </Content>
              ) : null}
            </Alert>
          ) : null}

          <Tabs
            activeKey={activeTab}
            onSelect={(_e, key) => setActiveTab(String(key))}
            aria-label="Application details"
          >
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
            <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
            <Tab eventKey="configuration" title={<TabTitleText>Configuration</TabTitleText>} />
            <Tab eventKey="diff" title={<TabTitleText>Diff</TabTitleText>} />
            <Tab eventKey="events" title={<TabTitleText>Events</TabTitleText>} />
            <Tab eventKey="history" title={<TabTitleText>History</TabTitleText>} />
            <Tab eventKey="logs" title={<TabTitleText>Logs</TabTitleText>} />
            <Tab eventKey="metrics" title={<TabTitleText>Metrics</TabTitleText>} />
            <Tab eventKey="promotion" title={<TabTitleText>Promotion</TabTitleText>} />
            <Tab eventKey="resource-tree" title={<TabTitleText>Resource Tree</TabTitleText>} />
            <Tab eventKey="resources" title={<TabTitleText>Resources</TabTitleText>} />
            <Tab eventKey="access-test" title={<TabTitleText>Access Test</TabTitleText>} />
            <Tab eventKey="summary" title={<TabTitleText>Summary</TabTitleText>} />
          </Tabs>

          {activeTab === "details" ? (
            <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
              {promotion ? (
                <Alert
                  variant="info"
                  title={`Promotion: ${promotion.name} (${promotion.status})`}
                  isInline
                >
                  <Content component="p">
                    Environments: {promotion.environments}. Gates: {promotion.gates}.
                  </Content>
                </Alert>
              ) : null}
              <DescriptionList isHorizontal isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>Name</DescriptionListTerm>
                  <DescriptionListDescription>{rec.name}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Namespace</DescriptionListTerm>
                  <DescriptionListDescription>
                    <ResourceName
                      kind="Namespace"
                      name={rec.ns}
                      to={`/administration/namespaces/${encodeURIComponent(rec.ns)}`}
                    />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Labels</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                      <span>No labels</span>
                      <Button
                        variant="link"
                        isInline
                        onClick={() => pushToast({ variant: "info", title: `Edit labels: ${rec.name}` })}
                      >
                        Edit
                      </Button>
                    </Flex>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>AppProject</DescriptionListTerm>
                  <DescriptionListDescription>
                    {(() => {
                      const project = findAppProject(rec.ns, rec.project) ?? findAppProject("argocd", rec.project);
                      return project ? (
                        <GitOpsLink to={gitopsDetailPath("appprojects", project.ns, project.name)}>
                          {rec.project}
                        </GitOpsLink>
                      ) : (
                        rec.project
                      );
                    })()}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Sync status</DescriptionListTerm>
                  <DescriptionListDescription>
                    <HealthStatus status={rec.sync} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Repo</DescriptionListTerm>
                  <DescriptionListDescription>{rec.repo}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Path</DescriptionListTerm>
                  <DescriptionListDescription>
                    <code>{rec.path}</code>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Revision</DescriptionListTerm>
                  <DescriptionListDescription>
                    <code>{rec.revision}</code>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Destination</DescriptionListTerm>
                  <DescriptionListDescription>{rec.destination}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Owner references</DescriptionListTerm>
                  <DescriptionListDescription>
                    <OwnerReferencesCell refs={rec.ownerReferences} ns={rec.ns} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </Flex>
          ) : null}

          {!instanceScoped ? (
            <Alert variant="info" isInline title="Viewing application outside selected instance scope">
              Instance filter is <code>{instance}</code>. Metrics reflect this application only; switch instance
              in the header to align list and detail context.
            </Alert>
          ) : null}

          {activeTab === "logs" ? (
            <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
              <ToggleGroup aria-label="Log container" isCompact>
                {LOG_CONTAINERS.map((c) => (
                  <ToggleGroupItem
                    key={c}
                    text={c}
                    isSelected={logContainer === c}
                    onChange={() => setLogContainer(c)}
                  />
                ))}
              </ToggleGroup>
              <GitOpsLogStream initial={MOCK_LOGS[logContainer]} container={logContainer} />
            </Flex>
          ) : null}

          {activeTab === "diff" ? (
            <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
              {rec.sync === "OutOfSync" ? (
                <Alert variant="warning" title="OutOfSync — live differs from desired" isInline>
                  <Content component="p">
                    Intentional drift for <code>{rec.name}</code> (image tag mismatch).
                  </Content>
                </Alert>
              ) : (
                <Alert variant="success" title="Synced — no material differences" isInline />
              )}
              <GitOpsYamlUnifiedDiff live={liveYaml(rec)} desired={desiredYaml(rec)} />
              <Grid hasGutter>
                <GridItem md={6}>
                  <Title headingLevel="h3" size="md">
                    Live
                  </Title>
                  <CodeBlock>
                    <CodeBlockCode>{liveYaml(rec)}</CodeBlockCode>
                  </CodeBlock>
                </GridItem>
                <GridItem md={6}>
                  <Title headingLevel="h3" size="md">
                    Desired
                  </Title>
                  <CodeBlock>
                    <CodeBlockCode>{desiredYaml(rec)}</CodeBlockCode>
                  </CodeBlock>
                </GridItem>
              </Grid>
            </Flex>
          ) : null}

          {activeTab === "metrics" && metrics && metricCharts ? (
            <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
              <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
                <Label color={gitOpsSyncLabelColor(rec.sync)} isCompact>Sync: {rec.sync}</Label>
                <Label color={gitOpsHealthLabelColor(rec.health)} isCompact>Health: {rec.health}</Label>
                <Label color="grey" isCompact>
                  Instance: {rec.instanceKey}
                </Label>
              </Flex>
              <Grid hasGutter>
                <GridItem md={6}>
                  <Title headingLevel="h3" size="md">
                    Sync success rate (24h)
                  </Title>
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metricCharts.syncRate}>
                        <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                        <YAxis domain={[70, 100]} tick={{ fontSize: 11 }} width={32} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="v"
                          stroke="var(--pf-t--global--color--status--success--default)"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </GridItem>
                <GridItem md={6}>
                  <Title headingLevel="h3" size="md">
                    Reconciliations (24h)
                  </Title>
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metricCharts.reconciliations}>
                        <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} width={32} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="v"
                          stroke={PF_CHART.info}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </GridItem>
              </Grid>
              <DescriptionList isHorizontal isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>Sync totals</DescriptionListTerm>
                  <DescriptionListDescription>{metrics.syncTotals}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Success rate</DescriptionListTerm>
                  <DescriptionListDescription>{metrics.successRate}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Reconciliations (24h)</DescriptionListTerm>
                  <DescriptionListDescription>{metrics.reconciliations}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Resource health</DescriptionListTerm>
                  <DescriptionListDescription>{metrics.resourceHealth}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </Flex>
          ) : null}

          {activeTab === "access-test" ? (
            <GitOpsAccessTestPanel resourceLabel={`Application ${rec.name}`} defaultResource="applications" />
          ) : null}

          {activeTab === "yaml" ? (
            <CodeBlock>
              <CodeBlockCode>{appYaml(rec)}</CodeBlockCode>
            </CodeBlock>
          ) : null}

          {activeTab === "events" ? (
            <div className="ocs-pods-list__panel">
              <OcsPrototypeListTable ariaLabel="Application events">
                <Thead>
                  <Tr>
                    <Th dataLabel="Type">
                      <PlainTableHeader label="Type" />
                    </Th>
                    <Th dataLabel="Reason">
                      <PlainTableHeader label="Reason" />
                    </Th>
                    <Th dataLabel="Message">
                      <PlainTableHeader label="Message" />
                    </Th>
                    <Th dataLabel="Age">
                      <PlainTableHeader label="Age" />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {MOCK_EVENTS.map((ev) => (
                    <Tr key={`${ev.reason}-${ev.age}`}>
                      <Td dataLabel="Type">
                        <Label color={ev.type === "Warning" ? "orange" : "blue"} isCompact>
                          {ev.type}
                        </Label>
                      </Td>
                      <Td dataLabel="Reason">{ev.reason}</Td>
                      <Td dataLabel="Message">{ev.message}</Td>
                      <Td dataLabel="Age">{ev.age}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </OcsPrototypeListTable>
            </div>
          ) : null}

          {activeTab === "configuration" ? (
            <DescriptionList isHorizontal isCompact>
              <DescriptionListGroup>
                <DescriptionListTerm>Auto-sync</DescriptionListTerm>
                <DescriptionListDescription>Disabled</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Prune</DescriptionListTerm>
                <DescriptionListDescription>false</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Self-heal</DescriptionListTerm>
                <DescriptionListDescription>false</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Retry</DescriptionListTerm>
                <DescriptionListDescription>Limit 5 · backoff 5s–3m</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Ignore differences</DescriptionListTerm>
                <DescriptionListDescription>None</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          ) : null}

          {activeTab === "history" ? (
            <OcsPrototypeListTable ariaLabel="Sync history">
              <Thead>
                <Tr>
                  <Th dataLabel="Revision">
                    <PlainTableHeader label="Revision" />
                  </Th>
                  <Th dataLabel="Deployed">
                    <PlainTableHeader label="Deployed" />
                  </Th>
                  <Th dataLabel="Author">
                    <PlainTableHeader label="Author" />
                  </Th>
                  <Th dataLabel="Message">
                    <PlainTableHeader label="Message" />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td dataLabel="Revision">
                    <code>{rec.revision.slice(0, 12)}</code>
                  </Td>
                  <Td dataLabel="Deployed">{rec.lastReconciled}</Td>
                  <Td dataLabel="Author">gitops-controller</Td>
                  <Td dataLabel="Message">Sync to desired revision</Td>
                </Tr>
              </Tbody>
            </OcsPrototypeListTable>
          ) : null}

          {activeTab === "promotion" ? (
            <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
              {promotion ? (
                <>
                  <Alert variant="info" title={`${promotion.name} is ${promotion.status}`} isInline>
                    Environments: {promotion.environments}. Gates: {promotion.gates}.
                  </Alert>
                  <GitOpsLink to={gitopsDetailPath("promotions", promotion.ns, promotion.name)}>
                    Open promotion pipeline
                  </GitOpsLink>
                </>
              ) : (
                <>
                  <Content component="p">No promotion pipeline is attached to this application.</Content>
                  <GitOpsLink to="/gitops/promotions">View promotion pipelines</GitOpsLink>
                </>
              )}
            </Flex>
          ) : null}

          {activeTab === "resource-tree" && resourceGraph ? (
            <GitOpsTopologyView graph={resourceGraph} ariaLabel={`Application ${rec.name} resource graph`} />
          ) : null}

          {activeTab === "resources" ? (
            <OcsPrototypeListTable ariaLabel="Live resources">
              <Thead>
                <Tr>
                  <Th dataLabel="Kind">
                    <PlainTableHeader label="Kind" />
                  </Th>
                  <Th dataLabel="Name">
                    <PlainTableHeader label="Name" />
                  </Th>
                  <Th dataLabel="Status">
                    <PlainTableHeader label="Status" />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {[
                  { kind: "Deployment", name: rec.name, status: rec.health },
                  { kind: "Service", name: rec.name, status: "Healthy" },
                  { kind: "Route", name: rec.name, status: "Healthy" },
                ].map((row) => (
                  <Tr key={`${row.kind}/${row.name}`}>
                    <Td dataLabel="Kind">{row.kind}</Td>
                    <Td dataLabel="Name">{row.name}</Td>
                    <Td dataLabel="Status">
                      <HealthStatus status={row.status} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </OcsPrototypeListTable>
          ) : null}

          {activeTab === "summary" ? (
            <DescriptionList isHorizontal isCompact>
              <DescriptionListGroup>
                <DescriptionListTerm>Sync</DescriptionListTerm>
                <DescriptionListDescription>
                  <HealthStatus status={rec.sync} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Health</DescriptionListTerm>
                <DescriptionListDescription>
                  <HealthStatus status={rec.health} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Last reconciled</DescriptionListTerm>
                <DescriptionListDescription>{rec.lastReconciled}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Destination</DescriptionListTerm>
                <DescriptionListDescription>{rec.destination}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          ) : null}

          <Content component="small" className="pf-v6-u-color-200">
            Resource graph with topology sidebars on the Resource Tree tab (HPUX-1942 / GITOPS-9059).
          </Content>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
