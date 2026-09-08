import { useState } from "react";
import {
  Alert,
  Button,
  Content,
  Flex,
  Label,
} from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import {
  OcsNamedResourceDataView,
  PlainTableHeader,
} from "../../components/dataView/OcsPrototypeListTable";
import { agentsForInstance, gitopsDetailPath } from "./gitopsData";
import GitOpsPageHeader from "./GitOpsPageHeader";
import { useGitOpsInstance } from "./GitOpsPageHeader";
import { GitOpsEditDeleteMenu, ResourceName } from "./gitopsShared";
import GitOpsConnectAgentModal from "./GitOpsConnectAgentModal";

export default function GitOpsAgentSpokesPage() {
  const { instance } = useGitOpsInstance();
  const [connectOpen, setConnectOpen] = useState(false);
  const agents = agentsForInstance(instance);

  return (
    <div className="ocs-app-page-outer w-full">
      <GitOpsConnectAgentModal isOpen={connectOpen} onClose={() => setConnectOpen(false)} />
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/overview" },
          { label: "Connected Agents", path: "/gitops/agents" },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <GitOpsPageHeader
            title="Connected Agents"
            path="/gitops/agents"
            actions={
              <Button variant="primary" onClick={() => setConnectOpen(true)}>
                Connect agent
              </Button>
            }
          />

          <Alert
            variant="info"
            isInline
            title="Credential material (JWT/TLS) is never shown — status and health only."
          />

          <Content component="p" className="pf-v6-u-color-200">
            Hub-and-spoke connection status (GITOPS-10917 P1). Application sync-error clarity uses HPUX-1431
            patterns on Application detail — agent disconnect errors surface here and on agent detail.
          </Content>

          <OcsNamedResourceDataView
            ouiaId="gitops-agents-data-view"
            ariaLabel="Connected Agents"
            itemsLabel="agents"
            items={agents}
            getName={(item) => item.name}
          >
            {(rows) => (
              <>
                <Thead>
                  <Tr>
                    <Th dataLabel="Spoke name">
                      <PlainTableHeader label="Spoke name" />
                    </Th>
                    <Th dataLabel="Cluster">
                      <PlainTableHeader label="Cluster" />
                    </Th>
                    <Th dataLabel="Connection">
                      <PlainTableHeader label="Connection" />
                    </Th>
                    <Th dataLabel="Sync mode">
                      <PlainTableHeader label="Sync mode" />
                    </Th>
                    <Th dataLabel="Last heartbeat">
                      <PlainTableHeader label="Last heartbeat" />
                    </Th>
                    <Th dataLabel="Reconnections">
                      <PlainTableHeader label="Reconnections" />
                    </Th>
                    <Th modifier="fitContent" dataLabel="Actions">
                      <PlainTableHeader label="Actions" />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((item) => (
                    <Tr key={item.name}>
                      <Td dataLabel="Spoke name">
                        <ResourceName
                          kind="Agent"
                          name={item.name}
                          to={gitopsDetailPath("agents", item.ns, item.name)}
                        />
                      </Td>
                      <Td dataLabel="Cluster">{item.cluster}</Td>
                      <Td dataLabel="Connection">
                        <Label
                          color={item.connection === "Connected" ? "green" : "red"}
                          isCompact
                        >
                          {item.connection}
                        </Label>
                      </Td>
                      <Td dataLabel="Sync mode">{item.syncMode}</Td>
                      <Td dataLabel="Last heartbeat">{item.lastHeartbeat}</Td>
                      <Td dataLabel="Reconnections">{item.reconnections}</Td>
                      <Td dataLabel="Actions" isActionCell hasAction>
                        <GitOpsEditDeleteMenu kind="Agent" name={item.name} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </>
            )}
          </OcsNamedResourceDataView>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
