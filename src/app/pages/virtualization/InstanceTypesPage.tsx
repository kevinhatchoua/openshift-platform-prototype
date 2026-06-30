import { Button } from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OcsPrototypeListTable } from "../../components/dataView/OcsPrototypeListTable";
import { INSTANCE_TYPES } from "./virtualizationMockData";
import { VirtResourceTableShell } from "./virtualizationShared";

export default function InstanceTypesPage() {
  return (
    <VirtResourceTableShell title="InstanceTypes" path="/virtualization/instancetypes">
      <OcsPrototypeListTable ariaLabel="InstanceTypes">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Series</Th>
            <Th>CPU</Th>
            <Th>Memory</Th>
          </Tr>
        </Thead>
        <Tbody>
          {INSTANCE_TYPES.map((row) => (
            <Tr key={row.name}>
              <Td>
                <Button variant="link" isInline>
                  {row.name}
                </Button>
              </Td>
              <Td>{row.series}</Td>
              <Td>{row.cpu}</Td>
              <Td>{row.memory}</Td>
            </Tr>
          ))}
        </Tbody>
      </OcsPrototypeListTable>
    </VirtResourceTableShell>
  );
}
