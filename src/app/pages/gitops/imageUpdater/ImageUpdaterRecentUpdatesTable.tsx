import { EmptyState, EmptyStateBody } from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OcsPrototypeListTable, PlainTableHeader } from "../../../components/dataView/OcsPrototypeListTable";
import type { ImageUpdaterRecentUpdate } from "../gitopsData";

export function ImageUpdaterRecentUpdatesTable({ rows }: { rows: ImageUpdaterRecentUpdate[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState headingLevel="h4" titleText="No recent updates">
        <EmptyStateBody>
          The controller did not record image updates in the last reconciliation cycle. Long-running audit history is
          not available on the ImageUpdater custom resource.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <OcsPrototypeListTable ariaLabel="Image update recent updates">
      <Thead>
        <Tr>
          <Th dataLabel="When">
            <PlainTableHeader label="When" />
          </Th>
          <Th dataLabel="Image">
            <PlainTableHeader label="Image" />
          </Th>
          <Th dataLabel="Alias">
            <PlainTableHeader label="Alias" />
          </Th>
          <Th dataLabel="New version">
            <PlainTableHeader label="New version" />
          </Th>
          <Th dataLabel="Apps updated">
            <PlainTableHeader label="Apps updated" />
          </Th>
          <Th dataLabel="Message">
            <PlainTableHeader label="Message" />
          </Th>
        </Tr>
      </Thead>
      <Tbody>
        {rows.map((row) => (
          <Tr key={`${row.updatedAtIso}-${row.alias}-${row.newVersion}`}>
            <Td dataLabel="When">{row.updatedAt}</Td>
            <Td dataLabel="Image">{row.image}</Td>
            <Td dataLabel="Alias">{row.alias}</Td>
            <Td dataLabel="New version">
              <code>{row.newVersion}</code>
            </Td>
            <Td dataLabel="Apps updated">{row.applicationsUpdated}</Td>
            <Td dataLabel="Message">{row.message}</Td>
          </Tr>
        ))}
      </Tbody>
    </OcsPrototypeListTable>
  );
}