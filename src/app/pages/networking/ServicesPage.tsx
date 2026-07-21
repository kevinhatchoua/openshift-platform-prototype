import { useEffect, useMemo, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Button,
  Content,
  Flex,
  Label,
  Pagination,
  PaginationVariant,
  Switch,
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
  type ManageColumnDef,
  useManageColumns,
} from "../../components/dataView/ManageColumnsModal";
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
import {
  EndpointHealthCell,
  deriveEndpointHealth,
  healthSortKey,
} from "./EndpointHealthCell";
import type { ServiceRecord } from "./networkingMockData";
import { serviceDetailPath } from "./networkingMockData";
import { NetworkingPageShell, NetworkingTablePanel } from "./networkingShared";
import { useEndpointHealthAutoRefresh } from "./useEndpointHealthAutoRefresh";
import { useNetworkingResources } from "./useNetworkingResources";

type ServiceFilters = { name: string };

type ServiceColumnId = "name" | "health" | "labels" | "podSelector" | "location" | "type" | "actions";

type SortColumn = "name" | "health" | "labels" | "podSelector" | "location" | "type";

const SERVICE_COLUMNS: ManageColumnDef<ServiceColumnId>[] = [
  { id: "name", label: "Name", isLocked: true, isDefault: true },
  { id: "health", label: "Health", isDefault: true },
  { id: "labels", label: "Labels", isDefault: true },
  { id: "podSelector", label: "Pod selector", isDefault: true },
  { id: "location", label: "Location", isDefault: true },
  { id: "actions", label: "Actions", isDefault: true },
  { id: "type", label: "Type" },
];

function rowMatchesFilters(row: ServiceRecord, filters: ServiceFilters): boolean {
  const q = (filters.name ?? "").trim().toLowerCase();
  return !q || row.name.toLowerCase().includes(q);
}

function sortServices(
  rows: ServiceRecord[],
  column: SortColumn,
  direction: SortDirection
): ServiceRecord[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "health": {
        const ha = deriveEndpointHealth(a.endpointReady, a.endpointTotal, a.endpointHealthLoaded !== false);
        const hb = deriveEndpointHealth(b.endpointReady, b.endpointTotal, b.endpointHealthLoaded !== false);
        const diff = healthSortKey(ha) - healthSortKey(hb);
        return direction === "asc" ? diff : -diff;
      }
      case "labels":
        return compareStrings(
          a.labels.map((l) => `${l.key}=${l.value}`).join(", "),
          b.labels.map((l) => `${l.key}=${l.value}`).join(", "),
          direction
        );
      case "podSelector":
        return compareStrings(a.podSelector, b.podSelector, direction);
      case "location":
        return compareStrings(a.location, b.location, direction);
      case "type":
        return compareStrings(a.type, b.type, direction);
      default:
        return 0;
    }
  });
}

function renderServiceHeader(
  colId: ServiceColumnId,
  sortColumn: SortColumn,
  sortDirection: SortDirection,
  toggleSort: (column: SortColumn) => void
): ReactNode {
  if (colId === "actions") return <PlainTableHeader label="Actions" />;
  return (
    <SortableTableHeader
      label={SERVICE_COLUMNS.find((c) => c.id === colId)?.label ?? colId}
      column={colId as SortColumn}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={toggleSort}
    />
  );
}

function renderServiceCell(colId: ServiceColumnId, svc: ServiceRecord): ReactNode {
  switch (colId) {
    case "name":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Label color="green" isCompact className="ocs-resource-label">
            S
          </Label>
          <Button variant="link" isInline component={Link} to={serviceDetailPath(svc.namespace, svc.name)}>
            {svc.name}
          </Button>
        </Flex>
      );
    case "health":
      return (
        <EndpointHealthCell
          health={deriveEndpointHealth(
            svc.endpointReady,
            svc.endpointTotal,
            svc.endpointHealthLoaded !== false
          )}
        />
      );
    case "labels":
      return svc.labels.length === 0 ? (
        <Content component="small">No labels</Content>
      ) : (
        <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
          {svc.labels.map((l) => (
            <Label key={l.key} color="green" isCompact>
              {l.key}={l.value}
            </Label>
          ))}
        </Flex>
      );
    case "podSelector":
      return (
        <Button variant="link" isInline>
          {svc.podSelector}
        </Button>
      );
    case "location":
      return <Content component="small">{svc.location || "—"}</Content>;
    case "type":
      return <Content component="small">{svc.type}</Content>;
    case "actions":
      return (
        <Button variant="plain" aria-label={`Actions for ${svc.name}`} icon={<EllipsisVIcon />} />
      );
    default:
      return null;
  }
}

export default function ServicesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { serviceRecords } = useNetworkingResources();
  const { autoRefresh, setAutoRefresh } = useEndpointHealthAutoRefresh();
  const columns = useManageColumns(SERVICE_COLUMNS);
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<ServiceFilters>({
    filters: { name: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filtered = useMemo(
    () => serviceRecords.filter((s) => rowMatchesFilters(s, filters)),
    [filters, serviceRecords]
  );
  const sorted = useMemo(
    () => sortServices(filtered, sortColumn, sortDirection),
    [filtered, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sorted, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, perPage, setPage]);

  useEffect(() => {
    if (searchParams.get("create") !== "service") return;
    const next = new URLSearchParams(searchParams);
    next.delete("create");
    setSearchParams(next, { replace: true });
    navigate("/networking/services/create");
  }, [navigate, searchParams, setSearchParams]);

  const colSpan = Math.max(1, columns.visibleOrderedColumns.length);

  return (
    <NetworkingPageShell
      title="Services"
      path="/networking"
      createLabel="Create Service"
      onCreate={() => navigate("/networking/services/create")}
    >
      <NetworkingTablePanel>
        <DataView ouiaId="services-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
          <DataViewToolbar
            ouiaId="services-dv-toolbar"
            id="services-dv-toolbar"
            className={OCS_PROTOTYPE_TOOLBAR_CLASS}
            clearAllFilters={clearAllFilters}
            collapseListedFiltersBreakpoint="xl"
            filters={
              <IoDataViewFiltersWithMidActions<ServiceFilters>
                values={filters}
                onChange={(_id, partial) => onSetFilters(partial)}
                breakpoint="xl"
                midContent={
                  <ToolbarGroup variant="action-group" gap={{ default: "gapSm" }}>
                    <ToolbarItem>
                      <Switch
                        id="services-endpoint-health-auto-refresh"
                        label="Auto-refresh"
                        isChecked={autoRefresh}
                        onChange={(_e, checked) => setAutoRefresh(checked)}
                        ouiaId="services-auto-refresh"
                      />
                    </ToolbarItem>
                    {columns.manageColumnsButton}
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
                ouiaId="services-pagination"
                widgetId="services-pagination"
                titles={{ items: "services" }}
                paginationAriaLabel="Services pagination"
              />
            }
          />
          <OcsPrototypeListTable ariaLabel="Services">
            <Thead>
              <Tr>
                {columns.visibleOrderedColumns.map((col) => (
                  <Th
                    key={col.id}
                    dataLabel={col.label}
                    modifier={col.id === "health" || col.id === "actions" ? "fitContent" : undefined}
                  >
                    {renderServiceHeader(col.id, sortColumn, sortDirection, toggleSort)}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {paginated.length === 0 ? (
                <Tr>
                  <Td colSpan={colSpan} dataLabel="Empty state">
                    <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-lg">
                      No services match your filters.
                    </Content>
                  </Td>
                </Tr>
              ) : (
                paginated.map((svc) => (
                  <Tr key={`${svc.namespace}/${svc.name}`}>
                    {columns.visibleOrderedColumns.map((col) => (
                      <Td
                        key={col.id}
                        dataLabel={col.label}
                        isActionCell={col.id === "actions" ? true : undefined}
                        hasAction={col.id === "actions" ? true : undefined}
                      >
                        {renderServiceCell(col.id, svc)}
                      </Td>
                    ))}
                  </Tr>
                ))
              )}
            </Tbody>
          </OcsPrototypeListTable>
        </DataView>
      </NetworkingTablePanel>
      {columns.manageColumnsModal}
    </NetworkingPageShell>
  );
}
