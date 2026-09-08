import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button, Content, Flex, Pagination, PaginationVariant, ToolbarGroup, ToolbarItem } from "@patternfly/react-core";
import {
  DataView,
  DataViewCheckboxFilter,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import { IoDataViewFiltersWithMidActions } from "../../components/dataView/IoDataViewFiltersWithMidActions";
import {
  OCS_PROTOTYPE_DATAVIEW_CLASS,
  OCS_PROTOTYPE_TOOLBAR_CLASS,
  OcsPrototypeListTable,
  PlainTableHeader,
  useListPagination,
} from "../../components/dataView/OcsPrototypeListTable";
import { applicationsForInstance, gitopsDetailPath, type ApplicationRecord } from "./gitopsData";
import GitOpsApplicationDetailRich from "./GitOpsApplicationDetailRich";
import GitOpsPageHeader, { useGitOpsInstance } from "./GitOpsPageHeader";
import { GitOpsEditDeleteMenu, HealthStatus, OwnerReferencesCell, ResourceName } from "./gitopsShared";

type ApplicationFilters = {
  name: string;
  namespace: string;
  sync: string[];
  health: string[];
};

const SYNC_OPTIONS = [
  { value: "Synced", label: "Synced" },
  { value: "OutOfSync", label: "Out of sync" },
];

const HEALTH_OPTIONS = [
  { value: "Healthy", label: "Healthy" },
  { value: "Progressing", label: "Progressing" },
  { value: "Degraded", label: "Degraded" },
  { value: "Paused", label: "Paused" },
];

function rowMatches(row: ApplicationRecord, filters: ApplicationFilters) {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  const nsQ = (filters.namespace ?? "").trim().toLowerCase();
  const syncFilters = filters.sync ?? [];
  const healthFilters = filters.health ?? [];
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  if (nsQ && !row.ns.toLowerCase().includes(nsQ)) return false;
  if (syncFilters.length > 0 && !syncFilters.includes(row.sync)) return false;
  if (healthFilters.length > 0 && !healthFilters.includes(row.health)) return false;
  return true;
}

export default function GitOpsApplicationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { instance } = useGitOpsInstance();
  const initialSync = searchParams.getAll("sync");
  const initialHealth = searchParams.getAll("health");
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<ApplicationFilters>({
    filters: {
      name: "",
      namespace: "",
      sync: initialSync,
      health: initialHealth,
    },
  });

  useEffect(() => {
    if (initialSync.length > 0 || initialHealth.length > 0) {
      onSetFilters({
        sync: initialSync,
        health: initialHealth,
      });
    }
  }, [initialHealth, initialSync, onSetFilters]);

  const items = applicationsForInstance(instance);
  const filtered = useMemo(() => items.filter((row) => rowMatches(row, filters)), [items, filters]);
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(filtered, [filters], 10);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.namespace, filters.sync ?? [], filters.health ?? [], perPage, setPage]);

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/overview" },
          { label: "Applications", path: "/gitops/applications" },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <GitOpsPageHeader
            title="Applications"
            path="/gitops/applications"
            actions={
              <Button variant="primary" onClick={() => navigate("/gitops/create?kind=application")}>
                Create Application
              </Button>
            }
          />

          <DataView ouiaId="gitops-applications-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
            <DataViewToolbar
              ouiaId="gitops-applications-toolbar"
              id="gitops-applications-toolbar"
              className={OCS_PROTOTYPE_TOOLBAR_CLASS}
              clearAllFilters={clearAllFilters}
              collapseListedFiltersBreakpoint="xl"
              filters={
                <IoDataViewFiltersWithMidActions<ApplicationFilters>
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
                  <DataViewTextFilter title="Name" filterId="name" placeholder="Filter by name..." />
                  <DataViewTextFilter title="Namespace" filterId="namespace" placeholder="Filter by namespace..." />
                  <DataViewCheckboxFilter title="Sync status" filterId="sync" options={SYNC_OPTIONS} />
                  <DataViewCheckboxFilter title="Health status" filterId="health" options={HEALTH_OPTIONS} />
                </IoDataViewFiltersWithMidActions>
              }
              pagination={
                <Pagination
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
                  titles={{ items: "applications" }}
                  perPageOptions={[
                    { title: "10", value: 10 },
                    { title: "20", value: 20 },
                    { title: "50", value: 50 },
                  ]}
                />
              }
            />
            <OcsPrototypeListTable ariaLabel="Applications">
              <Thead>
                <Tr>
                  <Th dataLabel="Name">
                    <PlainTableHeader label="Name" />
                  </Th>
                  <Th dataLabel="Namespace">
                    <PlainTableHeader label="Namespace" />
                  </Th>
                  <Th dataLabel="AppProject">
                    <PlainTableHeader label="AppProject" />
                  </Th>
                  <Th dataLabel="Sync status">
                    <PlainTableHeader label="Sync status" />
                  </Th>
                  <Th dataLabel="Health">
                    <PlainTableHeader label="Health" />
                  </Th>
                  <Th dataLabel="Managed by">
                    <PlainTableHeader label="Managed by" />
                  </Th>
                  <Th dataLabel="Age">
                    <PlainTableHeader label="Age" />
                  </Th>
                  <Th modifier="fitContent" dataLabel="Actions">
                    <PlainTableHeader label="Actions" />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginated.length === 0 ? (
                  <Tr>
                    <Td colSpan={8}>
                      <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-lg">
                        No applications match your filters.
                      </Content>
                    </Td>
                  </Tr>
                ) : (
                  paginated.map((item) => {
                    const href = gitopsDetailPath("applications", item.ns, item.name);
                    return (
                      <Tr key={`${item.ns}/${item.name}`} onClick={() => navigate(href)}>
                        <Td dataLabel="Name">
                          <ResourceName kind="Application" name={item.name} to={href} />
                        </Td>
                        <Td dataLabel="Namespace">
                          <ResourceName kind="Namespace" name={item.ns} />
                        </Td>
                        <Td dataLabel="AppProject">{item.project}</Td>
                        <Td dataLabel="Sync status">
                          <HealthStatus status={item.sync} />
                        </Td>
                        <Td dataLabel="Health">
                          <HealthStatus status={item.health} />
                        </Td>
                        <Td dataLabel="Managed by">
                          <OwnerReferencesCell refs={item.ownerReferences} ns={item.ns} />
                        </Td>
                        <Td dataLabel="Age">{item.age}</Td>
                        <Td dataLabel="Actions" isActionCell hasAction>
                          <GitOpsEditDeleteMenu kind="Application" name={item.name} />
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </OcsPrototypeListTable>
          </DataView>
          <Content component="small" className="pf-v6-u-color-200">
            Resource graph and topology sidebars: Resource Tree tab on Application detail (HPUX-1942).
          </Content>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}

export function GitOpsApplicationDetailPage() {
  return <GitOpsApplicationDetailRich />;
}
