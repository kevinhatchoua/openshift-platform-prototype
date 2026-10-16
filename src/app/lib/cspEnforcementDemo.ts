/** Prototype models for CONSOLE CSP enforcement UX (HPUX-2307 / CCSIG). */

export type CspEnforcementMode = "report-only" | "observing" | "enforcing";

export type CspDirectiveClass =
  | "connect-src"
  | "helm-server"
  | "object-src"
  | "media-src";

export type AllowListProvenance = "upgrade-seed" | "platform-default" | "admin-added";

export type AllowListEntry = {
  id: string;
  target: string;
  scope: "browser" | "server-side-helm";
  provenance: AllowListProvenance;
  rationale?: string;
};

export type CspViolationScenario = {
  id: string;
  label: string;
  task: string;
  directive: CspDirectiveClass;
  blockedUrl: string;
  summary: string;
};

export const CSP_ENFORCEMENT_MODE_LABELS: Record<CspEnforcementMode, string> = {
  "report-only": "Report only",
  observing: "Observing (warn)",
  enforcing: "Enforcing",
};

export const DEMO_ALLOW_LIST: AllowListEntry[] = [
  {
    id: "gh",
    target: "https://github.com",
    scope: "browser",
    provenance: "upgrade-seed",
    rationale: "Seeded from configured Helm/Git sources during cluster upgrade.",
  },
  {
    id: "gl",
    target: "https://gitlab.com",
    scope: "browser",
    provenance: "platform-default",
    rationale: "Common Git host default for greenfield clusters (review before enforce).",
  },
  {
    id: "quay",
    target: "https://quay.io",
    scope: "server-side-helm",
    provenance: "upgrade-seed",
    rationale: "Chart index referenced by existing cluster Helm repositories.",
  },
  {
    id: "custom",
    target: "https://charts.example.com",
    scope: "server-side-helm",
    provenance: "admin-added",
    rationale: "Added by cluster admin via ConsoleOperator CR.",
  },
];

export const CSP_VIOLATION_SCENARIOS: CspViolationScenario[] = [
  {
    id: "git-import",
    label: "Import from Git (developer)",
    task: "Developer console: import YAML from a private Git host",
    directive: "connect-src",
    blockedUrl: "https://git.internal.example.com/import",
    summary: "Browser fetch blocked while importing manifests from Git.",
  },
  {
    id: "helm-install",
    label: "Helm chart install",
    task: "Helm install from chart museum not on allow-list",
    directive: "helm-server",
    blockedUrl: "https://charts.vendor.example.com/stable/app-1.2.3.tgz",
    summary: "Server-side chart retrieval blocked during Helm action.",
  },
  {
    id: "plugin-object",
    label: "Console plugin asset",
    task: "Dynamic plugin loads media from unapproved origin",
    directive: "object-src",
    blockedUrl: "https://cdn.plugins.example.com/widget.swf",
    summary: "Plugin object/media load blocked by CSP directive.",
  },
];
