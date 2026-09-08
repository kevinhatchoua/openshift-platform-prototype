import { useMemo, useState } from "react";
import { useParams } from "react-router";
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { findApplicationSet, type ApplicationSetGeneratorNode } from "./gitopsData";
import { GitOpsNotFound } from "./GitOpsSimpleDetailPage";
import { GitOpsEditDeleteMenu, HealthStatus } from "./gitopsShared";
import GitOpsTopologyView from "./GitOpsTopologyView";
import { buildApplicationSetGraph } from "./gitopsTopologyData";

function GeneratorTreeNode({ node, depth = 0 }: { node: ApplicationSetGeneratorNode; depth?: number }) {
  const hasChildren = Boolean(node.children?.length);
  const label = node.label ?? node.type;
  return (
    <li className="ocs-gitops-generator-node" style={{ marginLeft: depth * 1.25 + "rem" }}>
      <Flex
        alignItems={{ default: "alignItemsCenter" }}
        gap={{ default: "gapSm" }}
        className="ocs-gitops-generator-node__row"
      >
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

export default function GitOpsApplicationSetDetailRich() {
  const { namespace = "", name = "" } = useParams();
  const rec = findApplicationSet(decodeURIComponent(namespace), decodeURIComponent(name));
  const [activeTab, setActiveTab] = useState("details");
  const graph = useMemo(() => (rec ? buildApplicationSetGraph(rec) : null), [rec]);

  if (!rec) return <GitOpsNotFound listPath="/gitops/applicationsets" listTitle="ApplicationSets" />;

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/overview" },
          { label: "ApplicationSets", path: "/gitops/applicationsets" },
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
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
              <Title headingLevel="h1" size="2xl">
                {rec.name}
              </Title>
              <FavoriteButton name={rec.name} path={`/gitops/ns/${namespace}/applicationsets/${name}`} />
            </Flex>
            <GitOpsEditDeleteMenu kind="ApplicationSet" name={rec.name} variant="secondary" />
          </Flex>

          <Tabs activeKey={activeTab} onSelect={(_e, k) => setActiveTab(String(k))}>
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
            <Tab eventKey="topology" title={<TabTitleText>Topology</TabTitleText>} />
          </Tabs>

          {activeTab === "details" ? (
            <>
              <DescriptionList isCompact>
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
              <Title headingLevel="h2" size="lg">Generator hierarchy</Title>
              <GeneratorTree nodes={rec.generatorTree} />
            </>
          ) : null}

          {activeTab === "topology" && graph ? (
            <GitOpsTopologyView graph={graph} ariaLabel={`ApplicationSet ${rec.name} resource graph`} />
          ) : null}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
