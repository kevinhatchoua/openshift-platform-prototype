export type EpicStatus = "completed" | "in-progress" | "not-started";

export interface EpicCardProps {
  id: string;
  title: string;
  track: string;
  description: string;
  status: EpicStatus;
  ctaLabel: string;
  ctaTo?: string;
  ctaDisabled?: boolean;
}

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
    id: "hpux-1768",
    title: "Infrastructure Topology Engine",
    track: "HPUX-1768 / Track C",
    description:
      "Visual interactive cluster mapping including node grouping hulls, interface nesting, and dynamic canvas element layout transformations.",
    status: "completed",
    ctaLabel: "Launch Canvas View",
    ctaTo: "/networking/topology?view=topology",
  },
  {
    id: "hpux-1766",
    title: "Workload Link & Relationship Mapping",
    track: "HPUX-1766 / Track A & B",
    description:
      "Cross-layer relationship links binding VM Network resources directly to physical infrastructure backplanes, detail tabs, and NetworkAttachmentDefinition (NAD) matrix views.",
    status: "completed",
    ctaLabel: "Launch Workload Matrix",
    ctaTo: "/virtualization/virtualmachines",
  },
  {
    id: "dual-mode-schema",
    title: "Dual-Mode Schema Serialization (Form & YAML Sync)",
    track: "Form & YAML Sync",
    description:
      "Bidirectional real-time form validation and lossless parsing layers enabling seamless hot-swapping between form controls and raw code editors across creation wizards.",
    status: "in-progress",
    ctaLabel: "View Create Wizard Example",
    ctaTo: "/networking/node-network-configuration?create=user-defined-network",
  },
  {
    id: "phase-1-5",
    title: "Hardware Underlay & Policy Audits",
    track: "Phase 1.5 Alignment",
    description:
      "Physical NIC-to-Bridge hardware lineages, namespace propagation tracking, and explicit structural binding rules mapping NNCP configurations straight to canvas elements.",
    status: "in-progress",
    ctaLabel: "Explore Node Network State",
    ctaTo: "/networking/node-network-configuration?view=table",
  },
  {
    id: "console-5370",
    title: "Workload Nodes on Canvas",
    track: "Phase 3 Integration / CONSOLE-5370",
    description:
      "Incorporating actual virtual machines and active pod instances as physical interactive graph entities along the topology tree.",
    status: "not-started",
    ctaLabel: "Coming soon",
    ctaDisabled: true,
  },
  {
    id: "hpux-1429",
    title: "Operator Support Lifecycle Dates",
    track: "HPUX-1429 / CONSOLE-5091",
    description:
      "Installed Operators table with policy-aligned support phases, current phase end dates, entitlement-aware lifecycle evaluation, platform-aligned EUS mismatch callouts, and AI pre-check entry points.",
    status: "completed",
    ctaLabel: "View Installed Operators",
    ctaTo: "/ecosystem/installed-operators",
  },
  {
    id: "hpux-1480",
    title: "OLM Update & Cluster Update Experience",
    track: "HPUX-1480 / OLM & Operator Management",
    description:
      "End-to-end cluster update planning with manual and agent-led paths, available version risk assessment, operators-on-cluster compatibility, pre-flight checks, and AI Update Agent decision workflows.",
    status: "completed",
    ctaLabel: "Launch Cluster Update",
    ctaTo: "/administration/cluster-update",
  },
];
