import { Link } from "react-router";
import { Button, Content, Flex, Label } from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OcsPrototypeListTable } from "../../components/dataView/OcsPrototypeListTable";
import { TEMPLATES } from "./virtualizationMockData";
import { VirtListEmptyPanel, VirtResourceTableShell } from "./virtualizationShared";

export default function TemplatesPage() {
  if (TEMPLATES.length === 0) {
    return (
      <VirtResourceTableShell title="Templates" path="/virtualization/templates" createLabel="Create Template">
        <VirtListEmptyPanel resource="Template" createLabel="Create Template" />
      </VirtResourceTableShell>
    );
  }

  return (
    <VirtResourceTableShell title="Templates" path="/virtualization/templates" createLabel="Create Template">
      <OcsPrototypeListTable ariaLabel="Templates">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Namespace</Th>
            <Th>Operating system</Th>
            <Th>Workload</Th>
          </Tr>
        </Thead>
        <Tbody>
          {TEMPLATES.map((row) => (
            <Tr key={row.name}>
              <Td>
                <Button variant="link" isInline>
                  {row.name}
                </Button>
              </Td>
              <Td>
                <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                  <Label color="green" isCompact className="ocs-resource-label">
                    NS
                  </Label>
                  {row.namespace}
                </Flex>
              </Td>
              <Td>{row.os}</Td>
              <Td>{row.workload}</Td>
            </Tr>
          ))}
        </Tbody>
      </OcsPrototypeListTable>
    </VirtResourceTableShell>
  );
}
