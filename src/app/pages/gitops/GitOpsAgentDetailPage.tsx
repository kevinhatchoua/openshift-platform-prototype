import { useParams } from "react-router";
import {
  Alert,
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Label,
  Title,
} from "@patternfly/react-core";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { findAgentSpoke, gitopsDetailPath } from "./gitopsData";
import { GitOpsEditDeleteMenu } from "./gitopsShared";
import GitOpsConnectAgentModal from "./GitOpsConnectAgentModal";
import { useState } from "react";

export default function GitOpsAgentDetailPage() {
  const { namespace = "", name = "" } = useParams();
  const rec = findAgentSpoke(decodeURIComponent(namespace), decodeURIComponent(name));
  const [connectOpen, setConnectOpen] = useState(false);
  if (!rec) {
    return (
      <div className="ocs-app-page-outer w-full">
        <Content component="p">Agent not found.</Content>
      </div>
    );
  }

  return (
    <div className="ocs-app-page-outer w-full">
      <GitOpsConnectAgentModal isOpen={connectOpen} onClose={() => setConnectOpen(false)} />
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/overview" },
          { label: "Connected Agents", path: "/gitops/agents" },
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
              <FavoriteButton name={rec.name} path={gitopsDetailPath("agents", rec.ns, rec.name)} />
            </Flex>
            <Flex gap={{ default: "gapSm" }}>
              {rec.connection === "Disconnected" ? (
                <Button variant="primary" onClick={() => setConnectOpen(true)}>
                  Reconnect agent
                </Button>
              ) : null}
              <GitOpsEditDeleteMenu kind="Agent" name={rec.name} variant="secondary" />
            </Flex>
          </Flex>

          {rec.syncError ? (
            <Alert variant="warning" isInline title={rec.syncError.title}>
              {rec.syncError.detail} (HPUX-1431 agent sync-error clarity pattern.)
            </Alert>
          ) : null}

          <DescriptionList isCompact>
            <DescriptionListGroup>
              <DescriptionListTerm>Cluster</DescriptionListTerm>
              <DescriptionListDescription>{rec.cluster}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Connection</DescriptionListTerm>
              <DescriptionListDescription>
                <Label color={rec.connection === "Connected" ? "green" : "red"} isCompact>
                  {rec.connection}
                </Label>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Sync mode</DescriptionListTerm>
              <DescriptionListDescription>{rec.syncMode}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Instance</DescriptionListTerm>
              <DescriptionListDescription>{rec.instanceKey}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Last heartbeat</DescriptionListTerm>
              <DescriptionListDescription>{rec.lastHeartbeat}</DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>

          <Alert variant="info" isInline title="ACM fleet context (HPUX-1950)">
            When ACM console work ramps, this agent detail will link to fleet placement and policy — prototype shows
            hub-spoke status only.
          </Alert>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
