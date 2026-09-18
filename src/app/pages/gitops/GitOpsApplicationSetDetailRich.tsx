import { useMemo, useState } from "react";
import { useParams } from "react-router";
import {
  CodeBlock,
  CodeBlockCode,
  Content,
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
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import SearchMinusIcon from "@patternfly/react-icons/dist/esm/icons/search-minus-icon";
import SearchPlusIcon from "@patternfly/react-icons/dist/esm/icons/search-plus-icon";
import ExpandIcon from "@patternfly/react-icons/dist/esm/icons/expand-icon";
import OutlinedQuestionCircleIcon from "@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import { OcsPrototypeListTable, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import { findApplicationSet, type ApplicationSetGeneratorNode } from "./gitopsData";
import { GitOpsNotFound } from "./GitOpsSimpleDetailPage";
import {
  gitopsConsoleDetailCrumbs,
  GitOpsDetailPageHeader,
  HealthStatus,
} from "./gitopsShared";
import GitOpsTopologyView from "./GitOpsTopologyView";
import { buildApplicationSetGraph } from "./gitopsTopologyData";

function GeneratorTreeNode({ node, depth = 0 }: { node: ApplicationSetGeneratorNode; depth?: number }) {
  const hasChildren = Boolean(node.children?.length);
  const label = node.label ?? node.type;
  return (
    <li className="ocs-gitops-generator-node" style={{ marginLeft: depth * 1.25 + "rem" }}>
      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }} className="ocs-gitops-generator-node__row">
        <span className="ocs-gitops-generator-node__type">{node.type}</span>
        <span className="ocs-gitops-generator-node__label">{label}</span>
      </Flex>
      {hasChildren ? (
        <ul className="ocs-gitops-generator-tree">
          {node.children!.map((child) => (
            <GeneratorTreeNode key={`${child.type}-${child.label ?? depth}`} node={child} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function GeneratorTree({ nodes }: { nodes: ApplicationSetGeneratorNode[] }) {
  return (
    <ul className="ocs-gitops-generator-tree ocs-gitops-generator-tree--root">
      {nodes.map((node) => (
        <GeneratorTreeNode key={`${node.type}-${node.label ?? "root"}`} node={node} />
      ))}
    </ul>
  );
}

const MOCK_EVENTS = [
  { type: "Normal", reason: "ResourceUpdated", message: "ApplicationSet refreshed", age: "2m" },
  { type: "Normal", reason: "ApplicationGenerated", message: "Generated Application myapp", age: "2m" },
];

function appSetYaml(rec: NonNullable<ReturnType<typeof findApplicationSet>>) {
  return `apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: ${rec.name}
  namespace: ${rec.ns}
spec:
  generators:
    - list:
        elements:
          - app: myapp
  template:
    metadata:
      name: '{{app}}'
    spec:
      project: default
      source:
        repoURL: ${rec.repo}
        path: ${rec.path}
        targetRevision: master
      destination:
        server: https://kubernetes.default.svc
        namespace: ${rec.ns}`;
}

export default function GitOpsApplicationSetDetailRich() {
  const { namespace = "", name = "" } = useParams();
  const rec = findApplicationSet(decodeURIComponent(namespace), decodeURIComponent(name));
  const [activeTab, setActiveTab] = useState("details");
  const graph = useMemo(() => (rec ? buildApplicationSetGraph(rec) : null), [rec]);

  if (!rec) return <GitOpsNotFound listPath="/gitops/applicationsets" listTitle="ApplicationSets" />;

  const href = `/gitops/ns/${namespace}/applicationsets/${name}`;

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs items={gitopsConsoleDetailCrumbs("ApplicationSets", "/gitops/applicationsets")}>
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <GitOpsDetailPageHeader kind="ApplicationSet" name={rec.name} href={href} menuKind="ApplicationSet" />

          <Tabs activeKey={activeTab} onSelect={(_e, k) => setActiveTab(String(k))} aria-label="ApplicationSet details">
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
            <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
            <Tab eventKey="generators" title={<TabTitleText>Generators</TabTitleText>} />
            <Tab eventKey="applications" title={<TabTitleText>Applications</TabTitleText>} />
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
                <DescriptionListDescription>{rec.ns}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Generators</DescriptionListTerm>
                <DescriptionListDescription>{rec.generators}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Applications</DescriptionListTerm>
                <DescriptionListDescription>{rec.apps}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Status</DescriptionListTerm>
                <DescriptionListDescription>
                  <HealthStatus status={rec.status} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Repository</DescriptionListTerm>
                <DescriptionListDescription>{rec.repo}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Path</DescriptionListTerm>
                <DescriptionListDescription>{rec.path}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          ) : null}

          {activeTab === "yaml" ? (
            <CodeBlock>
              <CodeBlockCode>{appSetYaml(rec)}</CodeBlockCode>
            </CodeBlock>
          ) : null}

          {activeTab === "generators" ? (
            <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
              <Title headingLevel="h2" size="lg">
                Generators
              </Title>
              <GeneratorTree nodes={rec.generatorTree} />
            </Flex>
          ) : null}

          {activeTab === "applications" && graph ? (
            <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
              <Title headingLevel="h2" size="lg">
                ApplicationSet Applications
              </Title>
              <Content component="p">
                The graph and table views show the ApplicationSet&apos;s applications. Use the filter below the graph to
                filter applications based on their health and sync status.
              </Content>
              <Toolbar className="ocs-gitops-applicationset-toolbar">
                <ToolbarContent>
                  <ToolbarItem>
                    <SearchPlusIcon aria-hidden />
                  </ToolbarItem>
                  <ToolbarItem>
                    <SearchMinusIcon aria-hidden />
                  </ToolbarItem>
                  <ToolbarItem>
                    <ExpandIcon aria-hidden />
                  </ToolbarItem>
                  <ToolbarItem align={{ default: "alignRight" }}>
                    <OutlinedQuestionCircleIcon aria-hidden />
                  </ToolbarItem>
                </ToolbarContent>
              </Toolbar>
              <GitOpsTopologyView graph={graph} ariaLabel={`ApplicationSet ${rec.name} applications graph`} />
            </Flex>
          ) : null}

          {activeTab === "events" ? (
            <OcsPrototypeListTable ariaLabel="ApplicationSet events">
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
