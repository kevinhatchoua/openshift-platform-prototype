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

const INITIAL: ConsoleAlert[] = [
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
