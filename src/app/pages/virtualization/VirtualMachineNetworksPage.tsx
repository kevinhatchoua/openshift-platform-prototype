import { useMemo } from "react";
import { Link } from "react-router";
import { Button, Content, Flex, Label } from "@patternfly/react-core";
import { InnerScrollContainer, Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OCS_PROTOTYPE_TABLE_CLASS } from "../../components/dataView/OcsPrototypeListTable";
import { listVirtManagedNetworks, virtVmNetworkDetailPath } from "../networking/networkingMockData";
import { VirtResourceTableShell } from "./virtualizationShared";

export default function VirtualMachineNetworksPage() {
  const networks = useMemo(() => listVirtManagedNetworks(), []);

  return (
    <VirtResourceTableShell title="Virtual machine networks" path="/virtualization/virtualmachinenetworks">
      <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }} className="pf-v6-u-p-lg">
        <Content component="p">
          Phase 1 — browse secondary networks from the virtualization perspective. Each network uses the standardized
          detail layout: <strong>Details</strong>, <strong>YAML</strong>, and{" "}
          <strong>Connected virtual machines</strong> (aligned with OCP 4.21+ VM network pages).
        </Content>
        <InnerScrollContainer>
          <Table aria-label="Virtual machine networks" className={OCS_PROTOTYPE_TABLE_CLASS}>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Kind</Th>
                <Th>Namespace</Th>
                <Th>Connected VMs</Th>
                <Th>Health</Th>
              </Tr>
            </Thead>
            <Tbody>
              {networks.map((row) => (
                <Tr key={`${row.kind}/${row.namespace ?? ""}/${row.name}`}>
                  <Td dataLabel="Name">
                    <Button variant="link" isInline component={Link} to={virtVmNetworkDetailPath(row.ref)}>
                      {row.name}
                    </Button>
                  </Td>
                  <Td dataLabel="Kind">
                    <Label color={row.kind === "NAD" ? "blue" : "purple"} isCompact>
                      {row.kind}
                    </Label>
                  </Td>
                  <Td dataLabel="Namespace">{row.namespace ?? "—"}</Td>
                  <Td dataLabel="Connected VMs">{row.attachedVmCount}</Td>
                  <Td dataLabel="Health">
                    <Label
                      color={row.health === "healthy" ? "green" : row.health === "degraded" ? "orange" : "red"}
                      isCompact
                    >
                      {row.health}
                    </Label>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </InnerScrollContainer>
        <Flex gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
          <Button variant="secondary" component={Link} to="/networking/networkattachmentdefinitions">
            NetworkAttachmentDefinitions (Networking)
          </Button>
          <Button variant="secondary" component={Link} to="/networking/userdefinednetworks">
            UserDefinedNetworks (Networking)
          </Button>
        </Flex>
      </Flex>
    </VirtResourceTableShell>
  );
}
