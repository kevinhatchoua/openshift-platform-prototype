import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AlertSeverity = "critical" | "warning" | "info" | "recommendation";

export type ConsoleAlert = {
  id: string;
  name: string;
  severity: AlertSeverity;
  total: number;
  state: "Firing" | "Pending" | "Silenced";
  source: "Platform" | "User";
  description: string;
  time: string;
  configPath?: string;
  isRead: boolean;
  isAcknowledged: boolean;
};

export type DrawerSeverityFilter = AlertSeverity;

type NotificationAlertsContextValue = {
  alerts: ConsoleAlert[];
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  search: string;
  setSearch: (v: string) => void;
  unreadOnly: boolean;
  setUnreadOnly: (v: boolean) => void;
  severityFilters: Set<DrawerSeverityFilter>;
  toggleSeverityFilter: (s: DrawerSeverityFilter) => void;
  alertStateFilter: "Firing" | "all";
  sourceFilter: "Platform" | "all";
  setAlertStateFilter: (v: "Firing" | "all") => void;
  setSourceFilter: (v: "Platform" | "all") => void;
  markRead: (ids: string[], read?: boolean) => void;
  acknowledge: (ids: string[]) => void;
  dismiss: (id: string) => void;
  observeAlertsHref: string;
  filteredDrawerAlerts: ConsoleAlert[];
};

const SEED_ALERTS: ConsoleAlert[] = [
  {
    id: "cannot-retrieve-updates",
    name: "CannotRetrieveUpdates",
    severity: "warning",
    total: 1,
    state: "Firing",
    source: "Platform",
    description: "Failure to retrieve updates means cluster administrators must monitor for updates on their own.",
    time: "Jul 21, 2026, 9:44 AM",
    configPath: "/administration/cluster-settings",
    isRead: false,
    isAcknowledged: false,
  },
  {
    id: "alertmanager-receivers",
    name: "AlertmanagerReceiversNotConfigured",
    severity: "warning",
    total: 1,
    state: "Firing",
    source: "Platform",
    description: "Alerts are not configured to be sent to a notification system.",
    time: "Jul 21, 2026, 8:47 AM",
    configPath: "/administration/cluster-settings",
    isRead: false,
    isAcknowledged: false,
  },
  {
    id: "watchdog",
    name: "Watchdog",
    severity: "info",
    total: 1,
    state: "Firing",
    source: "Platform",
    description: "Alerting pipeline heartbeat.",
    time: "Jul 21, 2026, 8:00 AM",
    isRead: true,
    isAcknowledged: false,
  },
  {
    id: "cluster-unsupported",
    name: "This cluster is not supported.",
    severity: "recommendation",
    total: 1,
    state: "Firing",
    source: "Platform",
    description: "60-day self-support trial ending Sep 19, 2026.",
    time: "Jul 21, 2026, 8:00 AM",
    isRead: false,
    isAcknowledged: false,
  },
];

/** Extra alerts for volume / badge / Mark all as read testing. */
const EXTRA_ALERT_SEEDS: Omit<ConsoleAlert, "id" | "time" | "isRead" | "isAcknowledged" | "total" | "state" | "source">[] = [
  { name: "TargetDown", severity: "critical", description: "Prometheus target has been down for more than 15 minutes." },
  { name: "KubeNodeNotReady", severity: "critical", description: "Node has been in NotReady state for more than 15 minutes." },
  { name: "KubePodCrashLooping", severity: "critical", description: "Pod is crash looping in namespace openshift-monitoring." },
  { name: "KubeAPIDown", severity: "critical", description: "Kubernetes API server is not reachable." },
  { name: "etcdMembersDown", severity: "critical", description: "etcd cluster has unavailable members." },
  { name: "ClusterOperatorDown", severity: "critical", description: "Cluster operator reporting unavailable." },
  { name: "NodeFilesystemAlmostOutOfSpace", severity: "warning", description: "Filesystem predicts to run out of space within 24 hours." },
  { name: "NodeMemoryPressure", severity: "warning", description: "Node is under memory pressure." },
  { name: "KubeCPUOvercommit", severity: "warning", description: "Cluster has overcommitted CPU resource requests." },
  { name: "KubeMemoryOvercommit", severity: "warning", description: "Cluster has overcommitted memory resource requests." },
  { name: "PrometheusRuleFailures", severity: "warning", description: "Prometheus has failed to evaluate rule(s)." },
  { name: "AlertmanagerClusterFailedToSendAlerts", severity: "warning", description: "Alertmanager failed to send alerts to configured receivers." },
  { name: "KubeDeploymentReplicasMismatch", severity: "warning", description: "Deployment does not match the expected number of replicas." },
  { name: "KubeJobFailed", severity: "warning", description: "Job failed to complete successfully." },
  { name: "CertificateExpirySoon", severity: "warning", description: "TLS certificate expires in less than 30 days." },
  { name: "HighRequestLatency", severity: "warning", description: "API request latency is above the expected threshold." },
  { name: "ImagePullBackOff", severity: "warning", description: "Pod cannot pull container image." },
  { name: "PersistentVolumeFillingUp", severity: "warning", description: "PersistentVolume is filling up and may run out of space." },
  { name: "NetworkInterfaceSaturated", severity: "warning", description: "Network interface bandwidth utilization is high." },
  { name: "SchedulerPendingPods", severity: "warning", description: "Pods have been pending for an extended period." },
  { name: "InfoWatchdogSecondary", severity: "info", description: "Secondary watchdog probe succeeded." },
  { name: "ConfigReloaded", severity: "info", description: "Monitoring configuration was reloaded successfully." },
  { name: "ClusterVersionRetrieved", severity: "info", description: "Cluster version information was retrieved." },
  { name: "OperatorCatalogSynced", severity: "info", description: "Operator catalog source finished syncing." },
  { name: "MetricsEndpointReady", severity: "info", description: "Metrics endpoint is ready and scrapeable." },
  { name: "BackupJobScheduled", severity: "info", description: "Scheduled backup job is queued." },
  { name: "AuditLogRotated", severity: "info", description: "Audit log rotation completed." },
  { name: "IdleWorkloadDetected", severity: "info", description: "Workload has been idle for an extended period." },
  { name: "NodeReady", severity: "info", description: "Node reported Ready condition." },
  { name: "ProbeSucceeded", severity: "info", description: "Synthetic probe succeeded." },
];

function buildExtraAlerts(): ConsoleAlert[] {
  return EXTRA_ALERT_SEEDS.map((seed, i) => {
    const minute = String((i * 3) % 60).padStart(2, "0");
    const hour = 7 + Math.floor(i / 20);
    return {
      id: `extra-alert-${i + 1}`,
      name: seed.name,
      severity: seed.severity,
      total: 1 + (i % 3),
      state: "Firing" as const,
      source: i % 5 === 0 ? ("User" as const) : ("Platform" as const),
      description: seed.description,
      time: `Jul 21, 2026, ${hour}:${minute} AM`,
      configPath: seed.severity === "critical" ? "/observe/alerts" : undefined,
      isRead: false,
      isAcknowledged: false,
    };
  });
}

const INITIAL: ConsoleAlert[] = [...SEED_ALERTS, ...buildExtraAlerts()];

const NotificationAlertsContext = createContext<NotificationAlertsContextValue | null>(null);

export function NotificationAlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState(INITIAL);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [severityFilters, setSeverityFilters] = useState<Set<DrawerSeverityFilter>>(
    () => new Set(["critical", "warning", "info", "recommendation"])
  );
  const [alertStateFilter, setAlertStateFilter] = useState<"Firing" | "all">("Firing");
  const [sourceFilter, setSourceFilter] = useState<"Platform" | "all">("Platform");

  const toggleSeverityFilter = useCallback((s: DrawerSeverityFilter) => {
    setSeverityFilters((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }, []);

  const markRead = useCallback((ids: string[], read = true) => {
    setAlerts((prev) => prev.map((a) => (ids.includes(a.id) ? { ...a, isRead: read } : a)));
  }, []);

  const acknowledge = useCallback((ids: string[]) => {
    setAlerts((prev) =>
      prev.map((a) => (ids.includes(a.id) ? { ...a, isAcknowledged: true, isRead: true } : a))
    );
  }, []);

  const dismiss = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const observeAlertsHref = useMemo(() => {
    const params = new URLSearchParams();
    if (alertStateFilter === "Firing") params.set("state", "Firing");
    if (sourceFilter === "Platform") params.set("source", "Platform");
    const activeSev = [...severityFilters];
    if (activeSev.length && activeSev.length < 4) params.set("severity", activeSev.join(","));
    if (search.trim()) params.set("q", search.trim());
    const qs = params.toString();
    return qs ? `/observe/alerts?${qs}` : "/observe/alerts";
  }, [alertStateFilter, sourceFilter, severityFilters, search]);

  const filteredDrawerAlerts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alerts.filter((a) => {
      if (!severityFilters.has(a.severity)) return false;
      if (unreadOnly && a.isRead) return false;
      if (alertStateFilter !== "all" && a.state !== alertStateFilter) return false;
      if (sourceFilter !== "all" && a.source !== sourceFilter) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
    });
  }, [alerts, severityFilters, unreadOnly, search, alertStateFilter, sourceFilter]);

  const value = useMemo(
    () => ({
      alerts,
      drawerOpen,
      setDrawerOpen,
      search,
      setSearch,
      unreadOnly,
      setUnreadOnly,
      severityFilters,
      toggleSeverityFilter,
      alertStateFilter,
      sourceFilter,
      setAlertStateFilter,
      setSourceFilter,
      markRead,
      acknowledge,
      dismiss,
      observeAlertsHref,
      filteredDrawerAlerts,
    }),
    [
      alerts,
      drawerOpen,
      search,
      unreadOnly,
      severityFilters,
      toggleSeverityFilter,
      alertStateFilter,
      sourceFilter,
      markRead,
      acknowledge,
      dismiss,
      observeAlertsHref,
      filteredDrawerAlerts,
    ]
  );

  return (
    <NotificationAlertsContext.Provider value={value}>{children}</NotificationAlertsContext.Provider>
  );
}

export function useNotificationAlerts() {
  const ctx = useContext(NotificationAlertsContext);
  if (!ctx) throw new Error("useNotificationAlerts requires NotificationAlertsProvider");
  return ctx;
}
