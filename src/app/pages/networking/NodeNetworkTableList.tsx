import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Button,
  Content,
  Pagination,
  PaginationVariant,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewCheckboxFilter,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import AngleDownIcon from "@patternfly/react-icons/dist/esm/icons/angle-down-icon";
import AngleRightIcon from "@patternfly/react-icons/dist/esm/icons/angle-right-icon";
import { Tbody, Td, Th, Thead, Tr, Table } from "@patternfly/react-table";
import { IoDataViewFiltersWithMidActions } from "../../components/dataView/IoDataViewFiltersWithMidActions";
import {
  OCS_PROTOTYPE_DATAVIEW_CLASS,
  OCS_PROTOTYPE_TOOLBAR_CLASS,
  OcsPrototypeListTable,
  PlainTableHeader,
  SortableTableHeader,
  compareStrings,
  useListPagination,
  useTableSort,
  type SortDirection,
} from "../../components/dataView/OcsPrototypeListTable";
import { NetworkingTablePanel } from "./networkingShared";
import {
  nodeNetworkStateRowsFromGroups,
  type NodeNetworkInterfaceType,
  type NodeNetworkStateRow,
} from "./nodeNetworkStateMockData";
import type { WorkerNodeGroup } from "./networkTopologyData";

const INTERFACE_TYPE_LABELS: Record<NodeNetworkInterfaceType, string> = {
  ethernet: "ethernet",
  "ovs-bridge": "ovs-bridge",
  "ovs-interface": "ovs-interface",
  tunnel: "tunnel",
  unknown: "unknown",
};

const INTERFACE_TYPE_FILTER_OPTIONS = (
  Object.keys(INTERFACE_TYPE_LABELS) as NodeNetworkInterfaceType[]
).map((value) => ({
  value,
  label: INTERFACE_TYPE_LABELS[value],
}));

type NnsListFilters = {
  name: string;
  interface: string;
  interfaceType: string[];
};

type SortColumn = "name";

type NodeNetworkTableListProps = {
  groups: WorkerNodeGroup[];
  viewToggle?: ReactNode;
};

function groupInterfacesByType(row: NodeNetworkStateRow) {
  const buckets = new Map<NodeNetworkInterfaceType, NodeNetworkStateRow["interfaces"]>();
  row.interfaces.forEach((iface) => {
    const list = buckets.get(iface.type) ?? [];
    list.push(iface);
    buckets.set(iface.type, list);
  });
  return buckets;
}

function rowMatchesFilters(row: NodeNetworkStateRow, filters: NnsListFilters): boolean {
  const nameQuery = (filters.name ?? "").trim().toLowerCase();
  if (nameQuery) {
    const nameMatch =
      row.hostname.toLowerCase().includes(nameQuery) || row.shortName.toLowerCase().includes(nameQuery);
    if (!nameMatch) return false;
  }

  const interfaceQuery = (filters.interface ?? "").trim().toLowerCase();
  if (interfaceQuery) {
    const interfaceMatch = row.interfaces.some((iface) => iface.name.toLowerCase().includes(interfaceQuery));
    if (!interfaceMatch) return false;
  }

  const typeFilter = filters.interfaceType ?? [];
  if (typeFilter.length > 0) {
    const typeMatch = row.interfaces.some((iface) => typeFilter.includes(iface.type));
    if (!typeMatch) return false;
  }

  return true;
}

function sortNodeRows(rows: NodeNetworkStateRow[], column: SortColumn, direction: SortDirection) {
  return [...rows].sort((a, b) => {
    if (column === "name") return compareStrings(a.hostname, b.hostname, direction);
    return 0;
  });
}

export default function NodeNetworkTableList({ groups, viewToggle }: NodeNetworkTableListProps) {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<NnsListFilters>({
    filters: { name: "", interface: "", interfaceType: [] },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(() => new Set());

  const allRows = useMemo(() => nodeNetworkStateRowsFromGroups(groups), [groups]);
  const filtered = useMemo(
    () => allRows.filter((row) => rowMatchesFilters(row, filters)),
    [allRows, filters]
  );
  const sorted = useMemo(
    () => sortNodeRows(filtered, sortColumn, sortDirection),
    [filtered, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sorted, [filters], 10);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.interface, filters.interfaceType, perPage, setPage]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const expandAll = () => setExpandedNodeIds(new Set(sorted.map((row) => row.id)));
  const collapseAll = () => setExpandedNodeIds(new Set());

  const colSpan = 3;

  return (
    <NetworkingTablePanel>
      <DataView ouiaId="node-network-state-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
        <DataViewToolbar
          ouiaId="node-network-state-dv-toolbar"
          id="node-network-state-dv-toolbar"
          className={OCS_PROTOTYPE_TOOLBAR_CLASS}
          clearAllFilters={clearAllFilters}
          collapseListedFiltersBreakpoint="xl"
          filters={
            <IoDataViewFiltersWithMidActions<NnsListFilters>
              values={filters}
              onChange={(_id, partial) => onSetFilters(partial)}
              breakpoint="xl"
              midContent={
                <ToolbarGroup variant="action-group" gap={{ default: "gapSm" }} alignItems="center">
                  <ToolbarItem>
                    <Button variant="link" onClick={expandAll}>
                      Expand all
                    </Button>
                  </ToolbarItem>
                  <ToolbarItem>
                    <Button variant="link" onClick={collapseAll}>
                      Collapse all
                    </Button>
                  </ToolbarItem>
                  {viewToggle ? <ToolbarItem>{viewToggle}</ToolbarItem> : null}
                </ToolbarGroup>
              }
            >
              <DataViewTextFilter
                title="Name"
                filterId="name"
                placeholder="Search by name..."
                style={{ minWidth: "16rem", maxWidth: "100%" }}
              />
              <DataViewTextFilter
                title="Network interface"
                filterId="interface"
                placeholder="Search interfaces..."
                style={{ minWidth: "14rem", maxWidth: "100%" }}
              />
              <DataViewCheckboxFilter
                title="Interface type"
                filterId="interfaceType"
                placeholder="Choose interface types"
                showIcon
                showBadge
                options={INTERFACE_TYPE_FILTER_OPTIONS}
              />
            </IoDataViewFiltersWithMidActions>
          }
          pagination={
            <Pagination
              perPageOptions={[
                { title: "5", value: 5 },
                { title: "10", value: 10 },
                { title: "20", value: 20 },
                { title: "50", value: 50 },
              ]}
              itemCount={itemCount}
              page={page}
              perPage={perPage}
              onSetPage={(_e, p) => setPage(p)}
              onPerPageSelect={(_e, pp) => {
                setPerPage(pp);
                setPage(1);
              }}
              variant={PaginationVariant.top}
              isCompact
              ouiaId="node-network-state-pagination"
              widgetId="node-network-state-pagination"
              titles={{ items: "nodes" }}
              paginationAriaLabel="Node network state pagination"
            />
          }
        />
        <OcsPrototypeListTable ariaLabel="NodeNetworkState">
          <Thead>
            <Tr>
              <Th modifier="fitContent" screenReaderText="Expand row" />
              <Th dataLabel="Name">
                <SortableTableHeader
                  label="Name"
                  column="name"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                />
              </Th>
              <Th dataLabel="Network interface">
                <PlainTableHeader label="Network interface" />
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {paginated.length === 0 ? (
              <Tr>
                <Td colSpan={colSpan} dataLabel="Empty state">
                  <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-lg">
                    No nodes match your search or filters.
                  </Content>
                </Td>
              </Tr>
            ) : (
              paginated.map((row) => {
                const isExpanded = expandedNodeIds.has(row.id);
                const grouped = groupInterfacesByType(row);
                return (
                  <Fragment key={row.id}>
                    <Tr>
                      <Td modifier="fitContent">
                        <Button
                          variant="plain"
                          aria-label={isExpanded ? `Collapse ${row.hostname}` : `Expand ${row.hostname}`}
                          aria-expanded={isExpanded}
                          onClick={() => toggleNode(row.id)}
                          icon={isExpanded ? <AngleDownIcon aria-hidden /> : <AngleRightIcon aria-hidden />}
                        />
                      </Td>
                      <Td dataLabel="Name">{row.hostname}</Td>
                      <Td dataLabel="Network interface">
                        Network details {row.interfaceCount} interfaces
                      </Td>
                    </Tr>
                    {isExpanded ? (
                      <Tr isExpanded>
                        <Td />
                        <Td colSpan={2} className="ocs-node-network-table__details-cell">
                          <Table variant="compact" borders={false} aria-label={`Interfaces for ${row.hostname}`}>
                            <Thead>
                              <Tr>
                                <Th>Name</Th>
                                <Th>IP address</Th>
                                <Th>Ports</Th>
                                <Th>MAC address</Th>
                                <Th>LLDP</Th>
                                <Th>MTU</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {[...grouped.entries()].map(([type, interfaces]) => (
                                <Fragment key={`${row.id}-${type}`}>
                                  <Tr className="ocs-node-network-table__type-row">
                                    <Td colSpan={6}>
                                      {INTERFACE_TYPE_LABELS[type]} ({interfaces.length})
                                    </Td>
                                  </Tr>
                                  {interfaces.map((iface) => (
                                    <Tr key={iface.id}>
                                      <Td dataLabel="Name">{iface.name}</Td>
                                      <Td dataLabel="IP address">{iface.ipAddress}</Td>
                                      <Td dataLabel="Ports">{iface.ports}</Td>
                                      <Td dataLabel="MAC address">{iface.macAddress}</Td>
                                      <Td dataLabel="LLDP">{iface.lldp}</Td>
                                      <Td dataLabel="MTU">{iface.mtu}</Td>
                                    </Tr>
                                  ))}
                                </Fragment>
                              ))}
                            </Tbody>
                          </Table>
                        </Td>
                      </Tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </Tbody>
        </OcsPrototypeListTable>
      </DataView>
    </NetworkingTablePanel>
  );
}
