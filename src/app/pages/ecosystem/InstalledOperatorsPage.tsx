import { useState, useEffect, useCallback, useMemo, type CSSProperties } from "react";
import {
  CheckCircle,
  Info,
  AlertCircle,
  ExternalLink,
  AlertTriangle,
  Clock,
  Columns2,
  Globe,
} from "@/lib/pfIcons";
import { usePatternFlyGlassActive } from "@/lib/usePatternFlyGlassActive";
import { Link, useNavigate } from "react-router";
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Content,
  Dropdown,
  DropdownItem,
  Flex,
  FlexItem,
  Icon,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Pagination,
  PaginationVariant,
  Title,
  Tooltip,
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
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import SlidersHIcon from "@patternfly/react-icons/dist/esm/icons/sliders-h-icon";
import SortCommonAscIcon from "@patternfly/react-icons/dist/esm/icons/pficon-sort-common-asc-icon";
import { InnerScrollContainer, Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { useChat } from "../../contexts/ChatContext";
import { BulkUpdateModal } from "../../components/OperatorUpdateModals";
import { AiAssessmentSection } from "../../components/AiAssessmentSection";
import { OlsChatbot } from "../../components/OlsChatbot";
import { useClusterUpdateDemoVariant } from "../../contexts/ClusterUpdateDemoContext";
import {
  ListAdvancedFilterModal,
  type ListAdvancedAttributeSpec,
} from "../../components/dataView/ListAdvancedFilterModal";
import { IoDataViewFiltersWithMidActions } from "../../components/dataView/IoDataViewFiltersWithMidActions";

const CLUSTER_TARGET_VERSION = "5.1.10";
const CLUSTER_CHANNEL = "fast-5.1";

/** Data columns and optional table chrome (row selection, kebab) via Managed columns. */
type TableColumnKey =
  | "version"
  | "clusterExtension"
  | "clusterCompatibility"
  | "updatePlan"
  | "support"
  | "status"
  | "lastUpdated"
  | "managedNamespaces"
  | "rowSelect"
  | "rowActions";

type DataColumnKey = Exclude<TableColumnKey, "rowSelect" | "rowActions">;

const TABLE_COLUMN_OPTIONS: { key: DataColumnKey; label: string }[] = [
  { key: "version", label: "Version" },
  { key: "clusterExtension", label: "Cluster extension" },
  { key: "clusterCompatibility", label: "Cluster compatibility" },
  { key: "updatePlan", label: "Update plan" },
  { key: "support", label: "Support" },
  { key: "status", label: "Status" },
  { key: "lastUpdated", label: "Last updated" },
  { key: "managedNamespaces", label: "Managed namespaces" },
];

/** “Default columns” in Manage columns (Operator is always on). */
const DEFAULT_MANAGE_COLUMN_ORDER: { key: TableColumnKey; label: string }[] = [
  { key: "version", label: "Version" },
  { key: "status", label: "Status" },
  { key: "clusterExtension", label: "Cluster extension" },
  { key: "clusterCompatibility", label: "Cluster compatibility" },
  { key: "support", label: "Support" },
  { key: "lastUpdated", label: "Last updated" },
  { key: "rowSelect", label: "Row selection" },
];

const ADDITIONAL_MANAGE_COLUMN_ORDER: { key: TableColumnKey; label: string }[] = [
  { key: "updatePlan", label: "Update plan" },
  { key: "managedNamespaces", label: "Managed namespaces" },
  { key: "rowActions", label: "Actions" },
];

const RESTORE_DEFAULT_VISIBLE: Record<TableColumnKey, boolean> = {
  version: true,
  status: true,
  clusterExtension: true,
  clusterCompatibility: true,
  support: true,
  lastUpdated: true,
  updatePlan: false,
  managedNamespaces: false,
  rowSelect: true,
  rowActions: false,
};

const ioManageColRowStyle = (withDivider: boolean): CSSProperties => ({
  paddingBlock: "var(--pf-t--global--spacer--sm)",
  ...(withDivider
    ? { borderBottom: "1px solid var(--pf-t--global--border--color--default)" }
    : {}),
});

/**
 * PatternFly Data View filters (see @patternfly/react-data-view) — `useDataViewFilters` shape.
 * Matches HPUX-1429 / CONSOLE-5091 prototype (attribute menu + chip rows on ToolbarFilter).
 */
type IoListFilters = {
  name: string;
  status: string[];
  updatePlan: string[];
  clusterCompatibility: string[];
  support: string[];
};

const INITIAL_IO_FILTERS: IoListFilters = {
  name: "",
  status: [],
  updatePlan: [],
  clusterCompatibility: [],
  support: [],
};

function getEmptyIoListFilters(): IoListFilters {
  return { ...INITIAL_IO_FILTERS };
}

const FILTER_VALUE_OPTIONS: Record<
  keyof Pick<IoListFilters, "status" | "updatePlan" | "clusterCompatibility" | "support">,
  { value: string; label: string }[]
> = {
  status: [
    { value: "Running", label: "Running" },
    { value: "Degraded", label: "Degraded" },
    { value: "Pending", label: "Pending" },
  ],
  updatePlan: [
    { value: "Automatic", label: "Automatic" },
    { value: "Manual", label: "Manual" },
  ],
  clusterCompatibility: [
    { value: "Compatible", label: "Compatible" },
    { value: "Incompatible", label: "Incompatible" },
  ],
  support: [
    { value: "Full", label: "Full" },
    { value: "Limited", label: "Limited" },
    { value: "Community", label: "Community" },
    { value: "Unsupported", label: "Unsupported" },
  ],
};

/** HPUX-1429 / CONSOLE-5091 list advanced filter — same attributes as the DataView toolbar. */
const IO_LIST_ADV_FILTER_SPEC: ListAdvancedAttributeSpec<keyof IoListFilters>[] = [
  {
    id: "name",
    label: "Name",
    valueKind: "text",
    valuePlaceholder: "Filter by name or namespace",
  },
  {
    id: "status",
    label: "Status",
    valueKind: "multi",
    valuePlaceholder: "Filter by status",
    options: FILTER_VALUE_OPTIONS.status,
  },
  {
    id: "updatePlan",
    label: "Update plan",
    valueKind: "multi",
    valuePlaceholder: "Filter by update plan",
    options: FILTER_VALUE_OPTIONS.updatePlan,
  },
  {
    id: "clusterCompatibility",
    label: "Cluster compatibility",
    valueKind: "multi",
    valuePlaceholder: "Filter by cluster compatibility",
    options: FILTER_VALUE_OPTIONS.clusterCompatibility,
  },
  {
    id: "support",
    label: "Support",
    valueKind: "multi",
    valuePlaceholder: "Filter by support",
    options: FILTER_VALUE_OPTIONS.support,
  },
];

type SortColumnKey =
  | "name"
  | "version"
  | "status"
  | "lastUpdated"
  | "clusterCompatibility"
  | "clusterExtension"
  | "support";

const COMPAT_SORT_ORDER: Record<"Compatible" | "Incompatible", number> = {
  Compatible: 0,
  Incompatible: 1,
};

function parseUpdatedAt(s?: string): number {
  if (!s) return 0;
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}

/**
 * List timestamp cell — same en-US “medium + short” shape as PatternFly Data View examples
 * (see https://www.patternfly.org/extensions/data-view/overview). Falls back to the raw value if it won’t parse.
 */
function formatDataViewListDate(value: string | undefined): string {
  if (!value || value === "—") return "—";
  const t = Date.parse(value);
  if (Number.isNaN(t)) {
    return value;
  }
  return new Date(t).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

type InstalledOperator = {
  name: string;
  namespace: string;
  version: string;
  channel: string;
  source: string;
  status: "Running" | "Degraded" | "Pending";
  autoUpdate: boolean;
  clusterCompatibility: "Compatible" | "Incompatible";
  compatibilityMessage?: string;
  support: "Full" | "Limited" | "Community" | "Unsupported";
  supportEndDate?: string;
  supportBadge?: string;
  supportBadgeType?: "success" | "danger" | "warning";
  updateAvailable?: string;
  maxOcpVersion?: string;
  lastUpdated?: string;
  managedNamespaces?: string[];
};

type CatalogOperator = InstalledOperator & {
  requiredBeforeClusterUpdate?: boolean;
  isOlmV1Extension?: boolean;
};

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function getOperatorCompatibilityPage(
  op: InstalledOperator,
  targetVersion: string
): { compatibility: "Compatible" | "Incompatible"; message?: string } {
  if (op.status === "Pending") {
    return {
      compatibility: "Incompatible",
      message: op.compatibilityMessage || "Operator is pending and not compatible until it is running.",
    };
  }
  if (op.status === "Degraded") {
    return {
      compatibility: "Incompatible",
      message:
        op.compatibilityMessage ||
        "Operator is degraded and not compatible until the operator is healthy.",
    };
  }
  if (!op.maxOcpVersion) return { compatibility: "Compatible" };
  const targetMajorMinor = targetVersion.split(".").slice(0, 2).join(".");
  if (compareVersions(op.maxOcpVersion, targetMajorMinor) < 0) {
    return {
      compatibility: "Incompatible",
      message: `Max supported OCP version is ${op.maxOcpVersion}. ${
        op.updateAvailable
          ? `Update to v${op.updateAvailable}+ before upgrading cluster.`
          : "Update operator before upgrading cluster."
      }`,
    };
  }
  return { compatibility: "Compatible" };
}

type OperatorRow = CatalogOperator & {
  clusterCompatibility: "Compatible" | "Incompatible";
};

/** Parses prototype date strings like "Nov 13, 2025" reliably across environments. */
function parseSupportEndDateMs(supportEndDate?: string): number | undefined {
  if (!supportEndDate || supportEndDate === "—") return undefined;
  const trimmed = supportEndDate.trim();
  let parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) return parsed;
  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime())) return d.getTime();
  // Safari / some locales: "MMM d, yyyy"
  const mdy = trimmed.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/);
  if (mdy) {
    parsed = Date.parse(`${mdy[1]} ${mdy[2]}, ${mdy[3]}`);
    if (!Number.isNaN(parsed)) return parsed;
  }
  // ISO yyyy-mm-dd
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    parsed = Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return parsed;
  }
  return undefined;
}

function normalizeSupportBadgeLabel(supportBadge?: string): string | undefined {
  const s = supportBadge?.replace(/\s+/g, " ").trim();
  return s || undefined;
}

function getSupportDisplayValue(supportEndDate?: string, supportBadge?: string): string {
  const badge = normalizeSupportBadgeLabel(supportBadge);
  if (badge?.toLowerCase() === "end of life") return "End of life";

  const ms = parseSupportEndDateMs(supportEndDate);
  if (ms !== undefined && ms < Date.now()) return "End of life";

  if (!supportEndDate || supportEndDate === "—") {
    if (badge?.toLowerCase() === "unsupported") return "Unsupported";
    if (badge) return badge;
    return "—";
  }
  return supportEndDate;
}

/** Monotonic timestamp for sorting the Support column (earlier = older risk). */
function getSupportSortTimestamp(op: OperatorRow): number {
  const badge = normalizeSupportBadgeLabel(op.supportBadge);
  if (badge?.toLowerCase() === "end of life") {
    const ms = parseSupportEndDateMs(op.supportEndDate);
    return ms !== undefined ? ms : 0;
  }
  const ms = parseSupportEndDateMs(op.supportEndDate);
  if (ms !== undefined) return ms;
  if (!op.supportEndDate || op.supportEndDate === "—") {
    if (badge?.toLowerCase() === "unsupported") return Number.MAX_SAFE_INTEGER - 2;
    if (badge) return Number.MAX_SAFE_INTEGER - 3;
  }
  return Number.MAX_SAFE_INTEGER - 1;
}

function getSupportTooltipText(supportBadge?: string): string | undefined {
  if (!supportBadge) return undefined;
  return supportBadge.replaceAll("Self-support", "Unsupported");
}

function rowMatchesDataViewFilters(op: OperatorRow, f: IoListFilters): boolean {
  if (f.name.trim()) {
    const q = f.name.trim().toLowerCase();
    if (!op.name.toLowerCase().includes(q) && !op.namespace.toLowerCase().includes(q)) return false;
  }
  if (f.status.length > 0 && !f.status.includes(op.status)) return false;
  if (f.updatePlan.length > 0) {
    const autoOk = f.updatePlan.includes("Automatic") && op.autoUpdate;
    const manOk = f.updatePlan.includes("Manual") && !op.autoUpdate;
    if (!autoOk && !manOk) return false;
  }
  if (f.clusterCompatibility.length > 0 && !f.clusterCompatibility.includes(op.clusterCompatibility)) {
    return false;
  }
  if (f.support.length > 0 && !f.support.includes(op.support)) return false;
  return true;
}

function sortOperatorRows(rows: OperatorRow[], key: SortColumnKey, dir: "asc" | "desc"): OperatorRow[] {
  const m = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "name":
        cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        break;
      case "version":
        cmp = compareVersions(a.version, b.version);
        break;
      case "status": {
        const order = { Running: 0, Degraded: 1, Pending: 2 };
        cmp = order[a.status] - order[b.status];
        break;
      }
      case "clusterCompatibility":
        cmp = COMPAT_SORT_ORDER[a.clusterCompatibility] - COMPAT_SORT_ORDER[b.clusterCompatibility];
        break;
      case "clusterExtension": {
        const r = (o: OperatorRow) => (o.isOlmV1Extension ? 1 : 0);
        cmp = r(a) - r(b);
        break;
      }
      case "lastUpdated":
        cmp = parseUpdatedAt(a.lastUpdated) - parseUpdatedAt(b.lastUpdated);
        break;
      case "support":
        cmp = getSupportSortTimestamp(a) - getSupportSortTimestamp(b);
        break;
      default:
        cmp = 0;
    }
    if (cmp !== 0) return cmp * m;
    return a.name.localeCompare(b.name) * m;
  });
}

const INITIAL_CATALOG_OPERATORS: CatalogOperator[] = [
  {
    name: "Cluster Logging",
    namespace: "openshift-logging",
    version: "6.4.3",
    channel: "stable-6.4",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: false,
    clusterCompatibility: "Incompatible",
    compatibilityMessage:
      "Max supported OCP version is 5.0. Update to v6.5+ before upgrading cluster.",
    support: "Full",
    supportEndDate: "2025-11-13",
    supportBadge: "End of life",
    supportBadgeType: "danger",
    updateAvailable: "6.5.1",
    maxOcpVersion: "5.0",
    lastUpdated: "Jan 8, 2026, 3:12 PM",
    managedNamespaces: ["openshift-logging"],
    requiredBeforeClusterUpdate: true,
  },
  {
    name: "Elasticsearch Operator",
    namespace: "openshift-operators-redhat",
    version: "5.7.2",
    channel: "stable-5.7",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: false,
    clusterCompatibility: "Compatible",
    support: "Full",
    supportEndDate: "May 10, 2028",
    supportBadge: "2 years, 1 month",
    supportBadgeType: "success",
    maxOcpVersion: "5.1",
    lastUpdated: "Feb 12, 2026, 4:32 AM",
    managedNamespaces: ["openshift-operators-redhat", "openshift-logging"],
    requiredBeforeClusterUpdate: true,
  },
  {
    name: "Cloud Credential Operator",
    namespace: "openshift-cloud-credential-operator",
    version: "5.0.0",
    channel: "stable",
    source: "Built-in",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    compatibilityMessage: "IAM configuration may need updating before cluster upgrade.",
    support: "Full",
    supportEndDate: "Jun 15, 2028",
    supportBadge: "2 years, 2 months",
    supportBadgeType: "success",
    maxOcpVersion: "5.2",
    lastUpdated: "Mar 1, 2026, 3:48 AM",
    managedNamespaces: ["openshift-cloud-credential-operator"],
  },
  {
    name: "Operator Lifecycle Manager",
    namespace: "openshift-operator-lifecycle-manager",
    version: "4.21.0",
    channel: "stable",
    source: "Built-in",
    status: "Running",
    autoUpdate: false,
    clusterCompatibility: "Incompatible",
    compatibilityMessage: "Incompatible with OCP 5.1. Update to 4.22.0 or higher.",
    support: "Full",
    supportEndDate: "Mar 20, 2027",
    supportBadge: "11 months",
    supportBadgeType: "warning",
    updateAvailable: "4.22.0",
    maxOcpVersion: "5.0",
    lastUpdated: "Mar 1, 2026, 3:48 AM",
    managedNamespaces: ["openshift-operator-lifecycle-manager", "openshift-marketplace"],
  },
  {
    name: "Cert Manager",
    namespace: "cert-manager-operator",
    version: "1.14.0",
    channel: "stable-v1",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    support: "Full",
    supportEndDate: "Sep 1, 2027",
    supportBadge: "1 year, 5 months",
    supportBadgeType: "success",
    maxOcpVersion: "5.2",
    lastUpdated: "Mar 18, 2026, 2:05 AM",
    managedNamespaces: ["cert-manager", "cert-manager-operator"],
  },
  {
    name: "OpenShift DNS",
    namespace: "openshift-dns-operator",
    version: "5.0.0",
    channel: "stable",
    source: "Built-in",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    support: "Full",
    supportEndDate: "Jun 15, 2028",
    supportBadge: "2 years, 2 months",
    supportBadgeType: "success",
    maxOcpVersion: "5.2",
    lastUpdated: "Mar 1, 2026, 3:48 AM",
    managedNamespaces: ["openshift-dns", "openshift-dns-operator"],
  },
  {
    name: "Ingress Operator",
    namespace: "openshift-ingress-operator",
    version: "5.0.0",
    channel: "stable",
    source: "Built-in",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    support: "Full",
    supportEndDate: "Jun 15, 2028",
    supportBadge: "2 years, 2 months",
    supportBadgeType: "success",
    maxOcpVersion: "5.2",
    lastUpdated: "Mar 1, 2026, 3:48 AM",
    managedNamespaces: ["openshift-ingress", "openshift-ingress-operator"],
  },
  {
    name: "Machine Config Operator",
    namespace: "openshift-machine-config-operator",
    version: "5.0.0",
    channel: "stable",
    source: "Built-in",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    support: "Full",
    supportEndDate: "Jun 15, 2028",
    supportBadge: "2 years, 2 months",
    supportBadgeType: "success",
    maxOcpVersion: "5.2",
    lastUpdated: "Mar 1, 2026, 3:48 AM",
    managedNamespaces: ["openshift-machine-config-operator"],
  },
  {
    name: "Monitoring Stack",
    namespace: "openshift-monitoring",
    version: "5.0.0",
    channel: "stable",
    source: "Built-in",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    support: "Full",
    supportEndDate: "Jun 15, 2028",
    supportBadge: "2 years, 2 months",
    supportBadgeType: "success",
    maxOcpVersion: "5.2",
    lastUpdated: "Mar 1, 2026, 3:48 AM",
    managedNamespaces: ["openshift-monitoring", "openshift-user-workload-monitoring"],
  },
  {
    name: "Service Mesh",
    namespace: "openshift-operators",
    version: "2.5.1",
    channel: "stable",
    source: "redhat-operators",
    status: "Degraded",
    autoUpdate: false,
    clusterCompatibility: "Incompatible",
    compatibilityMessage:
      "Operator is degraded. Compatibility cannot be determined until the operator is healthy.",
    support: "Limited",
    supportEndDate: "Dec 1, 2026",
    supportBadge: "8 months",
    supportBadgeType: "warning",
    updateAvailable: "2.6.0",
    lastUpdated: "Nov 5, 2025, 10:22 AM",
    managedNamespaces: ["istio-system", "openshift-operators"],
  },
  {
    name: "Web Terminal",
    namespace: "openshift-operators",
    version: "1.9.0",
    channel: "fast",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    support: "Community",
    supportEndDate: "Apr 30, 2028",
    supportBadge: "2 years",
    supportBadgeType: "success",
    maxOcpVersion: "5.2",
    lastUpdated: "Mar 22, 2026, 6:00 AM",
    managedNamespaces: ["openshift-terminal"],
  },
  {
    name: "Kiali Operator",
    namespace: "openshift-operators",
    version: "1.73.0",
    channel: "stable",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: false,
    clusterCompatibility: "Compatible",
    support: "Full",
    supportEndDate: "Jan 15, 2028",
    supportBadge: "1 year, 9 months",
    supportBadgeType: "success",
    updateAvailable: "1.76.0",
    maxOcpVersion: "5.1",
    lastUpdated: "Dec 20, 2025, 9:15 AM",
    managedNamespaces: ["kiali-operator", "istio-system"],
  },
  {
    name: "OpenShift GitOps (cluster extension)",
    namespace: "openshift-gitops-operator",
    version: "1.12.0",
    channel: "gitops-1.12",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    support: "Full",
    supportEndDate: "May 10, 2028",
    supportBadge: "Full support",
    supportBadgeType: "success",
    maxOcpVersion: "5.2",
    lastUpdated: "Jun 12, 2025, 4:02 PM",
    managedNamespaces: ["openshift-gitops"],
    isOlmV1Extension: true,
  },
  {
    name: "Sample observability bundle",
    namespace: "observability-bundles",
    version: "0.4.1",
    channel: "stable",
    source: "community-operators",
    status: "Pending",
    autoUpdate: true,
    clusterCompatibility: "Incompatible",
    compatibilityMessage: "V1 discovery in progress — update availability TBD",
    support: "Community",
    supportEndDate: "—",
    supportBadge: "Unsupported",
    supportBadgeType: "danger",
    lastUpdated: "Jun 11, 2025, 9:15 AM",
    managedNamespaces: ["observability-sample"],
    isOlmV1Extension: true,
  },
];

export default function InstalledOperatorsPage() {
  const [operators, setOperators] = useState<CatalogOperator[]>(() => [...INITIAL_CATALOG_OPERATORS]);
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
  const [openKebabIndex, setOpenKebabIndex] = useState<number | null>(null);
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<IoListFilters>({
    initialFilters: INITIAL_IO_FILTERS,
  });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<SortColumnKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatbotContext, setChatbotContext] = useState("");
  const [olsMountKey, setOlsMountKey] = useState(0);
  const [isManageColumnsModalOpen, setIsManageColumnsModalOpen] = useState(false);
  const [isAdvancedFilterModalOpen, setIsAdvancedFilterModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<TableColumnKey, boolean>>(
    () => ({ ...RESTORE_DEFAULT_VISIBLE })
  );
  const [columnModalDraft, setColumnModalDraft] = useState<Record<TableColumnKey, boolean>>(
    () => ({ ...RESTORE_DEFAULT_VISIBLE })
  );
  const navigate = useNavigate();
  const { demoVariant } = useClusterUpdateDemoVariant();
  const { setCurrentPage } = useChat();
  const isGlass = usePatternFlyGlassActive();
  const showAssessmentAndOverviewCards = demoVariant === "manual-and-agent";

  const openChatbot = useCallback((context: string) => {
    setChatbotContext(context);
    setOlsMountKey((k) => k + 1);
    setChatbotOpen(true);
  }, []);

  const handleChatAction = useCallback(
    (actionId: string) => {
      if (actionId === "view-plan" || actionId === "view-history") {
        navigate("/administration/cluster-update");
      }
    },
    [navigate]
  );

  useEffect(() => {
    setCurrentPage("/ecosystem/installed-operators");
  }, [setCurrentPage]);

  const visibleDataColumnCount = useMemo(
    () => TABLE_COLUMN_OPTIONS.filter(({ key }) => visibleColumns[key]).length,
    [visibleColumns]
  );

  const tableColSpan =
    (visibleColumns.rowSelect ? 1 : 0) + 1 + visibleDataColumnCount + (visibleColumns.rowActions ? 1 : 0);

  const operatorsWithCompat = useMemo(() => {
    return operators.map((op) => {
      const { compatibility, message } = getOperatorCompatibilityPage(op, CLUSTER_TARGET_VERSION);
      return {
        ...op,
        clusterCompatibility: compatibility,
        compatibilityMessage: message || op.compatibilityMessage,
      };
    });
  }, [operators]);

  const searchAndAttributeFiltered = useMemo(
    () => operatorsWithCompat.filter((op) => rowMatchesDataViewFilters(op, filters)),
    [operatorsWithCompat, filters]
  );

  const sortedFilteredOperators = useMemo(
    () => sortOperatorRows(searchAndAttributeFiltered, sortColumn, sortDirection),
    [searchAndAttributeFiltered, sortColumn, sortDirection]
  );

  const pagedOperators = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedFilteredOperators.slice(start, start + perPage);
  }, [sortedFilteredOperators, page, perPage]);

  useEffect(() => {
    setPage(1);
  }, [filters, perPage]);

  const toggleSort = useCallback((col: SortColumnKey) => {
    if (col !== sortColumn) {
      setSortColumn(col);
      setSortDirection("asc");
    } else {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    }
  }, [sortColumn]);

  const renderSortableHeader = useCallback(
    (label: string, col: SortColumnKey) => {
      const active = sortColumn === col;
      const isDesc = active && sortDirection === "desc";
      return (
        <Button
          className="ocs-operator-table-sort"
          variant="plain"
          onClick={() => toggleSort(col)}
          isInline
          iconPosition="end"
          icon={
            <SortCommonAscIcon
              className={[
                "ocs-operator-table-sort-glyph",
                active ? "ocs-operator-table-sort-icon--active" : "ocs-operator-table-sort-icon--idle",
              ]
                .filter(Boolean)
                .join(" ")}
              style={isDesc ? { transform: "rotate(180deg)" } : undefined}
              aria-hidden
            />
          }
        >
          {label}
        </Button>
      );
    },
    [sortColumn, sortDirection, toggleSort]
  );

  /** Non-sortable headers: same <Button plain isInline> shell as sortable columns for consistent type size. */
  const renderPlainHeader = useCallback((label: string) => {
    return (
      <Button
        className="ocs-operator-table-sort ocs-operator-table-header-static"
        component="div"
        variant="plain"
        isInline
        tabIndex={-1}
      >
        {label}
      </Button>
    );
  }, []);

  const operatorsForBulkModal = useMemo(
    () =>
      operatorsWithCompat.map((op) => ({
        name: op.name,
        version: op.version,
        newVersion: op.updateAvailable ?? null,
        status: op.status,
        statusType: op.status === "Running" ? "success" : op.status === "Degraded" ? "warning" : "neutral",
        updatePlan: op.autoUpdate ? "Automatic" : "Manual",
        clusterCompatibility: op.clusterCompatibility,
        support: op.supportEndDate ?? "—",
        supportBadge: op.supportBadge ?? "",
        supportType:
          op.supportBadgeType === "danger"
            ? "danger"
            : op.supportBadgeType === "warning"
              ? "warning"
              : "success",
        lastUpdated: op.lastUpdated ?? "—",
        required: op.requiredBeforeClusterUpdate,
      })),
    [operatorsWithCompat]
  );

  const installedAiSummary = useMemo(
    () => ({
      totalOperators: operators.length,
      updatesAvailable: operators.filter((o) => o.updateAvailable).length,
      clusterTargetVersion: CLUSTER_TARGET_VERSION,
      channelLabel: CLUSTER_CHANNEL,
    }),
    [operators]
  );

  const applyBulkUpdates = useCallback((updatedNames: string[]) => {
    const now = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
    setOperators((prev) =>
      prev.map((op) => {
        if (!updatedNames.includes(op.name) || !op.updateAvailable) return op;
        const nv = op.updateAvailable;
        return {
          ...op,
          version: nv,
          updateAvailable: undefined,
          maxOcpVersion: "5.2",
          clusterCompatibility: "Compatible" as const,
          compatibilityMessage: undefined,
          status: op.status === "Pending" ? ("Running" as const) : op.status,
          lastUpdated: now,
        };
      })
    );
    setSelectedOperators([]);
  }, []);

  const navigateToUpdate = (op: OperatorRow) => {
    navigate(`/ecosystem/installed-operators/${encodeURIComponent(op.name)}/update`, {
      state: { returnTo: "/ecosystem/installed-operators", operatorName: op.name, operatorData: op },
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOperators(sortedFilteredOperators.map((op) => op.name));
    } else {
      setSelectedOperators([]);
    }
  };

  const handleSelectOperator = (name: string) => {
    if (selectedOperators.includes(name)) {
      setSelectedOperators(selectedOperators.filter((n) => n !== name));
    } else {
      setSelectedOperators([...selectedOperators, name]);
    }
  };

  return (
    <div className="flex h-full relative min-w-0">
      <OlsChatbot
        key={olsMountKey}
        isOpen={chatbotOpen}
        context={chatbotContext}
        selectedVersion={CLUSTER_TARGET_VERSION}
        selectedChannel={CLUSTER_CHANNEL}
        onClose={() => setChatbotOpen(false)}
        onAction={handleChatAction}
      >
      <div className="ocs-app-page-outer flex-1 min-h-0 min-w-0 overflow-y-auto">
            <Breadcrumbs
              items={[
                { label: "Home", path: "/" },
                { label: "Ecosystem", path: "/ecosystem" },
                { label: "Installed Operators" },
              ]}
            >
            <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>

            <Content>
              <Flex
                alignItems={{ default: "alignItemsCenter" }}
                justifyContent={{ default: "justifyContentSpaceBetween" }}
              >
                <h1 id="main-title">Installed Operators</h1>
                <FavoriteButton name="Installed Operators" path="/ecosystem/installed-operators" />
              </Flex>
              <p>
                Manage catalog operators installed on this cluster. The list uses the PatternFly <strong>DataView</strong>{" "}
                package (<code>@patternfly/react-data-view</code>) — attribute filter menu,{" "}
                <strong>ToolbarFilter</strong> value chips, top pagination, and a compact table with sortable
                headers — following the HPUX-1429 / CONSOLE-5091 list–filter prototype. Select <strong>two or more</strong>{" "}
                operators with catalog updates to run a bulk approval from <strong>Approve update</strong>.
              </p>
            </Content>

            {showAssessmentAndOverviewCards && (
              <>
                <AiAssessmentSection
                  variant="installed-operators"
                  installedSummary={installedAiSummary}
                  openChatbot={openChatbot}
                  selectedVersion={CLUSTER_TARGET_VERSION}
                />

                <Flex flexWrap={{ default: "flexWrapWrap" }} gap={{ default: "gapLg" }}>
                  <FlexItem flex={{ default: "flex_1" }} grow={{ default: "grow" }} shrink={{ default: "shrink" }}>
                    <Card isGlass={isGlass} isFullHeight>
                      <CardBody>
                        <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }}>
                            <Icon size="lg" status="success">
                              <CheckCircle />
                            </Icon>
                            <Content component="small">Total installed</Content>
                          </Flex>
                          <Title headingLevel="h3" size="4xl">
                            {operators.length}
                          </Title>
                        </Flex>
                      </CardBody>
                    </Card>
                  </FlexItem>
                  <FlexItem flex={{ default: "flex_1" }} grow={{ default: "grow" }} shrink={{ default: "shrink" }}>
                    <Card isGlass={isGlass} isFullHeight>
                      <CardBody>
                        <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }}>
                            <Icon size="lg" status="info">
                              <Info />
                            </Icon>
                            <Content component="small">Available Updates</Content>
                          </Flex>
                          <Title headingLevel="h3" size="4xl">
                            {operators.filter((o) => o.updateAvailable).length}
                          </Title>
                        </Flex>
                      </CardBody>
                    </Card>
                  </FlexItem>
                  <FlexItem flex={{ default: "flex_1" }} grow={{ default: "grow" }} shrink={{ default: "shrink" }}>
                    <Card isGlass={isGlass} isFullHeight>
                      <CardBody>
                        <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }}>
                            <Icon size="lg" status="warning">
                              <AlertCircle />
                            </Icon>
                            <Content component="small">End of Life Support</Content>
                          </Flex>
                          <Title headingLevel="h3" size="4xl">
                            {
                              operators.filter(
                                (o) => getSupportDisplayValue(o.supportEndDate, o.supportBadge) === "End of life"
                              ).length
                            }
                          </Title>
                        </Flex>
                      </CardBody>
                    </Card>
                  </FlexItem>
                </Flex>
              </>
            )}

            <DataView
              ouiaId="installed-operators-data-view"
              className="ocs-io-dataview"
              style={
                showAssessmentAndOverviewCards
                  ? undefined
                  : { marginBlockStart: "var(--pf-t--global--spacer--lg)" }
              }
            >
              <DataViewToolbar
                ouiaId="installed-operators-dv-toolbar"
                id="installed-operators-dv-toolbar"
                className="ocs-io-dataview-toolbar pf-m-toggle-group-container ocs-io-dv-toolbar-align"
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<IoListFilters>
                    values={filters}
                    onChange={(_filterId, partial) => onSetFilters(partial as Partial<IoListFilters>)}
                    breakpoint="xl"
                    midContent={
                      <ToolbarGroup
                        className="ocs-io-filters-mid-actions"
                        gap={{ default: "gapMd" }}
                        variant="action-group"
                        alignItems="center"
                      >
                        <ToolbarItem>
                          <Button
                            variant="plain"
                            title="Advanced filter"
                            aria-label="Advanced filter"
                            onClick={() => {
                              setIsAdvancedFilterModalOpen(true);
                            }}
                            icon={<SlidersHIcon aria-hidden />}
                          />
                        </ToolbarItem>
                        <ToolbarItem>
                          <Button
                            variant="plain"
                            title="Manage columns"
                            aria-label="Manage columns"
                            onClick={() => {
                              setColumnModalDraft({ ...visibleColumns });
                              setIsManageColumnsModalOpen(true);
                            }}
                            icon={<Columns2 aria-hidden />}
                          />
                        </ToolbarItem>
                        <ToolbarItem>
                          <Button
                            variant="primary"
                            onClick={() => setIsBulkUpdateModalOpen(true)}
                            isDisabled={selectedOperators.length < 2}
                            title={
                              selectedOperators.length < 2
                                ? "Select at least two operators to run a bulk approval"
                                : "Review and approve updates for the selected operators"
                            }
                          >
                            Approve update
                          </Button>
                        </ToolbarItem>
                        <ToolbarItem>
                          <Button
                            variant="link"
                            component={Link}
                            to="/ecosystem/software-catalog"
                            icon={<ExternalLink />}
                            iconPosition="right"
                          >
                            Browse Software Catalog
                          </Button>
                        </ToolbarItem>
                      </ToolbarGroup>
                    }
                  >
                    <DataViewTextFilter
                      title="Name"
                      filterId="name"
                      placeholder="Filter by name or namespace"
                      style={{ minWidth: "16rem", maxWidth: "100%" }}
                    />
                    <DataViewCheckboxFilter
                      title="Status"
                      filterId="status"
                      options={FILTER_VALUE_OPTIONS.status}
                    />
                    <DataViewCheckboxFilter
                      title="Update plan"
                      filterId="updatePlan"
                      options={FILTER_VALUE_OPTIONS.updatePlan}
                    />
                    <DataViewCheckboxFilter
                      title="Cluster compatibility"
                      filterId="clusterCompatibility"
                      options={FILTER_VALUE_OPTIONS.clusterCompatibility}
                    />
                    <DataViewCheckboxFilter
                      title="Support"
                      filterId="support"
                      options={FILTER_VALUE_OPTIONS.support}
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
                    itemCount={sortedFilteredOperators.length}
                    page={page}
                    perPage={perPage}
                    onSetPage={(_e, p) => setPage(p)}
                    onPerPageSelect={(_e, pp) => {
                      setPerPage(pp);
                      setPage(1);
                    }}
                    variant={PaginationVariant.top}
                    isCompact
                    ouiaId="installed-operators-pagination"
                    widgetId="installed-operators-pagination"
                    titles={{ items: "operators" }}
                    paginationAriaLabel="Installed operators pagination (top)"
                  />
                }
              />

            <PageSection aria-label="Installed operators table" padding={{ default: "noPadding" }}>
            <InnerScrollContainer>
                <Table
                  aria-label="Installed operators"
                  borders
                  variant="compact"
                  className="ocs-io-operator-table"
                >
                  <Thead>
                    <Tr>
                      {visibleColumns.rowSelect && (
                        <Th modifier="fitContent" aria-label="Select all operators in view">
                          <input
                            type="checkbox"
                            checked={
                              sortedFilteredOperators.length > 0 &&
                              sortedFilteredOperators.every((op) => selectedOperators.includes(op.name))
                            }
                            onChange={handleSelectAll}
                            title="Select all results matching current filters and search"
                          />
                        </Th>
                      )}
                      <Th dataLabel="Operator">
                        {renderSortableHeader("Operator", "name")}
                      </Th>
                      {visibleColumns.status && (
                        <Th dataLabel="Status">{renderSortableHeader("Status", "status")}</Th>
                      )}
                      {visibleColumns.version && (
                        <Th dataLabel="Version">{renderSortableHeader("Version", "version")}</Th>
                      )}
                      {visibleColumns.clusterExtension && (
                        <Th dataLabel="Cluster extension" className="ocs-io-col-cluster-ext">
                          {renderSortableHeader("Cluster extension", "clusterExtension")}
                        </Th>
                      )}
                      {visibleColumns.clusterCompatibility && (
                        <Th dataLabel="Cluster compatibility">
                          {renderSortableHeader("Cluster compatibility", "clusterCompatibility")}
                        </Th>
                      )}
                      {visibleColumns.support && (
                        <Th dataLabel="Support">{renderSortableHeader("Support", "support")}</Th>
                      )}
                      {visibleColumns.lastUpdated && (
                        <Th dataLabel="Last updated">{renderSortableHeader("Last updated", "lastUpdated")}</Th>
                      )}
                      {visibleColumns.updatePlan && (
                        <Th dataLabel="Update plan">{renderPlainHeader("Update plan")}</Th>
                      )}
                      {visibleColumns.managedNamespaces && (
                        <Th dataLabel="Managed namespaces">{renderPlainHeader("Managed namespaces")}</Th>
                      )}
                      {visibleColumns.rowActions && (
                        <Th modifier="fitContent" dataLabel="Actions">
                          {renderPlainHeader("Actions")}
                        </Th>
                      )}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {sortedFilteredOperators.length === 0 ? (
                      <Tr>
                        <Td colSpan={tableColSpan} dataLabel="Empty state">
                          No operators match your search or filters.
                        </Td>
                      </Tr>
                    ) : (
                      pagedOperators.map((op, i) => (
                        <Tr key={op.name} isRowSelected={selectedOperators.includes(op.name)}>
                          {visibleColumns.rowSelect && (
                            <Td modifier="fitContent" dataLabel="Select row">
                              <input
                                type="checkbox"
                                checked={selectedOperators.includes(op.name)}
                                onChange={() => handleSelectOperator(op.name)}
                                aria-label={`Select ${op.name}`}
                              />
                            </Td>
                          )}
                          <Td dataLabel="Operator">
                            <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                              <Button
                                variant="link"
                                isInline
                                component={Link}
                                to={`/ecosystem/installed-operators/${encodeURIComponent(op.name)}`}
                              >
                                {op.name}
                              </Button>
                              <Content component="small">
                                <code>{op.namespace}</code>
                              </Content>
                            </Flex>
                          </Td>
                          {visibleColumns.status && (
                            <Td dataLabel="Status">
                              {op.status === "Running" ? (
                                <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                                  <Icon status="success">
                                    <CheckCircle />
                                  </Icon>
                                  Running
                                </Flex>
                              ) : op.status === "Degraded" ? (
                                <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                                  <Icon status="danger">
                                    <AlertCircle />
                                  </Icon>
                                  Degraded
                                </Flex>
                              ) : (
                                <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                                  <Icon status="warning">
                                    <Clock />
                                  </Icon>
                                  Pending
                                </Flex>
                              )}
                            </Td>
                          )}
                          {visibleColumns.version && (
                            <Td dataLabel="Version">
                              <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                                <Content component="small">
                                  <code>{op.version}</code>
                                </Content>
                                {op.updateAvailable ? (
                                  <Content component="small">
                                    <Button
                                      variant="link"
                                      isInline
                                      component={Link}
                                      to={`/ecosystem/installed-operators/${encodeURIComponent(op.name)}/update`}
                                      state={{
                                        returnTo: "/ecosystem/installed-operators",
                                        operatorName: op.name,
                                        operatorData: op,
                                      }}
                                    >
                                      Update available: {op.updateAvailable}
                                    </Button>
                                  </Content>
                                ) : null}
                              </Flex>
                            </Td>
                          )}
                          {visibleColumns.clusterExtension && (
                            <Td dataLabel="Cluster extension" className="ocs-io-col-cluster-ext">
                              <Content component="small">
                                {op.isOlmV1Extension ? "OLM v1 managed" : "OLM v0 managed"}
                              </Content>
                            </Td>
                          )}
                          {visibleColumns.clusterCompatibility && (
                            <Td dataLabel="Cluster compatibility">
                              {op.clusterCompatibility === "Compatible" ? (
                                <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                                  <Icon status="success">
                                    <CheckCircle />
                                  </Icon>
                                  Compatible
                                </Flex>
                              ) : (
                                <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                                  <Icon status="danger">
                                    <AlertCircle />
                                  </Icon>
                                  Incompatible
                                </Flex>
                              )}
                            </Td>
                          )}
                          {visibleColumns.support && (
                            <Td dataLabel="Support">
                              <Flex
                                alignItems={{ default: "alignItemsCenter" }}
                                gap={{ default: "gapSm" }}
                                flexWrap={{ default: "nowrap" }}
                              >
                                {op.supportBadge ? (
                                  <Tooltip
                                    content={getSupportTooltipText(op.supportBadge)}
                                    position="top"
                                    trigger="mouseenter focus click"
                                    aria="describedby"
                                  >
                                    <span
                                      className="ocs-operator-support-brief"
                                      tabIndex={0}
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        lineHeight: 0,
                                        cursor: "help",
                                      }}
                                    >
                                      {op.supportBadgeType === "danger" ? (
                                        <Icon status="danger">
                                          <AlertCircle />
                                        </Icon>
                                      ) : op.supportBadgeType === "warning" ? (
                                        <Icon status="warning">
                                          <AlertTriangle />
                                        </Icon>
                                      ) : (
                                        <Icon status="success">
                                          <CheckCircle />
                                        </Icon>
                                      )}
                                    </span>
                                  </Tooltip>
                                ) : null}
                                <Content component="span">
                                  {getSupportDisplayValue(op.supportEndDate, op.supportBadge)}
                                </Content>
                              </Flex>
                            </Td>
                          )}
                          {visibleColumns.lastUpdated && (
                            <Td dataLabel="Last updated" modifier="nowrap">
                              {op.lastUpdated && op.lastUpdated !== "—" ? (
                                <Flex
                                  spaceItems={{ default: "spaceItemsSm" }}
                                  alignItems={{ default: "alignItemsCenter" }}
                                  flexWrap={{ default: "nowrap" }}
                                >
                                  <Globe
                                    aria-hidden
                                    style={{
                                      color: "var(--pf-t--global--icon--color--on-disabled, #6a6e73)",
                                      width: "1.125em",
                                      height: "1.125em",
                                      flexShrink: 0,
                                    }}
                                  />
                                  <span>{formatDataViewListDate(op.lastUpdated)}</span>
                                </Flex>
                              ) : (
                                "—"
                              )}
                            </Td>
                          )}
                          {visibleColumns.updatePlan && (
                            <Td dataLabel="Update plan">{op.autoUpdate ? "Automatic" : "Manual"}</Td>
                          )}
                          {visibleColumns.managedNamespaces && (
                            <Td dataLabel="Managed namespaces">
                              <Flex gap={{ default: "gapXs" }} flexWrap={{ default: "flexWrapWrap" }}>
                                {(op.managedNamespaces || []).map((ns, idx) => (
                                  <Label key={idx} isCompact variant="outline" color="grey">
                                    {ns}
                                  </Label>
                                ))}
                              </Flex>
                            </Td>
                          )}
                          {visibleColumns.rowActions && (
                            <Td dataLabel="Actions" isActionCell hasAction>
                              <Dropdown
                                isOpen={openKebabIndex === i}
                                onOpenChange={(open) => setOpenKebabIndex(open ? i : null)}
                                popperProps={{ position: "right-end" }}
                                toggle={(toggleRef) => (
                                  <MenuToggle
                                    ref={toggleRef}
                                    variant="plain"
                                    aria-label={`Actions for ${op.name}`}
                                    icon={<EllipsisVIcon />}
                                    onClick={() =>
                                      setOpenKebabIndex(openKebabIndex === i ? null : i)
                                    }
                                    isExpanded={openKebabIndex === i}
                                  />
                                )}
                                onSelect={() => setOpenKebabIndex(null)}
                              >
                                <DropdownItem
                                  itemId="view"
                                  onClick={() =>
                                    navigate(
                                      `/ecosystem/installed-operators/${encodeURIComponent(op.name)}`
                                    )
                                  }
                                >
                                  View details
                                </DropdownItem>
                                {typeof op.updateAvailable === "string" && op.updateAvailable.length > 0 ? (
                                  <DropdownItem itemId="update" onClick={() => navigateToUpdate(op)}>
                                    Update
                                  </DropdownItem>
                                ) : null}
                                <DropdownItem
                                  itemId="subscription"
                                  onClick={() =>
                                    navigate(
                                      `/ecosystem/installed-operators/${encodeURIComponent(op.name)}/subscription`
                                    )
                                  }
                                >
                                  Edit subscription
                                </DropdownItem>
                              </Dropdown>
                            </Td>
                          )}
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </InnerScrollContainer>
            </PageSection>
            </DataView>
          </Flex>
            </Breadcrumbs>
      </div>
      </OlsChatbot>

      <Modal
        variant="large"
        isOpen={isManageColumnsModalOpen}
        onClose={() => setIsManageColumnsModalOpen(false)}
        aria-labelledby="io-manage-cols-title"
        aria-describedby="io-manage-cols-body"
      >
        <ModalHeader
          labelId="io-manage-cols-title"
          descriptorId="io-manage-cols-body"
          title="Manage columns"
          description="Default columns are shown by default. Additional columns include update plan, managed namespaces, and optional row selection and row actions. Operator is always shown."
        />
        <ModalBody id="io-manage-cols-body">
          <Flex
            direction={{ default: "column", md: "row" }}
            gap={{ default: "gap2xl" }}
            alignItems={{ default: "alignItemsStretch" }}
            style={{ maxWidth: "100%" }}
          >
            <FlexItem grow={{ default: "grow" }} style={{ minWidth: 0, flex: 1 }}>
              <Title headingLevel="h3" size="md" className="pf-v6-u-mb-md">
                Default columns
              </Title>
              <div style={ioManageColRowStyle(true)}>
                <Checkbox
                  id="io-col-operator-mandatory"
                  label="Operator"
                  isChecked
                  isDisabled
                  onChange={() => {}}
                />
              </div>
              {DEFAULT_MANAGE_COLUMN_ORDER.map((col, i) => {
                const isLast = i === DEFAULT_MANAGE_COLUMN_ORDER.length - 1;
                return (
                  <div key={col.key} style={ioManageColRowStyle(!isLast)}>
                    <Checkbox
                      id={`io-col-draft-${col.key}`}
                      label={col.label}
                      isChecked={columnModalDraft[col.key]}
                      onChange={(_e, c) =>
                        setColumnModalDraft((d) => ({ ...d, [col.key]: c }))
                      }
                    />
                  </div>
                );
              })}
            </FlexItem>
            <FlexItem grow={{ default: "grow" }} style={{ minWidth: 0, flex: 1 }}>
              <Title headingLevel="h3" size="md" className="pf-v6-u-mb-md">
                Additional columns
              </Title>
              {ADDITIONAL_MANAGE_COLUMN_ORDER.map((col, i) => {
                const isLast = i === ADDITIONAL_MANAGE_COLUMN_ORDER.length - 1;
                return (
                  <div key={col.key} style={ioManageColRowStyle(!isLast)}>
                    <Checkbox
                      id={`io-col-draft-${col.key}`}
                      label={col.label}
                      isChecked={columnModalDraft[col.key]}
                      onChange={(_e, c) =>
                        setColumnModalDraft((d) => ({ ...d, [col.key]: c }))
                      }
                    />
                  </div>
                );
              })}
            </FlexItem>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Flex
            flexWrap={{ default: "flexWrapWrap" }}
            alignItems={{ default: "alignItemsCenter" }}
            gap={{ default: "gapMd" }}
            justifyContent={{ default: "justifyContentFlexStart" }}
          >
            <Button
              variant="primary"
              onClick={() => {
                setVisibleColumns({ ...columnModalDraft });
                setIsManageColumnsModalOpen(false);
              }}
            >
              Save
            </Button>
            <Button variant="link" onClick={() => setIsManageColumnsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="link"
              onClick={() => setColumnModalDraft({ ...RESTORE_DEFAULT_VISIBLE })}
            >
              Restore default columns
            </Button>
          </Flex>
        </ModalFooter>
      </Modal>

      <ListAdvancedFilterModal<keyof IoListFilters>
        isOpen={isAdvancedFilterModalOpen}
        onClose={() => setIsAdvancedFilterModalOpen(false)}
        source={filters}
        onSave={(next) => onSetFilters(next as IoListFilters)}
        getEmpty={getEmptyIoListFilters}
        spec={IO_LIST_ADV_FILTER_SPEC}
        defaultAttributeWhenNoRows="status"
        idPrefix="io-list-adv"
      />

      <BulkUpdateModal
        isOpen={isBulkUpdateModalOpen}
        onClose={() => setIsBulkUpdateModalOpen(false)}
        selectedOperators={selectedOperators}
        operators={operatorsForBulkModal}
        onBulkComplete={applyBulkUpdates}
      />
    </div>
  );
}
