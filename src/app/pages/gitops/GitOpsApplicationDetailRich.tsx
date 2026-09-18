import { useState } from "react";
import { useParams } from "react-router";
import {
  Alert,
  Button,
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
  Content,
} from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import { OcsPrototypeListTable, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import {
  findApplication,
  findAppProject,
  gitopsDetailPath,
  applicationSyncError,
  GITOPS_ALL_INSTANCES,
  type ApplicationRecord,
} from "./gitopsData";
import { GitOpsNotFound } from "./GitOpsSimpleDetailPage";
import {
  GitOpsDetailPageHeader,
  GitOpsLink,
  HealthStatus,
  OwnerReferencesCell,
  ResourceName,
  gitopsConsoleDetailCrumbs,
} from "./gitopsShared";
import { useToast } from "../../contexts/ToastContext";
import GitOpsYamlUnifiedDiff from "./GitOpsYamlUnifiedDiff";
import { useGitOpsInstance } from "./GitOpsInstancePicker";

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

export default function GitOpsApplicationDetailRich() {
  const { namespace = "", name = "" } = useParams();
  const ns = decodeURIComponent(namespace);
  const appName = decodeURIComponent(name);
  const rec = findApplication(ns, appName);
  const [activeTab, setActiveTab] = useState("details");
  const { pushToast } = useToast();
  const syncError = rec ? applicationSyncError(rec) : null;
  const { instance } = useGitOpsInstance();
  const instanceScoped = rec ? rec.instanceKey === instance || instance === GITOPS_ALL_INSTANCES : true;

  if (!rec) {
    return <GitOpsNotFound listPath="/gitops/applications" listTitle="Applications" />;
  }

  const href = gitopsDetailPath("applications", rec.ns, rec.name);

  return (
    <div className="ocs-app-page-outer ocs-pod-details-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs items={gitopsConsoleDetailCrumbs("Applications", "/gitops/applications")}>
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <GitOpsDetailPageHeader kind="Application" name={rec.name} href={href} menuKind="Application" />

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
            <Tab eventKey="sources" title={<TabTitleText>Sources</TabTitleText>} />
            <Tab eventKey="resources" title={<TabTitleText>Resources</TabTitleText>} />
            <Tab eventKey="sync-status" title={<TabTitleText>Sync Status</TabTitleText>} />
            <Tab eventKey="history" title={<TabTitleText>History</TabTitleText>} />
            <Tab eventKey="events" title={<TabTitleText>Events</TabTitleText>} />
          </Tabs>

          {activeTab === "details" ? (
            <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
              <Title headingLevel="h2" size="lg">
                Application details
              </Title>
              <Grid hasGutter>
                <GridItem md={6}>
                  <DescriptionList isCompact>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Name</DescriptionListTerm>
                      <DescriptionListDescription>
                        <ResourceName kind="Application" name={rec.name} />
                      </DescriptionListDescription>
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
                          <Button variant="link" isInline onClick={() => pushToast({ variant: "info", title: `Edit labels: ${rec.name}` })}>
                            Edit
                          </Button>
                        </Flex>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Annotations</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Button variant="link" isInline onClick={() => pushToast({ variant: "info", title: "Edit annotations" })}>
                          0 Annotations
                        </Button>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Created at</DescriptionListTerm>
                      <DescriptionListDescription>{rec.lastReconciled || rec.age}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Owner</DescriptionListTerm>
                      <DescriptionListDescription>
                        {rec.ownerReferences.length ? (
                          <OwnerReferencesCell refs={rec.ownerReferences} ns={rec.ns} />
                        ) : (
                          "No owner"
                        )}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </GridItem>
                <GridItem md={6}>
                  <DescriptionList isCompact>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Health Status</DescriptionListTerm>
                      <DescriptionListDescription>
                        <HealthStatus status={rec.health} />
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Current Sync Status</DescriptionListTerm>
                      <DescriptionListDescription>
                        {rec.sync === "Synced" || rec.sync === "OutOfSync" ? rec.sync : "(None)"}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Last Sync Status</DescriptionListTerm>
                      <DescriptionListDescription>—</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Target Revision</DescriptionListTerm>
                      <DescriptionListDescription>{rec.revision}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Project</DescriptionListTerm>
                      <DescriptionListDescription>
                        {(() => {
                          const project = findAppProject(rec.ns, rec.project) ?? findAppProject("openshift-gitops", rec.project);
                          return project ? (
                            <GitOpsLink to={gitopsDetailPath("appprojects", project.ns, project.name)}>
                              <ResourceName kind="AppProject" name={rec.project} />
                            </GitOpsLink>
                          ) : (
                            <ResourceName kind="AppProject" name={rec.project} />
                          );
                        })()}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Destination</DescriptionListTerm>
                      <DescriptionListDescription>{rec.destination}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Sync Policy</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
                          <Label color="blue" isCompact>
                            Automated
                          </Label>
                          <Label color="blue" isCompact>
                            Prune
                          </Label>
                          <Label color="blue" isCompact>
                            Self Heal
                          </Label>
                        </Flex>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </GridItem>
              </Grid>
            </Flex>
          ) : null}

          {!instanceScoped ? (
            <Alert variant="info" isInline title="Viewing application outside selected instance scope">
              Instance filter is <code>{instance}</code>. Switch instance in the header to align list and detail
              context.
            </Alert>
          ) : null}

          {activeTab === "sources" ? (
            <DescriptionList isHorizontal isCompact>
              <DescriptionListGroup>
                <DescriptionListTerm>Repository URL</DescriptionListTerm>
                <DescriptionListDescription>{rec.repo}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Path</DescriptionListTerm>
                <DescriptionListDescription>{rec.path}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Target revision</DescriptionListTerm>
                <DescriptionListDescription>{rec.revision}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          ) : null}

          {activeTab === "sync-status" ? (
            <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
              <DescriptionList isHorizontal isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>Sync status</DescriptionListTerm>
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
              </DescriptionList>
              {rec.sync === "OutOfSync" ? (
                <GitOpsYamlUnifiedDiff live={liveYaml(rec)} desired={desiredYaml(rec)} />
              ) : (
                <Alert variant="success" title="Application is synced to the target revision" isInline />
              )}
            </Flex>
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
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
