import { useMemo } from "react";
import {
  Button,
  Content,
  Flex,
  Label,
  Pagination,
  PaginationVariant,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
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
import { NetworkingPageShell, NetworkingTablePanel } from "./networkingShared";

type NadFilters = { name: string };

type SortColumn = "name" | "namespace" | "type";

interface NadRow {
  name: string;
  namespace: string;
  type: string;
}

const NAD_ROWS: NadRow[] = [
  {
    name: "default",
    namespace: "openshift-ovn-kubernetes",
    type: "ovn-k8s-cni-overlay",
  },
];

function rowMatchesFilters(row: NadRow, filters: NadFilters): boolean {
  const q = (filters.name ?? "").trim().toLowerCase();
  return !q || row.name.toLowerCase().includes(q);
}

function sortNadRows(rows: NadRow[], column: SortColumn, direction: SortDirection): NadRow[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "namespace":
        return compareStrings(a.namespace, b.namespace, direction);
      case "type":
        return compareStrings(a.type, b.type, direction);
      default:
        return 0;
    }
  });
}

export default function NetworkAttachmentDefinitionsPage() {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<NadFilters>({
    filters: { name: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filtered = useMemo(
    () => NAD_ROWS.filter((r) => rowMatchesFilters(r, filters)),
    [filters]
  );
  const sorted = useMemo(
    () => sortNadRows(filtered, sortColumn, sortDirection),
    [filtered, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sorted, [filters], 20);

  const colSpan = 4;

  return (
    <NetworkingPageShell
      title="NetworkAttachmentDefinitions"
      path="/networking/networkattachmentdefinitions"
      createLabel="Create NetworkAttachmentDefinition"
    >
      <NetworkingTablePanel>
        <DataView ouiaId="nad-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
          <DataViewToolbar
            ouiaId="nad-dv-toolbar"
            id="nad-dv-toolbar"
            className={OCS_PROTOTYPE_TOOLBAR_CLASS}
            clearAllFilters={clearAllFilters}
            collapseListedFiltersBreakpoint="xl"
            filters={
              <IoDataViewFiltersWithMidActions<NadFilters>
                values={filters}
                onChange={(_id, partial) => onSetFilters(partial)}
                breakpoint="xl"
                midContent={
                  <ToolbarGroup variant="action-group" gap={{ default: "gapSm" }}>
                    <ToolbarItem>
                      <Button variant="plain" aria-label="List view" isAriaPressed icon={<ListIcon />} />
                    </ToolbarItem>
                    <ToolbarItem>
                      <Button variant="plain" aria-label="Refresh" icon={<SyncIcon />} />
                    </ToolbarItem>
                  </ToolbarGroup>
                }
              >
                <DataViewTextFilter
                  title="Name"
                  filterId="name"
                  placeholder="Search by name..."
                  style={{ minWidth: "16rem", maxWidth: "100%" }}
                />
              </IoDataViewFiltersWithMidActions>
            }
            pagination={
              <Pagination
                perPageOptions={[
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
                ouiaId="nad-pagination"
                widgetId="nad-pagination"
                titles={{ items: "definitions" }}
                paginationAriaLabel="NetworkAttachmentDefinitions pagination"
              />
            }
          />
          <OcsPrototypeListTable ariaLabel="NetworkAttachmentDefinitions">
            <Thead>
              <Tr>
                <Th dataLabel="Name">
                  <SortableTableHeader
                    label="Name"
                    column="name"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                </Th>
                <Th dataLabel="Namespace">
                  <SortableTableHeader
                    label="Namespace"
                    column="namespace"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                </Th>
                <Th dataLabel="Type">
                  <SortableTableHeader
                    label="Type"
                    column="type"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                </Th>
                <Th modifier="fitContent" dataLabel="Actions">
                  <PlainTableHeader label="Actions" />
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginated.length === 0 ? (
                <Tr>
                  <Td colSpan={colSpan} dataLabel="Empty state">
                    <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-lg">
                      No network attachment definitions match your filters.
                    </Content>
                  </Td>
                </Tr>
              ) : (
                paginated.map((row) => (
                  <Tr key={`${row.namespace}/${row.name}`}>
                    <Td dataLabel="Name">
                      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                        <Label color="blue" isCompact className="ocs-resource-label">
                          NAD
                        </Label>
                        <Button variant="link" isInline>
                          {row.name}
                        </Button>
                      </Flex>
                    </Td>
                    <Td dataLabel="Namespace">
                      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                        <Label color="green" isCompact className="ocs-resource-label">
                          NS
                        </Label>
                        <Button variant="link" isInline>
                          {row.namespace}
                        </Button>
                      </Flex>
                    </Td>
                    <Td dataLabel="Type">
                      <Content component="small">{row.type}</Content>
                    </Td>
                    <Td dataLabel="Actions" isActionCell hasAction>
                      <Button variant="plain" aria-label={`Actions for ${row.name}`} icon={<EllipsisVIcon />} />
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </OcsPrototypeListTable>
        </DataView>
      </NetworkingTablePanel>
    </NetworkingPageShell>
  );
}
