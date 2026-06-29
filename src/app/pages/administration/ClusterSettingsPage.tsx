import { useState, useEffect, useMemo } from "react";
import {
  Button,
  Content,
  Pagination,
  PaginationVariant,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { CheckCircle, AlertCircle, Clock, ExternalLink, ChevronDown, ChevronUp, Loader2 } from "@/lib/pfIcons";
import { Link } from "react-router";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
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

type SettingsTab = "details" | "cluster-operators" | "configuration";

interface ClusterOperator {
  name: string;
  version: string;
  available: boolean;
  progressing: boolean;
  degraded: boolean;
  message?: string;
  lastTransition: string;
}

const CLUSTER_OPERATORS: ClusterOperator[] = [
  { name: "authentication", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "2h ago" },
  { name: "cloud-controller-manager", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "cloud-credential", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "cluster-autoscaler", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "config-operator", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "console", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "1d ago" },
  { name: "dns", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "etcd", version: "5.0.12", available: true, progressing: false, degraded: true, message: "EtcdMembersDegraded: unhealthy member", lastTransition: "45m ago" },
  { name: "image-registry", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "ingress", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "insights", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "kube-apiserver", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "6h ago" },
  { name: "kube-controller-manager", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "6h ago" },
  { name: "kube-scheduler", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "6h ago" },
  { name: "kube-storage-version-migrator", version: "5.0.12", available: true, progressing: true, degraded: false, message: "StorageVersionMigration in progress", lastTransition: "15m ago" },
  { name: "machine-api", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "machine-approver", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "machine-config", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "2d ago" },
  { name: "marketplace", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "monitoring", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "1d ago" },
  { name: "network", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "node-tuning", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "openshift-apiserver", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "6h ago" },
  { name: "openshift-controller-manager", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "6h ago" },
  { name: "openshift-samples", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "operator-lifecycle-manager", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "operator-lifecycle-manager-catalog", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "service-ca", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
  { name: "storage", version: "5.0.12", available: true, progressing: false, degraded: false, lastTransition: "3d ago" },
];

interface ConfigResource {
  name: string;
  apiVersion: string;
  kind: string;
}

const CONFIG_RESOURCES: ConfigResource[] = [
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "APIServer" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Authentication" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Build" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Console" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "DNS" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "FeatureGate" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Image" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Infrastructure" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Ingress" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Network" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Node" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "OAuth" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "OperatorHub" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Project" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Proxy" },
  { name: "cluster", apiVersion: "config.openshift.io/v1", kind: "Scheduler" },
];

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-[4px] text-[12px] font-['Red_Hat_Text:Regular',sans-serif] ${ok ? "text-[#3e8635]" : "text-[#c9190b]"}`}>
      {ok ? <CheckCircle className="size-[13px]" /> : <AlertCircle className="size-[13px]" />}
      {label}
    </span>
  );
}

type ClusterOperatorFilters = { name: string };
type ClusterOperatorSortColumn = "name" | "version" | "available" | "progressing" | "degraded" | "lastTransition";

function rowMatchesClusterOperatorFilters(row: ClusterOperator, filters: ClusterOperatorFilters): boolean {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  return true;
}

function sortClusterOperators(rows: ClusterOperator[], column: ClusterOperatorSortColumn, direction: SortDirection): ClusterOperator[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "version":
        return compareStrings(a.version, b.version, direction);
      case "available":
        return compareStrings(a.available ? "True" : "False", b.available ? "True" : "False", direction);
      case "progressing":
        return compareStrings(a.progressing ? "True" : "False", b.progressing ? "True" : "False", direction);
      case "degraded":
        return compareStrings(a.degraded ? "True" : "False", b.degraded ? "True" : "False", direction);
      case "lastTransition":
        return compareStrings(a.lastTransition, b.lastTransition, direction);
      default:
        return 0;
    }
  });
}

function ClusterOperatorsTab() {
  const [expandedOp, setExpandedOp] = useState<string | null>(null);
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<ClusterOperatorFilters>({
    filters: { name: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<ClusterOperatorSortColumn>("name");

  const filteredRows = useMemo(
    () => CLUSTER_OPERATORS.filter((row) => rowMatchesClusterOperatorFilters(row, filters)),
    [filters]
  );
  const sortedRows = useMemo(
    () => sortClusterOperators(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, perPage, setPage]);

  const colSpan = 6;

  return (
    <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] rounded-[16px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.06)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] mb-[24px] overflow-hidden">
      <DataView ouiaId="cluster-operators-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
        <DataViewToolbar
          ouiaId="cluster-operators-dv-toolbar"
          id="cluster-operators-dv-toolbar"
          className={OCS_PROTOTYPE_TOOLBAR_CLASS}
          clearAllFilters={clearAllFilters}
          collapseListedFiltersBreakpoint="xl"
          filters={
            <IoDataViewFiltersWithMidActions<ClusterOperatorFilters>
              values={filters}
              onChange={(_filterId, partial) => onSetFilters(partial)}
              breakpoint="xl"
            >
              <DataViewTextFilter
                title="Name"
                filterId="name"
                placeholder="Filter by name..."
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
              ouiaId="cluster-operators-pagination"
              widgetId="cluster-operators-pagination"
              titles={{ items: "cluster operators" }}
              paginationAriaLabel="Cluster operators pagination"
            />
          }
        />

        <OcsPrototypeListTable ariaLabel="Cluster operators">
          <Thead>
            <Tr>
              <Th dataLabel="Name">
                <SortableTableHeader label="Name" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              </Th>
              <Th dataLabel="Version">
                <SortableTableHeader label="Version" column="version" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              </Th>
              <Th dataLabel="Available">
                <SortableTableHeader label="Available" column="available" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              </Th>
              <Th dataLabel="Progressing">
                <SortableTableHeader label="Progressing" column="progressing" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              </Th>
              <Th dataLabel="Degraded">
                <SortableTableHeader label="Degraded" column="degraded" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              </Th>
              <Th dataLabel="Last Transition">
                <SortableTableHeader label="Last Transition" column="lastTransition" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {paginated.length === 0 ? (
              <Tr>
                <Td colSpan={colSpan} dataLabel="Empty state">
                  <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-lg">
                    No cluster operators match your filters.
                  </Content>
                </Td>
              </Tr>
            ) : (
              paginated.flatMap((op) => {
                const rows = [
                  <Tr
                    key={op.name}
                    onClick={() => setExpandedOp(expandedOp === op.name ? null : op.name)}
                    className={op.degraded ? "ocs-cluster-operator-row--degraded" : undefined}
                    style={{ cursor: "pointer" }}
                  >
                    <Td dataLabel="Name">
                      <div className="flex items-center gap-[6px]">
                        {expandedOp === op.name ? <ChevronUp className="size-[14px] text-[#6a6e73]" /> : <ChevronDown className="size-[14px] text-[#6a6e73]" />}
                        <Content component="small">{op.name}</Content>
                      </div>
                    </Td>
                    <Td dataLabel="Version">
                      <Content component="small">{op.version}</Content>
                    </Td>
                    <Td dataLabel="Available">
                      <StatusBadge ok={op.available} label={op.available ? "True" : "False"} />
                    </Td>
                    <Td dataLabel="Progressing">
                      {op.progressing ? (
                        <span className="inline-flex items-center gap-[4px] text-[12px] text-[#0066cc] dark:text-[#4dabf7]">
                          <Clock className="size-[13px]" /> True
                        </span>
                      ) : (
                        <Content component="small">False</Content>
                      )}
                    </Td>
                    <Td dataLabel="Degraded">
                      <StatusBadge ok={!op.degraded} label={op.degraded ? "True" : "False"} />
                    </Td>
                    <Td dataLabel="Last Transition">
                      <Content component="small">{op.lastTransition}</Content>
                    </Td>
                  </Tr>,
                ];
                if (expandedOp === op.name) {
                  rows.push(
                    <Tr key={`${op.name}-detail`}>
                      <Td colSpan={colSpan} dataLabel="Details">
                        <div className="grid grid-cols-2 gap-[16px] text-[13px]">
                          <div>
                            <span className="text-[11px] uppercase tracking-wide text-[#6a6e73] dark:text-[#8a8d90] block mb-[4px]">Operator</span>
                            <Content component="small">{op.name}</Content>
                          </div>
                          <div>
                            <span className="text-[11px] uppercase tracking-wide text-[#6a6e73] dark:text-[#8a8d90] block mb-[4px]">Version</span>
                            <Content component="small">{op.version}</Content>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[11px] uppercase tracking-wide text-[#6a6e73] dark:text-[#8a8d90] block mb-[4px]">Message</span>
                            <Content component="small">{op.message || "All is well"}</Content>
                          </div>
                        </div>
                      </Td>
                    </Tr>
                  );
                }
                return rows;
              })
            )}
          </Tbody>
        </OcsPrototypeListTable>
      </DataView>
    </div>
  );
}

type ConfigResourceFilters = { name: string; kind: string };
type ConfigResourceSortColumn = "name" | "kind" | "apiVersion";

function rowMatchesConfigResourceFilters(row: ConfigResource, filters: ConfigResourceFilters): boolean {
  const nameQ = (filters.name ?? "").trim().toLowerCase();
  const kindQ = (filters.kind ?? "").trim().toLowerCase();
  if (nameQ && !row.name.toLowerCase().includes(nameQ)) return false;
  if (kindQ && !row.kind.toLowerCase().includes(kindQ)) return false;
  return true;
}

function sortConfigResources(rows: ConfigResource[], column: ConfigResourceSortColumn, direction: SortDirection): ConfigResource[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "kind":
        return compareStrings(a.kind, b.kind, direction);
      case "apiVersion":
        return compareStrings(a.apiVersion, b.apiVersion, direction);
      default:
        return 0;
    }
  });
}

function ConfigurationTab() {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<ConfigResourceFilters>({
    filters: { name: "", kind: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<ConfigResourceSortColumn>("kind");

  const filteredRows = useMemo(
    () => CONFIG_RESOURCES.filter((row) => rowMatchesConfigResourceFilters(row, filters)),
    [filters]
  );
  const sortedRows = useMemo(
    () => sortConfigResources(filteredRows, sortColumn, sortDirection),
    [filteredRows, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sortedRows, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.kind, perPage, setPage]);

  const colSpan = 4;

  return (
    <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] rounded-[16px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.06)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] mb-[24px] overflow-hidden">
      <DataView ouiaId="configuration-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
        <DataViewToolbar
          ouiaId="configuration-dv-toolbar"
          id="configuration-dv-toolbar"
          className={OCS_PROTOTYPE_TOOLBAR_CLASS}
          clearAllFilters={clearAllFilters}
          collapseListedFiltersBreakpoint="xl"
          filters={
            <IoDataViewFiltersWithMidActions<ConfigResourceFilters>
              values={filters}
              onChange={(_filterId, partial) => onSetFilters(partial)}
              breakpoint="xl"
            >
              <DataViewTextFilter
                title="Name"
                filterId="name"
                placeholder="Filter by name..."
                style={{ minWidth: "14rem", maxWidth: "100%" }}
              />
              <DataViewTextFilter
                title="Kind"
                filterId="kind"
                placeholder="Filter by kind..."
                style={{ minWidth: "14rem", maxWidth: "100%" }}
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
              ouiaId="configuration-pagination"
              widgetId="configuration-pagination"
              titles={{ items: "configuration resources" }}
              paginationAriaLabel="Configuration resources pagination"
            />
          }
        />

        <OcsPrototypeListTable ariaLabel="Configuration resources">
          <Thead>
            <Tr>
              <Th dataLabel="Name">
                <SortableTableHeader label="Name" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              </Th>
              <Th dataLabel="Kind">
                <SortableTableHeader label="Kind" column="kind" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
              </Th>
              <Th dataLabel="API Version">
                <SortableTableHeader label="API Version" column="apiVersion" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
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
                    No configuration resources match your filters.
                  </Content>
                </Td>
              </Tr>
            ) : (
              paginated.map((r) => (
                <Tr key={`${r.kind}-${r.name}`}>
                  <Td dataLabel="Name">
                    <Content component="small">{r.name}</Content>
                  </Td>
                  <Td dataLabel="Kind">
                    <Content component="small">{r.kind}</Content>
                  </Td>
                  <Td dataLabel="API Version">
                    <Content component="small">{r.apiVersion}</Content>
                  </Td>
                  <Td dataLabel="Actions">
                    <Button
                      component="a"
                      variant="link"
                      isInline
                      href={`https://docs.openshift.com/container-platform/latest/rest_api/config_apis/${r.kind.toLowerCase()}-${r.apiVersion.split("/")[0]}-${r.apiVersion.split("/")[1]}.html`}
                      target="_blank"
                      rel="noopener noreferrer"
                      icon={<ExternalLink className="size-[11px]" />}
                    >
                      API Reference
                    </Button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </OcsPrototypeListTable>
      </DataView>
    </div>
  );
}

export default function ClusterSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("details");
  const [isUpdateInProgress, setIsUpdateInProgress] = useState(false);
  const [updateVersion, setUpdateVersion] = useState("5.1.10");

  useEffect(() => {
    const check = () => {
      const stored = localStorage.getItem("clusterUpdateInProgress");
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setIsUpdateInProgress(true);
          setUpdateVersion(data.version || "5.1.10");
        } catch { setIsUpdateInProgress(false); }
      } else {
        setIsUpdateInProgress(false);
      }
    };
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden ocs-app-page-outer ocs-app-page-outer--end-3xl">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Cluster Settings" },
        ]}
      >

      <div className="mb-[24px]">
        <div className="flex items-center justify-between mb-[16px]">
          <h1 className="font-['Red_Hat_Display_VF:Medium',sans-serif] font-medium leading-[36.4px] text-[#151515] dark:text-white text-[28px]">
            Cluster Settings
          </h1>
          <FavoriteButton name="Cluster Settings" path="/administration/cluster-settings" />
        </div>
        <div className="flex gap-[24px] text-[14px] border-b border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
          {([["details", "Details"], ["cluster-operators", "ClusterOperators"], ["configuration", "Configuration"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`pb-[12px] bg-transparent border-0 cursor-pointer font-['Red_Hat_Text:Regular',sans-serif] text-[14px] -mb-[1px] transition-colors ${activeTab === key ? "border-b-2 border-[#0066cc] dark:border-[#4dabf7] font-semibold text-[#151515] dark:text-white" : "text-[#4d4d4d] dark:text-[#b0b0b0] hover:text-[#151515] dark:hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "details" && (
        <>
          {isUpdateInProgress && (
            <div className="flex items-center gap-[12px] bg-[#e7f1fa] dark:bg-[rgba(0,102,204,0.08)] px-[16px] py-[12px] mb-[16px] rounded-[8px] border border-[#0066cc] dark:border-[#4dabf7]">
              <Loader2 className="size-[18px] text-[#0066cc] dark:text-[#4dabf7] shrink-0 animate-spin" />
              <p className="text-[#151515] dark:text-white text-[14px] font-['Red_Hat_Text:Regular',sans-serif] flex-1">
                <span className="font-medium">An update to {updateVersion} is in progress.</span> View the update status on the Cluster Update page.
              </p>
              <Link to="/administration/cluster-update/in-progress" state={{ version: updateVersion }} className="flex items-center gap-[4px] text-[#0066cc] dark:text-[#4dabf7] text-[13px] no-underline hover:underline whitespace-nowrap font-['Red_Hat_Text:Regular',sans-serif] font-medium">
                Review update progress <ExternalLink className="size-[14px]" />
              </Link>
            </div>
          )}

          <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] rounded-[16px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.06)] p-[24px] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] mb-[24px]">
            <div className="space-y-[20px]">
              <div>
                <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[16px] mb-[8px]">Subscription</h3>
                <a href="https://console.redhat.com/openshift" target="_blank" rel="noopener noreferrer" className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline">OpenShift Cluster Manager</a>
              </div>
              <div>
                <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[16px] mb-[8px]">Service Level Agreement (SLA)</h3>
                <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0]">Self-support, 60 day trial</p>
                <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0]">59 days remaining</p>
                <a href="https://console.redhat.com/openshift/subscriptions" target="_blank" rel="noopener noreferrer" className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline">Manage subscription settings</a>
              </div>
              <div>
                <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[16px] mb-[8px]">Cluster ID</h3>
                <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0] font-mono">b86faa3-b06c-4a82-8fa7-54b80a92d4b2</p>
              </div>
              <div>
                <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[16px] mb-[8px]">Desired release image</h3>
                <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0] font-mono break-all">registry.ci.openshift.org/ocp/release@sha256:6dbbd6b0fa89c1c0223ae79b32fb3ff1a4fc2f3a96b352bf7fd487cd2023cd0c3ae499bfdd6b6c74297bf93f9bc2ea6b8c5b6dfda8e74297bf93</p>
              </div>
              <div>
                <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[16px] mb-[8px]">Upstream configuration</h3>
                <a href="https://docs.openshift.com/container-platform/latest/updating/understanding_updates/understanding-update-channels-releases.html" target="_blank" rel="noopener noreferrer" className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline">https://apenshift-release.apps.ci.ci24.p1.openshiftapps.com/graph</a>
              </div>
              <div>
                <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[16px] mb-[8px]">Cluster autoscaler</h3>
                <a href="https://docs.openshift.com/container-platform/latest/machine_management/applying-autoscaling.html" target="_blank" rel="noopener noreferrer" className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline">Create autoscaler</a>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "cluster-operators" && <ClusterOperatorsTab />}

      {activeTab === "configuration" && <ConfigurationTab />}
      </Breadcrumbs>
    </div>
  );
}
