export type EpicStatus = "completed" | "in-progress" | "not-started";

export type TrackSegment = { type: "jira"; key: string } | { type: "text"; value: string };

export interface EpicCardProps {
  id: string;
  title: string;
  track: TrackSegment[];
  description: string;
  /** Fallback when live Jira status cannot be fetched (dev proxy / token). */
  status: EpicStatus;
  /** Jira key that drives the badge; defaults to the first jira track segment. */
  statusKey?: string;
  ctaLabel: string;
  ctaTo?: string;
  ctaDisabled?: boolean;
}

export const JIRA_BROWSE_URL = "https://issues.redhat.com/browse";

export const STATUS_LABEL: Record<EpicStatus, string> = {
  completed: "Completed",
  "in-progress": "In progress",
  "not-started": "Not started",
};

export const STATUS_COLOR: Record<EpicStatus, "green" | "orange" | "grey"> = {
  completed: "green",
  "in-progress": "orange",
  "not-started": "grey",
};

export const EPIC_CARDS: EpicCardProps[] = [
  {
    id: "phase-1-links",
    title: "Phase 1 — Cross-layer link automation",
    track: [{ type: "jira", key: "HPUX-1766" }, { type: "text", value: " / OCP 5.0 priority" }],
    description:
      "Automate bidirectional links between Networking and Virtualization: standardized network detail pages (Details, YAML, Connected virtual machines) in Virtual machine networks, plus deep links from networking resources.",
    status: "completed",
    statusKey: "HPUX-1766",
    ctaLabel: "Open Virtual machine networks",
    ctaTo: "/virtualization/virtualmachinenetworks",
  },
  {
    id: "phase-2-topology",
    title: "Phase 2 — Network topology visualization",
    track: [{ type: "jira", key: "HPUX-1717" }, { type: "text", value: " / Topology over tree view" }],
    description:
      "Graph-based topology (not tree view) for network relationships — inspired by VMware port-group workflows. Prototype emphasizes collapsible clusters and filters for large-scale environments.",
    status: "in-progress",
    statusKey: "HPUX-1717",
    ctaLabel: "Preview topology canvas",
    ctaTo: "/networking/topology",
  },
  {
    id: "split-view-form-yaml",
    title: "Split view (Form & YAML)",
    track: [{ type: "jira", key: "HPUX-1717" }, { type: "text", value: " / Create flows" }],
    description:
      "Form view and YAML view toggle for NAD, UDN, CUDN, and NNCP creation with bidirectional sync, YAML validation and unmapped-content warnings, plus an inline schema reference panel.",
    status: "in-progress",
    statusKey: "HPUX-1717",
    ctaLabel: "View Create Wizard Example",
    ctaTo: "/networking/node-network-configuration?create=user-defined-network",
  },
  {
    id: "hardware-interface-config",
    title: "Hardware and Interface configuration",
    track: [{ type: "jira", key: "HPUX-1717" }, { type: "text", value: " / Node network state" }],
    description:
      "Node Network State table for per-node interface inventory (type, IP, MAC, MTU, LLDP) and topology physical underlay chains from NIC through bond and VLAN to OVS bridge.",
    status: "in-progress",
    statusKey: "HPUX-1717",
    ctaLabel: "Explore Node Network State",
    ctaTo: "/networking/node-network-configuration?view=table",
  },
  {
    id: "console-5370",
    title: "Workload Nodes on Topology",
    track: [
      { type: "text", value: "Phase 3 Integration / " },
      { type: "jira", key: "CONSOLE-5370" },
    ],
    description:
      "Place virtual machines and pod workloads as interactive nodes on the cluster network topology graph so operators can trace workload-to-network relationships in context.",
    status: "not-started",
    statusKey: "CONSOLE-5370",
    ctaLabel: "Coming soon",
    ctaDisabled: true,
  },
  {
    id: "hpux-1429",
    title: "Dataview Toolbar filtering",
    track: [{ type: "jira", key: "HPUX-1429" }, { type: "text", value: " / " }, { type: "jira", key: "CONSOLE-5091" }],
    description:
      "PatternFly DataView toolbar filtering with attribute-menu advanced filters, chip rows on ToolbarFilter, and the ListAdvancedFilterModal pattern on Installed Operators.",
    status: "completed",
    statusKey: "HPUX-1429",
    ctaLabel: "View Installed Operators",
    ctaTo: "/ecosystem/installed-operators",
  },
  {
    id: "hpux-1480",
    title: "OLM Update & Cluster Update Experience",
    track: [{ type: "jira", key: "HPUX-1480" }, { type: "text", value: " / OLM & Operator Management" }],
    description:
      "End-to-end cluster update planning with manual and agent-led paths, available version risk assessment, operators-on-cluster compatibility, pre-flight checks, and AI Update Agent decision workflows.",
    status: "completed",
    statusKey: "HPUX-1480",
    ctaLabel: "Launch Cluster Update",
    ctaTo: "/administration/cluster-update",
  },
  {
    id: "hpux-1896",
    title: "Service Account Impersonation",
    track: [{ type: "jira", key: "HPUX-1896" }, { type: "text", value: " / " }, { type: "jira", key: "HPUX-741" }],
    description:
      "Frontend-only Impersonate modal extension: User / Service Account toggle that constructs system:serviceaccount:<ns>:<name> client-side. No new backend plumbing required.",
    status: "completed",
    statusKey: "HPUX-1896",
    ctaLabel: "Open Impersonate modal",
    ctaTo: "/overview?impersonate=1",
  },
  {
    id: "hpux-1867",
    title: "Service creation form (Form / YAML)",
    track: [
      { type: "jira", key: "HPUX-1867" },
      { type: "text", value: " / " },
      { type: "jira", key: "HPUX-1717" },
      { type: "text", value: " / RFE-7581" },
    ],
    description:
      "Dual-mode Service create for OpenShift Console 5.0: Form view alongside the existing YAML path, with bidirectional sync — same pattern as network resource creation in HPUX-1717.",
    status: "in-progress",
    statusKey: "HPUX-1867",
    ctaLabel: "Open Create Service",
    ctaTo: "/networking/services/create",
  },
  {
    id: "hpux-1868",
    title: "Endpoint health on Services & Routes",
    track: [
      { type: "jira", key: "HPUX-1868" },
      { type: "text", value: " / " },
      { type: "jira", key: "HPUX-1717" },
      { type: "text", value: " / RFE-9483" },
    ],
    description:
      "List-level aggregated endpoint readiness: Health column on Services and Routes (icon + ready/total), Unknown when unloaded, Auto-refresh off by default.",
    status: "in-progress",
    statusKey: "HPUX-1868",
    ctaLabel: "Open Services list",
    ctaTo: "/networking/services",
  },
];
