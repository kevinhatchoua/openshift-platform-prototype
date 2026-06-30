import { Button, Flex, Label } from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OcsPrototypeListTable } from "../../components/dataView/OcsPrototypeListTable";
import { BOOT_VOLUMES } from "./virtualizationMockData";
import { VirtResourceTableShell } from "./virtualizationShared";

export default function BootableVolumesPage() {
  return (
    <VirtResourceTableShell
      title="Bootable volumes"
      path="/virtualization/bootablevolumes"
      createLabel="Create BootableVolume"
    >
      <OcsPrototypeListTable ariaLabel="Bootable volumes">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Operating system</Th>
            <Th>Storage class</Th>
            <Th>Size</Th>
          </Tr>
        </Thead>
        <Tbody>
          {BOOT_VOLUMES.map((row) => (
            <Tr key={row.name}>
              <Td>
                <Button variant="link" isInline>
                  {row.name}
                </Button>
              </Td>
              <Td>{row.operatingSystem}</Td>
              <Td>{row.storageClass}</Td>
              <Td>{row.size}</Td>
            </Tr>
          ))}
        </Tbody>
      </OcsPrototypeListTable>
    </VirtResourceTableShell>
  );
}
