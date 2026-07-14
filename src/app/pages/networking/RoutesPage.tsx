import { useEffect, useMemo, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
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
import type { RouteRecord } from "./networkingMockData";
import { routeDetailPath, serviceDetailPath } from "./networkingMockData";
import { NetworkingPageShell, NetworkingTablePanel } from "./networkingShared";
import { useEndpointHealthAutoRefresh } from "./useEndpointHealthAutoRefresh";
import { useNetworkingResources } from "./useNetworkingResources";

type RouteFilters = { name: string };

type RouteColumnId = "name" | "health" | "location" | "service" | "host" | "tls" | "actions";

type SortColumn = "name" | "health" | "location" | "service" | "host" | "tls";

const ROUTE_COLUMNS: ManageColumnDef<RouteColumnId>[] = [
  { id: "name", label: "Name", isLocked: true, isDefault: true },
  { id: "health", label: "Health", isDefault: true },
  { id: "location", label: "Location", isDefault: true },
  { id: "service", label: "Service", isDefault: true },
  { id: "host", label: "Hostname", isDefault: true },
  { id: "actions", label: "Actions", isDefault: true },
  { id: "tls", label: "TLS termination" },
];

function rowMatchesFilters(row: RouteRecord, filters: RouteFilters): boolean {
  const q = (filters.name ?? "").trim().toLowerCase();
  return (
    !q ||
    row.name.toLowerCase().includes(q) ||
    row.host.toLowerCase().includes(q) ||
    row.serviceName.toLowerCase().includes(q)
  );
}

function sortRoutes(rows: RouteRecord[], column: SortColumn, direction: SortDirection): RouteRecord[] {
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
      case "location":
        return compareStrings(a.location, b.location, direction);
      case "service":
        return compareStrings(a.serviceName, b.serviceName, direction);
      case "host":
        return compareStrings(a.host, b.host, direction);
      case "tls":
        return compareStrings(a.tlsTermination, b.tlsTermination, direction);
      default:
        return 0;
    }
  });
}

function renderRouteHeader(
  colId: RouteColumnId,
  sortColumn: SortColumn,
  sortDirection: SortDirection,
  toggleSort: (column: SortColumn) => void
): ReactNode {
  if (colId === "actions") return <PlainTableHeader label="Actions" />;
  return (
    <SortableTableHeader
      label={ROUTE_COLUMNS.find((c) => c.id === colId)?.label ?? colId}
      column={colId as SortColumn}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={toggleSort}
    />
  );
}

function renderRouteCell(colId: RouteColumnId, route: RouteRecord): ReactNode {
  switch (colId) {
    case "name":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Label color="blue" isCompact className="ocs-resource-label">
            RT
          </Label>
          <Button
            variant="link"
            isInline
            component={Link}
            to={routeDetailPath(route.namespace, route.name)}
          >
            {route.name}
          </Button>
        </Flex>
      );
    case "health":
      return (
        <EndpointHealthCell
          health={deriveEndpointHealth(
            route.endpointReady,
            route.endpointTotal,
            route.endpointHealthLoaded !== false
          )}
        />
      );
    case "location":
      return <Content component="small">{route.location}</Content>;
    case "service":
      return (
        <Button
          variant="link"
          isInline
          component={Link}
          to={serviceDetailPath(route.serviceNamespace, route.serviceName)}
        >
          {route.serviceName}
        </Button>
      );
    case "host":
      return (
        <Content component="small" className="ocs-pods-list__mono">
          {route.host}
        </Content>
      );
    case "tls":
      return <Content component="small">{route.tlsTermination}</Content>;
    case "actions":
      return (
        <Button variant="plain" aria-label={`Actions for ${route.name}`} icon={<EllipsisVIcon />} />
      );
    default:
      return null;
  }
}

export default function RoutesPage() {
  const navigate = useNavigate();
  const { routeRecords } = useNetworkingResources();
  const { autoRefresh, setAutoRefresh } = useEndpointHealthAutoRefresh();
  const columns = useManageColumns(ROUTE_COLUMNS);
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<RouteFilters>({
    filters: { name: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filtered = useMemo(
    () => routeRecords.filter((r) => rowMatchesFilters(r, filters)),
    [filters, routeRecords]
  );
  const sorted = useMemo(
    () => sortRoutes(filtered, sortColumn, sortDirection),
    [filtered, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sorted, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, perPage, setPage]);

  const colSpan = Math.max(1, columns.visibleOrderedColumns.length);

  return (
    <NetworkingPageShell
      title="Routes"
      path="/networking/routes"
      createLabel="Create Route"
      onCreate={() => navigate("/networking/routes/create")}
    >
      <NetworkingTablePanel>
        <DataView ouiaId="routes-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
          <DataViewToolbar
            ouiaId="routes-dv-toolbar"
            id="routes-dv-toolbar"
            className={OCS_PROTOTYPE_TOOLBAR_CLASS}
            clearAllFilters={clearAllFilters}
            collapseListedFiltersBreakpoint="xl"
            filters={
              <IoDataViewFiltersWithMidActions<RouteFilters>
                values={filters}
                onChange={(_id, partial) => onSetFilters(partial)}
                breakpoint="xl"
                midContent={
                  <ToolbarGroup variant="action-group" gap={{ default: "gapSm" }}>
                    <ToolbarItem>
                      <Switch
                        id="routes-endpoint-health-auto-refresh"
                        label="Auto-refresh"
                        isChecked={autoRefresh}
                        onChange={(_e, checked) => setAutoRefresh(checked)}
                        ouiaId="routes-auto-refresh"
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
                ouiaId="routes-pagination"
                widgetId="routes-pagination"
                titles={{ items: "routes" }}
                paginationAriaLabel="Routes pagination"
              />
            }
          />
          <OcsPrototypeListTable ariaLabel="Routes">
            <Thead>
              <Tr>
                {columns.visibleOrderedColumns.map((col) => (
                  <Th
                    key={col.id}
                    dataLabel={col.label}
                    modifier={col.id === "health" || col.id === "actions" ? "fitContent" : undefined}
                  >
                    {renderRouteHeader(col.id, sortColumn, sortDirection, toggleSort)}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {paginated.length === 0 ? (
                <Tr>
                  <Td colSpan={colSpan} dataLabel="Empty state">
                    <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-lg">
                      No routes match your filters.
                    </Content>
                  </Td>
                </Tr>
              ) : (
                paginated.map((route) => (
                  <Tr key={`${route.namespace}/${route.name}`}>
                    {columns.visibleOrderedColumns.map((col) => (
                      <Td
                        key={col.id}
                        dataLabel={col.label}
                        isActionCell={col.id === "actions" ? true : undefined}
                        hasAction={col.id === "actions" ? true : undefined}
                      >
                        {renderRouteCell(col.id, route)}
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
