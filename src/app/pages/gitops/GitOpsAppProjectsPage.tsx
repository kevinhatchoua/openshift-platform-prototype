import { useState } from "react";
import { useParams } from "react-router";
import {
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Tab,
  Tabs,
  TabTitleText,
} from "@patternfly/react-core";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { GitOpsSimpleListPage } from "./GitOpsSimpleListPage";
import { GitOpsNotFound } from "./GitOpsSimpleDetailPage";
import {
  applicationsForNamespace,
  appProjectsForInstance,
  findAppProject,
  gitopsDetailPath,
} from "./gitopsData";
import { useGitOpsInstance } from "./GitOpsInstancePicker";
import { GitOpsEditDeleteMenu, GitOpsLink, ResourceName } from "./gitopsShared";
import GitOpsAccessTestPanel from "./GitOpsAccessTestPanel";

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
  const [activeTab, setActiveTab] = useState("details");
  const href = gitopsDetailPath("appprojects", rec.ns, rec.name);
  const appsInNs = applicationsForNamespace(rec.ns);

  return (
    <div className="ocs-app-page-outer ocs-pod-details-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/overview" },
          { label: "AppProjects", path: "/gitops/appprojects" },
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
            <ResourceName kind="AppProject" name={rec.name} />
            <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
              <FavoriteButton name={rec.name} path={href} />
              <GitOpsEditDeleteMenu
                kind="AppProject"
                name={rec.name}
                variant="secondary"
                extraItems={[
                  { id: "edit-labels", label: "Edit labels" },
                  { id: "edit-annotations", label: "Edit annotations" },
                ]}
              />
            </Flex>
          </Flex>

          <Tabs
            activeKey={activeTab}
            onSelect={(_e, key) => setActiveTab(String(key))}
            aria-label="AppProject details"
          >
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
            <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
            <Tab eventKey="access" title={<TabTitleText>Access Test</TabTitleText>} />
            <Tab eventKey="configuration" title={<TabTitleText>Configuration</TabTitleText>} />
            <Tab eventKey="destinations" title={<TabTitleText>Destinations</TabTitleText>} />
            <Tab eventKey="roles" title={<TabTitleText>Roles</TabTitleText>} />
            <Tab eventKey="source-repos" title={<TabTitleText>Source Repos</TabTitleText>} />
            <Tab eventKey="summary" title={<TabTitleText>Summary</TabTitleText>} />
            <Tab eventKey="sync-windows" title={<TabTitleText>Sync Windows</TabTitleText>} />
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
                  <ResourceName
                    kind="Namespace"
                    name={rec.ns}
                    to={`/administration/namespaces/${encodeURIComponent(rec.ns)}`}
                  />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Description</DescriptionListTerm>
                <DescriptionListDescription>{rec.description}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Destinations</DescriptionListTerm>
                <DescriptionListDescription>{rec.destinations}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Source repos</DescriptionListTerm>
                <DescriptionListDescription>{rec.sourceRepos}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Age</DescriptionListTerm>
                <DescriptionListDescription>{rec.age}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Applications in namespace</DescriptionListTerm>
                <DescriptionListDescription>
                  {appsInNs.length === 0 ? "None" : appsInNs.map((a) => a.name).join(", ")}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          ) : null}

          {activeTab === "yaml" ? (
            <Content component="p" className="pf-v6-u-color-200">
              YAML view is a prototype stub.
            </Content>
          ) : null}

          {activeTab === "configuration" ? (
            <DescriptionList isHorizontal isCompact>
              <DescriptionListGroup>
                <DescriptionListTerm>Allow empty</DescriptionListTerm>
                <DescriptionListDescription>false</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Orphaned resources</DescriptionListTerm>
                <DescriptionListDescription>Warn</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Cluster resource whitelist</DescriptionListTerm>
                <DescriptionListDescription>Namespaces, CustomResourceDefinitions</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          ) : null}

          {activeTab === "destinations" ? (
            <Content component="p">{rec.destinations}</Content>
          ) : null}

          {activeTab === "roles" ? (
            <Content component="p">
              Default project role: <code>admin</code> (get, create, update, delete applications).
            </Content>
          ) : null}

          {activeTab === "source-repos" ? (
            <Content component="p">{rec.sourceRepos}</Content>
          ) : null}

          {activeTab === "summary" ? (
            <DescriptionList isHorizontal isCompact>
              <DescriptionListGroup>
                <DescriptionListTerm>Applications in namespace</DescriptionListTerm>
                <DescriptionListDescription>
                  {appsInNs.length === 0 ? (
                    "None"
                  ) : (
                    <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
                      {appsInNs.map((a) => (
                        <GitOpsLink key={a.name} to={gitopsDetailPath("applications", a.ns, a.name)}>
                          {a.name}
                        </GitOpsLink>
                      ))}
                    </Flex>
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          ) : null}

          {activeTab === "sync-windows" ? (
            <Content component="p">No sync windows configured. Applications may sync at any time.</Content>
          ) : null}

          {activeTab === "access" ? (
            <GitOpsAccessTestPanel resourceLabel={`AppProject ${rec.name}`} defaultResource="applications" />
          ) : null}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
