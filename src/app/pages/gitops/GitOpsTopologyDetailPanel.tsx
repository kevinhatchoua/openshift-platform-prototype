import { useState } from "react";
import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Flex,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import { Link } from "react-router";
import type { GitOpsTopoGraph, GitOpsTopoNode } from "./gitopsTopologyData";
import { childrenOf } from "./gitopsTopologyData";
import { GitOpsEditDeleteMenu, HealthStatus, ResourceName } from "./gitopsShared";
import { useToast } from "../../contexts/ToastContext";

type GitOpsTopologyDetailPanelProps = {
  node: GitOpsTopoNode;
  graph: GitOpsTopoGraph;
  onClose: () => void;
  onSelectNode: (id: string) => void;
};

export default function GitOpsTopologyDetailPanel({
  node,
  graph,
  onClose,
  onSelectNode,
}: GitOpsTopologyDetailPanelProps) {
  const [tab, setTab] = useState("details");
  const { pushToast } = useToast();
  const kids = childrenOf(graph, node.id);

  return (
    <DrawerPanelContent>
      <DrawerHead>
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <ResourceName kind={node.kind} name={node.name} />
        </Flex>
        <DrawerActions>
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>
        <Tabs activeKey={tab} onSelect={(_e, k) => setTab(String(k))} aria-label="Graph node details">
          <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
          <Tab eventKey="resources" title={<TabTitleText>Resources</TabTitleText>} />
          <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
        </Tabs>

        {tab === "details" ? (
          <DescriptionList isCompact className="pf-v6-u-mt-md">
            <DescriptionListGroup>
              <DescriptionListTerm>Kind</DescriptionListTerm>
              <DescriptionListDescription>{node.kind}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Name</DescriptionListTerm>
              <DescriptionListDescription>{node.name}</DescriptionListDescription>
            </DescriptionListGroup>
            {node.ns ? (
              <DescriptionListGroup>
                <DescriptionListTerm>Namespace</DescriptionListTerm>
                <DescriptionListDescription>{node.ns}</DescriptionListDescription>
              </DescriptionListGroup>
            ) : null}
            {node.sync ? (
              <DescriptionListGroup>
                <DescriptionListTerm>Sync</DescriptionListTerm>
                <DescriptionListDescription>
                  <HealthStatus status={node.sync} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            ) : null}
            {node.health ? (
              <DescriptionListGroup>
                <DescriptionListTerm>Health</DescriptionListTerm>
                <DescriptionListDescription>
                  <HealthStatus status={node.health} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            ) : null}
            {node.detail ? (
              <DescriptionListGroup>
                <DescriptionListTerm>Summary</DescriptionListTerm>
                <DescriptionListDescription>{node.detail}</DescriptionListDescription>
              </DescriptionListGroup>
            ) : null}
          </DescriptionList>
        ) : null}

        {tab === "resources" ? (
          <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }} className="pf-v6-u-mt-md">
            <Title headingLevel="h3" size="md">
              Child resources
            </Title>
            {kids.length === 0 ? (
              <span className="pf-v6-u-color-200">No child resources in this graph slice.</span>
            ) : (
              kids.map((kid) => (
                <Button
                  key={kid.id}
                  variant="link"
                  isInline
                  onClick={() => onSelectNode(kid.id)}
                >
                  <ResourceName kind={kid.kind} name={kid.name} />
                </Button>
              ))
            )}
            {node.linkTo ? (
              <Button variant="link" isInline component={Link} to={node.linkTo}>
                Open full {node.kind} details
              </Button>
            ) : null}
          </Flex>
        ) : null}

        {tab === "yaml" ? (
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }} className="pf-v6-u-mt-md">
            <pre className="ocs-gitops-topo-yaml">{`apiVersion: argoproj.io/v1alpha1
kind: ${node.kind}
metadata:
  name: ${node.name}
  namespace: ${node.ns ?? "argocd"}`}</pre>
            <Button
              variant="secondary"
              onClick={() =>
                pushToast({ variant: "success", title: `Synced ${node.kind} ${node.name} (prototype).` })
              }
            >
              Sync
            </Button>
          </Flex>
        ) : null}

        <Flex className="pf-v6-u-mt-lg" gap={{ default: "gapSm" }}>
          <GitOpsEditDeleteMenu kind={node.kind} name={node.name} variant="secondary" />
        </Flex>
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
}
