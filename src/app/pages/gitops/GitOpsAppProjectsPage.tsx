import { useState } from "react";
import { useParams } from "react-router";
import {
  Card,
  CardBody,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  EmptyState,
  EmptyStateBody,
  Flex,
  Label,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import CubesIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import { OcsPrototypeListTable, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import { GitOpsSimpleListPage } from "./GitOpsSimpleListPage";
import { GitOpsNotFound } from "./GitOpsSimpleDetailPage";
import {
  applicationsForNamespace,
  appProjectsForInstance,
  findAppProject,
  gitopsDetailPath,
} from "./gitopsData";
import { useGitOpsInstance } from "./GitOpsInstancePicker";
import { GitOpsEditDeleteMenu, GitOpsLink, ResourceName, gitopsConsoleDetailCrumbs, GitOpsDetailPageHeader } from "./gitopsShared";

const MOCK_EVENTS = [
  { type: "Normal", reason: "ResourceUpdated", message: "AppProject updated", age: "2m" },
];

export default function GitOpsAppProjectsPage() {
  const { instance } = useGitOpsInstance();
  return (
    <GitOpsSimpleListPage
      title="AppProjects"
      path="/gitops/appprojects"
      createLabel="Create AppProject"
      kind="AppProject"
      detailKind="appprojects"
      items={appProjectsForInstance(instance)}
      columns={[
        { key: "name", label: "Name" },
        { key: "namespace", label: "Namespace" },
        { key: "description", label: "Description" },
        { key: "destinations", label: "Destinations" },
        { key: "sourceRepos", label: "Source repos" },
        { key: "age", label: "Age" },
      ]}
      renderCell={(item, key) => {
        if (key === "description") return item.description;
        if (key === "destinations") return item.destinations;
        if (key === "sourceRepos") return item.sourceRepos;
        if (key === "age") return item.age;
        return null;
      }}
    />
  );
}

export function GitOpsAppProjectDetailPage() {
  const { namespace = "", name = "" } = useParams();
  const rec = findAppProject(decodeURIComponent(namespace), decodeURIComponent(name));
  if (!rec) return <GitOpsNotFound listPath="/gitops/appprojects" listTitle="AppProjects" />;
  return <AppProjectDetailBody rec={rec} />;
}

function AppProjectDetailBody({
  rec,
}: {
  rec: NonNullable<ReturnType<typeof findAppProject>>;
}) {
  const [activeTab, setActiveTab] = useState("allow-deny");
  const href = gitopsDetailPath("appprojects", rec.ns, rec.name);
  const appsInProject = applicationsForNamespace(rec.ns).filter((a) => a.project === rec.name);

  return (
    <div className="ocs-app-page-outer ocs-pod-details-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs items={gitopsConsoleDetailCrumbs("AppProjects", "/gitops/appprojects")}>
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <GitOpsDetailPageHeader kind="AppProject" name={rec.name} href={href} menuKind="AppProject" />

          <Tabs
            activeKey={activeTab}
            onSelect={(_e, key) => setActiveTab(String(key))}
            aria-label="AppProject details"
          >
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
            <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
            <Tab eventKey="allow-deny" title={<TabTitleText>Allow/Deny</TabTitleText>} />
            <Tab eventKey="applications" title={<TabTitleText>Applications</TabTitleText>} />
            <Tab eventKey="roles" title={<TabTitleText>Roles</TabTitleText>} />
            <Tab eventKey="sync-windows" title={<TabTitleText>Sync Windows</TabTitleText>} />
            <Tab eventKey="events" title={<TabTitleText>Events</TabTitleText>} />
          </Tabs>

          {activeTab === "details" ? (
            <DescriptionList isHorizontal isCompact>
              <DescriptionListGroup>
                <DescriptionListTerm>Name</DescriptionListTerm>
                <DescriptionListDescription>{rec.name}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Namespace</DescriptionListTerm>
                <DescriptionListDescription>
                  <ResourceName kind="Namespace" name={rec.ns} to={`/administration/namespaces/${encodeURIComponent(rec.ns)}`} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Description</DescriptionListTerm>
                <DescriptionListDescription>{rec.description}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Age</DescriptionListTerm>
                <DescriptionListDescription>{rec.age}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          ) : null}

          {activeTab === "yaml" ? (
            <Content component="pre" className="ocs-gitops-yaml-block">
              {`apiVersion: argoproj.io/v1alpha1\nkind: AppProject\nmetadata:\n  name: ${rec.name}\n  namespace: ${rec.ns}`}
            </Content>
          ) : null}

          {activeTab === "allow-deny" ? (
            <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
              <Card isPlain>
                <CardTitle>Allowed Sources</CardTitle>
                <CardBody>
                  <Flex gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
                    <Card isCompact className="ocs-gitops-allow-card">
                      <CardTitle>Repositories</CardTitle>
                      <CardBody>
                        <Label color="blue" isCompact>
                          Allow
                        </Label>{" "}
                        *
                      </CardBody>
                    </Card>
                    <Card isCompact className="ocs-gitops-allow-card">
                      <CardTitle>Namespaces</CardTitle>
                      <CardBody>—</CardBody>
                    </Card>
                  </Flex>
                </CardBody>
              </Card>

              <Card isPlain>
                <CardTitle>Allowed Destinations</CardTitle>
                <CardBody>
                  <OcsPrototypeListTable ariaLabel="Allowed destinations">
                    <Thead>
                      <Tr>
                        <Th dataLabel="Type">
                          <PlainTableHeader label="Type" />
                        </Th>
                        <Th dataLabel="Server">
                          <PlainTableHeader label="Server" />
                        </Th>
                        <Th dataLabel="Name">
                          <PlainTableHeader label="Name" />
                        </Th>
                        <Th dataLabel="Namespace">
                          <PlainTableHeader label="Namespace" />
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td dataLabel="Type">
                          <Label color="blue" isCompact>
                            Allow
                          </Label>
                        </Td>
                        <Td dataLabel="Server">—</Td>
                        <Td dataLabel="Name">—</Td>
                        <Td dataLabel="Namespace">—</Td>
                      </Tr>
                    </Tbody>
                  </OcsPrototypeListTable>
                </CardBody>
              </Card>

              <Title headingLevel="h3" size="md">
                Resource Allow/Deny Lists
              </Title>
              <Flex gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
                {[
                  "Cluster Resource Allow List",
                  "Cluster Resource Deny List",
                  "Namespace Resource Allow List",
                  "Namespace Resource Deny List",
                ].map((title) => (
                  <Card key={title} isCompact className="ocs-gitops-allow-card">
                    <CardTitle>{title}</CardTitle>
                    <CardBody>
                      {title.includes("Allow List") && title.startsWith("Cluster") ? (
                        <OcsPrototypeListTable ariaLabel={title}>
                          <Thead>
                            <Tr>
                              <Th dataLabel="Kind">
                                <PlainTableHeader label="Kind" />
                              </Th>
                              <Th dataLabel="Group">
                                <PlainTableHeader label="Group" />
                              </Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            <Tr>
                              <Td dataLabel="Kind">—</Td>
                              <Td dataLabel="Group">—</Td>
                            </Tr>
                          </Tbody>
                        </OcsPrototypeListTable>
                      ) : (
                        <EmptyState variant="xs">
                          <EmptyStateBody>
                            <Flex direction={{ default: "column" }} alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <CubesIcon aria-hidden />
                              No resources configured. This list does not have any resources configured.
                            </Flex>
                          </EmptyStateBody>
                        </EmptyState>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </Flex>
            </Flex>
          ) : null}

          {activeTab === "applications" ? (
            appsInProject.length === 0 ? (
              <Content component="p">No applications in this AppProject.</Content>
            ) : (
              <OcsPrototypeListTable ariaLabel="AppProject applications">
                <Thead>
                  <Tr>
                    <Th dataLabel="Name">
                      <PlainTableHeader label="Name" />
                    </Th>
                    <Th dataLabel="Namespace">
                      <PlainTableHeader label="Namespace" />
                    </Th>
                    <Th dataLabel="Sync">
                      <PlainTableHeader label="Sync" />
                    </Th>
                    <Th dataLabel="Health">
                      <PlainTableHeader label="Health" />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {appsInProject.map((a) => (
                    <Tr key={a.name}>
                      <Td dataLabel="Name">
                        <GitOpsLink to={gitopsDetailPath("applications", a.ns, a.name)}>{a.name}</GitOpsLink>
                      </Td>
                      <Td dataLabel="Namespace">{a.ns}</Td>
                      <Td dataLabel="Sync">{a.sync}</Td>
                      <Td dataLabel="Health">{a.health}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </OcsPrototypeListTable>
            )
          ) : null}

          {activeTab === "roles" ? (
            <Content component="p">
              Default project role: <code>admin</code> (get, create, update, delete applications).
            </Content>
          ) : null}

          {activeTab === "sync-windows" ? (
            <Content component="p">No sync windows configured. Applications may sync at any time.</Content>
          ) : null}

          {activeTab === "events" ? (
            <OcsPrototypeListTable ariaLabel="AppProject events">
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
                      <Label color="blue" isCompact>
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
          ) : null}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
