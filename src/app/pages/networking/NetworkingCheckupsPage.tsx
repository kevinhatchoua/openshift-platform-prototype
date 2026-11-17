import { Button, Label } from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import {
  OcsNamedResourceDataView,
  PlainTableHeader,
} from "../../components/dataView/OcsPrototypeListTable";
import NmStateOperatorBlockedState from "./NmStateOperatorBlockedState";
import { NetworkingPageShell, NetworkingTablePanel } from "./networkingShared";
import { useNmStateDependencyBlocked } from "./useNmStateDependencyBlocked";

const CHECKUPS = [
  {
    name: "nmstate-report",
    label: "Node network state report",
    status: "Blocked",
    description: "Collects nmstate-reported interfaces and routes for cluster nodes.",
  },
] as const;

function checkupName(row: (typeof CHECKUPS)[number]) {
  return row.name;
}

export default function NetworkingCheckupsPage() {
  const blocked = useNmStateDependencyBlocked();

  return (
    <NetworkingPageShell title="Checkups" path="/networking/checkups">
      {blocked ? (
        <NmStateOperatorBlockedState surfaceName="Networking checkups" compact />
      ) : (
        <NetworkingTablePanel>
          <OcsNamedResourceDataView
            ouiaId="networking-checkups-data-view"
            ariaLabel="Networking checkups"
            itemsLabel="checkups"
            items={[...CHECKUPS]}
            getName={checkupName}
            defaultPerPage={10}
          >
            {(rows) => (
              <>
                <Thead>
                  <Tr>
                    <Th dataLabel="Name">
                      <PlainTableHeader label="Name" />
                    </Th>
                    <Th dataLabel="Status">
                      <PlainTableHeader label="Status" />
                    </Th>
                    <Th dataLabel="Description">
                      <PlainTableHeader label="Description" />
                    </Th>
                    <Th modifier="fitContent" dataLabel="Actions">
                      <PlainTableHeader label="Actions" />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((row) => (
                    <Tr key={row.name}>
                      <Td dataLabel="Name">{row.label}</Td>
                      <Td dataLabel="Status">
                        <Label color="green" isCompact>
                          Ready
                        </Label>
                      </Td>
                      <Td dataLabel="Description">{row.description}</Td>
                      <Td dataLabel="Actions" isActionCell hasAction>
                        <Button variant="secondary" size="sm">
                          Run checkup
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </>
            )}
          </OcsNamedResourceDataView>
        </NetworkingTablePanel>
      )}
    </NetworkingPageShell>
  );
}