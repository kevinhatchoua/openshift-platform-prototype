import { findPrototypeApplicationSet } from "./prototypeGitopsStore";

export type GitOpsHealth = "Healthy" | "Paused" | "Progressing" | "Degraded" | "Aborting";

export type GitOpsOwner = {
  kind: "Application" | "ApplicationSet" | "Rollout" | "ReplicaSet";
  name: string;
  ns?: string;
} | null;

export type RolloutRecord = {
  name: string;
  ns: string;
  strategy: "BlueGreen" | "Canary";
  status: GitOpsHealth;
  age: string;
  image: string;
  managedBy: GitOpsOwner;
};

export type ArgoCdComponent = "server" | "repo" | "redis" | "controller" | "sso";

export const GITOPS_ALL_INSTANCES = "__all__";

export type ArgoCdRecord = {
  name: string;
  ns: string;
  server: string;
  status: "Healthy" | "Degraded";
  version: string;
  age: string;
  applications: string;
  cpu: string;
  memory: string;
  created: string;
  successfulSyncs: number;
  failedSyncs24h: number;
  clusterConnectivity: string;
  repoPending: number;
  components: Record<ArgoCdComponent, "Healthy" | "Degraded">;
};

export function instanceKeyOf(inst: Pick<ArgoCdRecord, "ns" | "name">) {
  return `${inst.ns}/${inst.name}`;
}

export type OwnerReference = {
  apiVersion: string;
  kind: string;
  name: string;
  uid?: string;
};

export type ApplicationRecord = {
  name: string;
  ns: string;
  project: string;
  sync: "Synced" | "OutOfSync";
  health: GitOpsHealth;
  age: string;
  repo: string;
  path: string;
  revision: string;
  destination: string;
  /** Mirrors `.metadata.ownerReferences` on the Application CR. */
  ownerReferences: OwnerReference[];
  instanceKey: string;
  lastReconciled: string;
};

export type ApplicationSetGeneratorNode = {
  type: string;
  label?: string;
  children?: ApplicationSetGeneratorNode[];
};

export type ApplicationSetRecord = {
  name: string;
  ns: string;
  generators: string;
  generatorTree: ApplicationSetGeneratorNode[];
  apps: string;
  age: string;
  repo: string;
  path: string;
  status: "Healthy" | "Degraded";
};

export const GITOPS_ROLLOUTS: RolloutRecord[] = [
  {
    name: "rollout-bluegreen",
    ns: "argocd",
    strategy: "BlueGreen",
    status: "Paused",
    age: "135m",
    image: "argoproj/rollouts-demo:red",
    managedBy: { kind: "Application", name: "rollouts-demo", ns: "argocd" },
  },
  {
    name: "rollout-canary-api",
    ns: "argocd",
    strategy: "Canary",
    status: "Healthy",
    age: "2d",
    image: "quay.io/demo/payments-api:1.4.2",
    managedBy: { kind: "Application", name: "payments-api", ns: "argocd" },
  },
  {
    name: "rollout-frontend",
    ns: "demo-workloads",
    strategy: "Canary",
    status: "Progressing",
    age: "45m",
    image: "argoproj/rollouts-demo:yellow",
    managedBy: { kind: "Application", name: "frontend-canary", ns: "demo-workloads" },
  },
];

const extraNames = [
  "checkout-api",
  "inventory-svc",
  "notifications",
  "search-indexer",
  "auth-gateway",
  "billing-worker",
  "catalog-web",
  "orders-canary",
  "shipping-bluegreen",
];
const extraNs = ["argocd", "demo-workloads", "payments"];
const extraStatus: GitOpsHealth[] = ["Healthy", "Paused", "Progressing", "Degraded", "Healthy"];

extraNames.forEach((n, i) => {
  GITOPS_ROLLOUTS.push({
    name: `rollout-${n}`,
    ns: extraNs[i % extraNs.length],
    strategy: i % 2 === 0 ? "BlueGreen" : "Canary",
    status: extraStatus[i % extraStatus.length],
    age: i % 3 === 0 ? `${i + 1}d` : `${30 + i * 7}m`,
    image: "argoproj/rollouts-demo:blue",
    managedBy: i % 7 === 0 ? null : { kind: "Application", name: n, ns: extraNs[i % extraNs.length] },
  });
});

const ALL_COMPONENTS: ArgoCdRecord["components"] = {
  server: "Healthy",
  repo: "Healthy",
  redis: "Healthy",
  controller: "Healthy",
  sso: "Healthy",
};

export const ARGO_INSTANCES: ArgoCdRecord[] = [
  {
    name: "argocd",
    ns: "openshift-gitops-operator",
    server: "https://argocd-server.apps.demo.red-chesterfield.com",
    status: "Healthy",
    version: "v2.14.3",
    age: "17d",
    applications: "0",
    cpu: "1.1 cores",
    memory: "1.6 Gi",
    created: "17d ago",
    successfulSyncs: 0,
    failedSyncs24h: 0,
    clusterConnectivity: "1/1",
    repoPending: 0,
    components: ALL_COMPONENTS,
  },
  {
    name: "openshift-gitops",
    ns: "openshift-gitops",
    server: "https://openshift-gitops-server.apps.demo.example.com",
    status: "Healthy",
    version: "v2.14.3",
    age: "77d",
    applications: "3",
    cpu: "1.9 cores",
    memory: "2.4 Gi",
    created: "77d ago",
    successfulSyncs: 4,
    failedSyncs24h: 0,
    clusterConnectivity: "1/1",
    repoPending: 0,
    components: ALL_COMPONENTS,
  },
  {
    name: "team-b",
    ns: "team-b-gitops",
    server: "https://team-b-server.apps.demo.example.com",
    status: "Healthy",
    version: "v2.13.1",
    age: "97d",
    applications: "1",
    cpu: "0m",
    memory: "0 Mi",
    created: "97d ago",
    successfulSyncs: 1,
    failedSyncs24h: 0,
    clusterConnectivity: "1/1",
    repoPending: 0,
    components: ALL_COMPONENTS,
  },
  {
    name: "gitops-spoke-east",
    ns: "gitops-spoke-east",
    server: "https://argocd.spoke-east.example.com",
    status: "Healthy",
    version: "v2.13.1",
    age: "22d",
    applications: "1",
    cpu: "800m",
    memory: "1.1 Gi",
    created: "22d ago",
    successfulSyncs: 18,
    failedSyncs24h: 0,
    clusterConnectivity: "1/1",
    repoPending: 0,
    components: ALL_COMPONENTS,
  },
  {
    name: "gitops-spoke-west",
    ns: "gitops-spoke-west",
    server: "https://argocd.spoke-west.example.com",
    status: "Healthy",
    version: "v2.13.1",
    age: "19d",
    applications: "0",
    cpu: "720m",
    memory: "980 Mi",
    created: "19d ago",
    successfulSyncs: 6,
    failedSyncs24h: 0,
    clusterConnectivity: "1/1",
    repoPending: 0,
    components: ALL_COMPONENTS,
  },
  {
    name: "payments-gitops",
    ns: "payments",
    server: "https://argocd.payments.example.com",
    status: "Degraded",
    version: "v2.12.8",
    age: "11d",
    applications: "1",
    cpu: "1.4 cores",
    memory: "1.8 Gi",
    created: "11d ago",
    successfulSyncs: 9,
    failedSyncs24h: 2,
    clusterConnectivity: "0/1",
    repoPending: 3,
    components: { ...ALL_COMPONENTS, repo: "Degraded" },
  },
  {
    name: "edge-lab",
    ns: "edge-lab",
    server: "https://argocd.edge-lab.example.com",
    status: "Degraded",
    version: "v2.11.4",
    age: "40d",
    applications: "0",
    cpu: "400m",
    memory: "512 Mi",
    created: "40d ago",
    successfulSyncs: 0,
    failedSyncs24h: 1,
    clusterConnectivity: "0/1",
    repoPending: 1,
    components: { ...ALL_COMPONENTS, server: "Degraded", sso: "Degraded" },
  },
  {
    name: "platform-addons",
    ns: "openshift-gitops",
    server: "https://platform-addons.apps.demo.example.com",
    status: "Healthy",
    version: "v2.14.3",
    age: "30d",
    applications: "1",
    cpu: "600m",
    memory: "768 Mi",
    created: "30d ago",
    successfulSyncs: 22,
    failedSyncs24h: 0,
    clusterConnectivity: "1/1",
    repoPending: 0,
    components: ALL_COMPONENTS,
  },
];

export const GITOPS_APPLICATIONS: ApplicationRecord[] = [
  {
    name: "team-b-guestbook",
    ns: "team-b-gitops",
    project: "default",
    sync: "Synced",
    health: "Healthy",
    age: "97d",
    repo: "https://github.com/argoproj/argocd-example-apps.git",
    path: "guestbook",
    revision: "8088f4c0d970abb09e250248cc97e35623447cb5",
    destination: "team-b-apps",
    ownerReferences: [],
    instanceKey: "team-b-gitops/team-b",
    lastReconciled: "3m ago",
  },
  {
    name: "rollouts-demo",
    ns: "argocd",
    project: "default",
    sync: "Synced",
    health: "Healthy",
    age: "12d",
    repo: "https://github.com/argoproj/argocd-example-apps.git",
    path: "guestbook",
    revision: "main",
    destination: "in-cluster / rollouts-demo",
    ownerReferences: [],
    instanceKey: "openshift-gitops/openshift-gitops",
    lastReconciled: "8m ago",
  },
  {
    name: "payments-api",
    ns: "argocd",
    project: "payments",
    sync: "OutOfSync",
    health: "Progressing",
    age: "3d",
    repo: "https://gitlab.example.com/payments/payments-api.git",
    path: "deploy/overlays/prod",
    revision: "release-1.4",
    destination: "in-cluster / payments",
    ownerReferences: [],
    instanceKey: "payments/payments-gitops",
    lastReconciled: "21m ago",
  },
  {
    name: "frontend-canary",
    ns: "demo-workloads",
    project: "default",
    sync: "Synced",
    health: "Healthy",
    age: "8d",
    repo: "https://github.com/demo/frontend.git",
    path: "kustomize/canary",
    revision: "main",
    destination: "in-cluster / demo-workloads",
    ownerReferences: [
      {
        apiVersion: "argoproj.io/v1alpha1",
        kind: "ApplicationSet",
        name: "tenant-workloads",
        uid: "a1b2c3d4-tenant-workloads",
      },
    ],
    instanceKey: "gitops-spoke-east/gitops-spoke-east",
    lastReconciled: "4m ago",
  },
  {
    name: "cluster-addons-core",
    ns: "openshift-gitops",
    project: "platform",
    sync: "Synced",
    health: "Healthy",
    age: "20d",
    repo: "https://github.com/demo/cluster-addons.git",
    path: "sets/addons",
    revision: "main",
    destination: "in-cluster / openshift-gitops",
    ownerReferences: [
      {
        apiVersion: "argoproj.io/v1alpha1",
        kind: "ApplicationSet",
        name: "cluster-addons",
        uid: "e5f6g7h8-cluster-addons",
      },
    ],
    instanceKey: "openshift-gitops/platform-addons",
    lastReconciled: "12m ago",
  },
];

export const GITOPS_APPLICATION_SETS: ApplicationSetRecord[] = [
  {
    name: "cluster-addons",
    ns: "openshift-gitops",
    generators: "cluster",
    generatorTree: [
      {
        type: "cluster",
        label: "Cluster — decision: Every registered cluster",
      },
    ],
    apps: "6",
    age: "20d",
    repo: "https://github.com/demo/cluster-addons.git",
    path: "sets/addons",
    status: "Healthy",
  },
  {
    name: "tenant-workloads",
    ns: "argocd",
    generators: "git, list",
    generatorTree: [
      {
        type: "merge",
        label: "Merge",
        children: [
          {
            type: "git",
            label: "Git — github.com/demo/tenant-workloads (directories: tenants/*)",
          },
          {
            type: "list",
            label: "List — elements: tenant-a, tenant-b, tenant-c",
          },
        ],
      },
    ],
    apps: "14",
    age: "5d",
    repo: "https://github.com/demo/tenant-workloads.git",
    path: "applicationsets/tenants",
    status: "Healthy",
  },
];

export type AppProjectRecord = {
  name: string;
  ns: string;
  description: string;
  destinations: string;
  sourceRepos: string;
  age: string;
};

export type ImageUpdaterRecord = {
  name: string;
  ns: string;
  images: string;
  strategy: string;
  status: "Healthy" | "Degraded";
  lastUpdate: string;
  age: string;
};

/** Status/health only — never include jwt/tls/credential fields. */
export type AgentSpokeRecord = {
  name: string;
  ns: string;
  cluster: string;
  instanceKey: string;
  connection: "Connected" | "Disconnected";
  syncMode: "Managed" | "Autonomous";
  lastHeartbeat: string;
  reconnections: number;
  syncError?: { title: string; detail: string };
};

export type ExperimentRecord = {
  name: string;
  rolloutNs: string;
  rolloutName: string;
  phase: "Successful" | "Running" | "Failed";
  duration: string;
  metrics: string;
  metricSeries: { name: string; value: string; status: "pass" | "fail" }[];
};

export type DashboardMetrics = {
  synced: number;
  outOfSync: number;
  healthy: number;
  degraded: number;
  progressing: number;
  paused: number;
  syncSuccessRate: number;
  reconciliations24h: number;
  gitFetchFailures: number;
  sparklineSync: number[];
  sparklineReconcile: number[];
  needsAttention: {
    name: string;
    ns: string;
    reason: string;
    severity: "warning" | "danger" | "informational";
  }[];
};

export type PromotionStage = {
  name: string;
  status: "pending" | "running" | "succeeded" | "blocked" | "failed";
  gate?: string;
};

export type PromotionPipelineRecord = {
  name: string;
  ns: string;
  environments: string;
  status: "Running" | "Blocked" | "Succeeded" | "Failed";
  gates: string;
  age: string;
  stages: PromotionStage[];
};

export const GITOPS_APP_PROJECTS: AppProjectRecord[] = [
  {
    name: "default",
    ns: "team-b-gitops",
    description: "Default project for team-b workloads",
    destinations: "team-b-apps",
    sourceRepos: "https://github.com/argoproj/*",
    age: "97d",
  },
  {
    name: "default",
    ns: "argocd",
    description: "Default project for cluster-scoped demos",
    destinations: "in-cluster / *",
    sourceRepos: "https://github.com/argoproj/*, https://github.com/demo/*",
    age: "45d",
  },
  {
    name: "payments",
    ns: "argocd",
    description: "Payments team workloads and overlays",
    destinations: "in-cluster / payments, spoke-east / payments",
    sourceRepos: "https://gitlab.example.com/payments/*",
    age: "18d",
  },
  {
    name: "platform",
    ns: "openshift-gitops",
    description: "Platform add-ons and cluster services",
    destinations: "in-cluster / openshift-*, in-cluster / gitops-*",
    sourceRepos: "https://github.com/demo/cluster-addons.git",
    age: "30d",
  },
];

export const GITOPS_IMAGE_UPDATERS: ImageUpdaterRecord[] = [
  {
    name: "payments-api-updater",
    ns: "argocd",
    images: "quay.io/demo/payments-api",
    strategy: "semver",
    status: "Healthy",
    lastUpdate: "2h ago",
    age: "12d",
  },
  {
    name: "frontend-canary-updater",
    ns: "demo-workloads",
    images: "argoproj/rollouts-demo",
    strategy: "newest-build",
    status: "Degraded",
    lastUpdate: "1d ago",
    age: "8d",
  },
];

export const GITOPS_AGENT_SPOKES: AgentSpokeRecord[] = [
  {
    name: "spoke-east-agent",
    ns: "gitops-spoke-east",
    cluster: "spoke-east",
    instanceKey: "gitops-spoke-east/gitops-spoke-east",
    connection: "Connected",
    syncMode: "Managed",
    lastHeartbeat: "12s ago",
    reconnections: 2,
  },
  {
    name: "spoke-west-agent",
    ns: "gitops-spoke-west",
    cluster: "spoke-west",
    instanceKey: "openshift-gitops/openshift-gitops",
    connection: "Connected",
    syncMode: "Autonomous",
    lastHeartbeat: "45s ago",
    reconnections: 0,
  },
  {
    name: "edge-lab-agent",
    ns: "edge-lab",
    cluster: "edge-lab",
    instanceKey: "openshift-gitops/platform-addons",
    connection: "Disconnected",
    syncMode: "Managed",
    lastHeartbeat: "3h ago",
    reconnections: 11,
    syncError: {
      title: "Agent cannot reach hub API",
      detail:
        "Last sync failed with connection refused. Check firewall rules and that the agent registration is still valid.",
    },
  },
];

export const GITOPS_PROMOTION_PIPELINES: PromotionPipelineRecord[] = [
  {
    name: "payments-promote",
    ns: "argocd",
    environments: "dev → staging → prod",
    status: "Running",
    gates: "manual (staging→prod)",
    age: "4h",
    stages: [
      { name: "dev", status: "succeeded" },
      { name: "staging", status: "running", gate: "analysis" },
      { name: "prod", status: "pending", gate: "manual approval" },
    ],
  },
  {
    name: "frontend-canary-promote",
    ns: "demo-workloads",
    environments: "canary → stable",
    status: "Blocked",
    gates: "analysis + approval",
    age: "1d",
    stages: [
      { name: "canary", status: "succeeded" },
      { name: "stable", status: "blocked", gate: "analysis + approval" },
    ],
  },
];

function buildDashboardMetrics(apps: ApplicationRecord[] = GITOPS_APPLICATIONS): DashboardMetrics {
  const synced = apps.filter((a) => a.sync === "Synced").length;
  const outOfSync = apps.filter((a) => a.sync === "OutOfSync").length;
  const healthy = apps.filter((a) => a.health === "Healthy").length;
  const degraded = apps.filter((a) => a.health === "Degraded").length;
  const progressing = apps.filter((a) => a.health === "Progressing").length;
  const paused = apps.filter((a) => a.health === "Paused").length;
  const total = apps.length || 1;
  const needsAttention = apps
    .filter((a) => a.sync === "OutOfSync" || a.health === "Degraded" || a.health === "Progressing")
    .map((a) => ({
      name: a.name,
      ns: a.ns,
      reason:
        a.health === "Degraded"
          ? "Health degraded"
          : a.sync === "OutOfSync"
            ? "Out of sync with desired revision"
            : "Sync in progress",
      severity: (a.health === "Degraded" ? "danger" : a.sync === "OutOfSync" ? "warning" : "informational") as
        | "warning"
        | "danger"
        | "informational",
    }));
  return {
    synced,
    outOfSync,
    healthy,
    degraded,
    progressing,
    paused,
    syncSuccessRate: Math.round((synced / total) * 100),
    reconciliations24h: 128 + synced * 12,
    gitFetchFailures: outOfSync > 0 ? 2 : 0,
    sparklineSync: [72, 78, 81, 75, 88, 90, Math.round((synced / total) * 100)],
    sparklineReconcile: [40, 52, 48, 61, 55, 70, 64],
    needsAttention,
  };
}

export const GITOPS_DASHBOARD_METRICS: DashboardMetrics = buildDashboardMetrics();

export function dashboardMetricsForInstance(key: string) {
  return buildDashboardMetrics(applicationsForInstance(key));
}

export const ARGO_INSTANCE_OPTIONS = ARGO_INSTANCES.map((inst) => ({
  value: instanceKeyOf(inst),
  label: instanceKeyOf(inst),
}));

export function applicationsForInstance(key: string) {
  if (!key || key === GITOPS_ALL_INSTANCES) return GITOPS_APPLICATIONS;
  return GITOPS_APPLICATIONS.filter((a) => a.instanceKey === key);
}

export function appProjectsForInstance(key: string) {
  if (!key || key === GITOPS_ALL_INSTANCES) return GITOPS_APP_PROJECTS;
  const ns = key.split("/")[0];
  return GITOPS_APP_PROJECTS.filter((p) => p.ns === ns);
}

export function applicationSetsForInstance(key: string) {
  if (!key || key === GITOPS_ALL_INSTANCES) return GITOPS_APPLICATION_SETS;
  const ns = key.split("/")[0];
  return GITOPS_APPLICATION_SETS.filter((s) => s.ns === ns);
}

export function rolloutsForInstance(key: string) {
  if (!key || key === GITOPS_ALL_INSTANCES) return GITOPS_ROLLOUTS;
  const appKeys = new Set(applicationsForInstance(key).map((a) => `${a.ns}/${a.name}`));
  const instNs = key.split("/")[0];
  return GITOPS_ROLLOUTS.filter((r) => {
    if (r.managedBy?.kind === "Application") {
      return appKeys.has(`${r.managedBy.ns ?? r.ns}/${r.managedBy.name}`);
    }
    return r.ns === instNs;
  });
}

export function imageUpdatersForInstance(key: string) {
  if (!key || key === GITOPS_ALL_INSTANCES) return GITOPS_IMAGE_UPDATERS;
  const instNs = key.split("/")[0];
  return GITOPS_IMAGE_UPDATERS.filter((u) => u.ns === instNs);
}

export function promotionsForInstance(key: string) {
  if (!key || key === GITOPS_ALL_INSTANCES) return GITOPS_PROMOTION_PIPELINES;
  const instNs = key.split("/")[0];
  return GITOPS_PROMOTION_PIPELINES.filter((p) => p.ns === instNs);
}

export function agentsForInstance(key: string) {
  if (!key || key === GITOPS_ALL_INSTANCES) return GITOPS_AGENT_SPOKES;
  return GITOPS_AGENT_SPOKES.filter((a) => a.instanceKey === key);
}

export function argoInstancesForInstance(key: string) {
  if (!key || key === GITOPS_ALL_INSTANCES) return ARGO_INSTANCES;
  return ARGO_INSTANCES.filter((a) => instanceKeyOf(a) === key);
}

function instanceNs(key: string): string | null {
  if (!key || key === GITOPS_ALL_INSTANCES) return null;
  return key.split("/")[0];
}

export function settingsReposForInstance(key: string) {
  const ns = instanceNs(key);
  if (!ns) return GITOPS_SETTINGS_REPOS;
  const appNames = new Set(applicationsForInstance(key).map((a) => a.name));
  return GITOPS_SETTINGS_REPOS.filter((repo) => repo.applications === 0 || appNames.size > 0);
}

export function settingsClustersForInstance(key: string) {
  const ns = instanceNs(key);
  if (!ns) return GITOPS_SETTINGS_CLUSTERS;
  return GITOPS_SETTINGS_CLUSTERS.filter((c) => c.name === "in-cluster" || c.apps > 0);
}

export function settingsNotificationsForInstance(key: string) {
  if (!key || key === GITOPS_ALL_INSTANCES) return GITOPS_SETTINGS_NOTIFICATIONS;
  return GITOPS_SETTINGS_NOTIFICATIONS;
}

export function settingsRolloutManagersForInstance(key: string) {
  const ns = instanceNs(key);
  if (!ns) return GITOPS_SETTINGS_ROLLOUT_MANAGERS;
  return GITOPS_SETTINGS_ROLLOUT_MANAGERS.filter((m) => m.ns === ns);
}

export function settingsNamespacesForInstance(key: string) {
  const ns = instanceNs(key);
  if (!ns) return GITOPS_SETTINGS_NAMESPACES;
  return GITOPS_SETTINGS_NAMESPACES.filter((n) => n.name === ns || n.name.includes("gitops"));
}

export function settingsAnalysisTemplatesForInstance(key: string) {
  const ns = instanceNs(key);
  if (!ns) return GITOPS_SETTINGS_ANALYSIS_TEMPLATES;
  return GITOPS_SETTINGS_ANALYSIS_TEMPLATES.filter((t) => t.ns === ns);
}

export function settingsNotificationHistoryForInstance(key: string) {
  if (!key || key === GITOPS_ALL_INSTANCES) return GITOPS_NOTIFICATION_HISTORY;
  const appNames = new Set(applicationsForInstance(key).map((a) => a.name));
  return GITOPS_NOTIFICATION_HISTORY.filter((h) => appNames.has(h.resource));
}

export function applicationMetricsCharts(rec: ApplicationRecord) {
  const outOfSync = rec.sync === "OutOfSync";
  return {
    syncRate: [
      { t: "0h", v: outOfSync ? 82 : 96 },
      { t: "4h", v: outOfSync ? 85 : 97 },
      { t: "8h", v: outOfSync ? 88 : 98 },
      { t: "12h", v: outOfSync ? 86 : 99 },
      { t: "16h", v: outOfSync ? 84 : 99 },
      { t: "20h", v: outOfSync ? 87 : 98 },
      { t: "24h", v: outOfSync ? 91 : 99 },
    ],
    reconciliations: [
      { t: "0h", v: 12 },
      { t: "4h", v: 18 },
      { t: "8h", v: 15 },
      { t: "12h", v: 22 },
      { t: "16h", v: 19 },
      { t: "20h", v: 24 },
      { t: "24h", v: 21 },
    ],
  };
}

export const GITOPS_EXPERIMENTS: ExperimentRecord[] = [
  {
    name: "rollout-canary-api-analysis-1",
    rolloutNs: "argocd",
    rolloutName: "rollout-canary-api",
    phase: "Successful",
    duration: "4m12s",
    metrics: "success-rate 99.1% · latency p99 82ms",
    metricSeries: [
      { name: "success-rate", value: "99.1%", status: "pass" },
      { name: "latency-p99", value: "82ms", status: "pass" },
    ],
  },
  {
    name: "rollout-canary-api-experiment-web",
    rolloutNs: "argocd",
    rolloutName: "rollout-canary-api",
    phase: "Running",
    duration: "1m40s",
    metrics: "error-rate 0.4% · cpu 42%",
    metricSeries: [
      { name: "error-rate", value: "0.4%", status: "pass" },
      { name: "cpu", value: "42%", status: "pass" },
    ],
  },
  {
    name: "rollout-bluegreen-pre-promote",
    rolloutNs: "argocd",
    rolloutName: "rollout-bluegreen",
    phase: "Failed",
    duration: "2m05s",
    metrics: "success-rate 71% · error-rate 8.2%",
    metricSeries: [
      { name: "success-rate", value: "71%", status: "fail" },
      { name: "error-rate", value: "8.2%", status: "fail" },
    ],
  },
];

export function experimentDetailPath(ns: string, rollout: string, experiment: string) {
  return `/gitops/ns/${encodeURIComponent(ns)}/rollouts/${encodeURIComponent(rollout)}/experiments/${encodeURIComponent(experiment)}`;
}

export function findExperiment(rolloutNs: string, rolloutName: string, experimentName: string) {
  return GITOPS_EXPERIMENTS.find(
    (e) => e.rolloutNs === rolloutNs && e.rolloutName === rolloutName && e.name === experimentName
  );
}

export function findAgentSpoke(ns: string, name: string) {
  return GITOPS_AGENT_SPOKES.find((a) => a.ns === ns && a.name === name);
}

/** HPUX-1431 — sync error clarity on Application detail. */
export function applicationSyncError(app: ApplicationRecord) {
  if (app.sync !== "OutOfSync") return null;
  if (app.name === "payments-api") {
    return {
      title: "Live manifest differs from desired revision",
      detail:
        "Deployment/payments-api image tag is 1.4.1 but Git specifies 1.4.2. Auto-sync is disabled — review diff or sync manually.",
      agentHint: "If this app targets a spoke cluster, verify the connected agent is healthy before retrying sync.",
    };
  }
  return {
    title: "Application is out of sync",
    detail: "One or more resources differ from the desired state in Git.",
  };
}

export type RecentOperation = {
  name: string;
  ns: string;
  phase: "Succeeded" | "Failed" | "Running";
  message: string;
  finished: string;
};

export const GITOPS_RECENT_OPERATIONS: RecentOperation[] = [
  {
    name: "team-b-guestbook",
    ns: "team-b-gitops",
    phase: "Succeeded",
    message: "successfully synced (all tasks run)",
    finished: "97d ago",
  },
  {
    name: "rollouts-demo",
    ns: "argocd",
    phase: "Succeeded",
    message: "successfully synced (all tasks run)",
    finished: "12d ago",
  },
  {
    name: "payments-api",
    ns: "argocd",
    phase: "Failed",
    message: "ComparisonError: live manifest differs from desired",
    finished: "21m ago",
  },
];

export function recentOperationsForInstance(key: string) {
  if (!key || key === GITOPS_ALL_INSTANCES) return GITOPS_RECENT_OPERATIONS;
  const apps = new Set(applicationsForInstance(key).map((a) => `${a.ns}/${a.name}`));
  return GITOPS_RECENT_OPERATIONS.filter((op) => apps.has(`${op.ns}/${op.name}`));
}

export const GITOPS_SETTINGS_REPOS = [
  {
    url: "https://github.com/argoproj/argocd-example-apps.git",
    type: "git",
    name: "argocd-example-apps",
    applications: 2,
    status: "Public",
  },
  {
    url: "https://gitlab.example.com/payments/payments-api.git",
    type: "git",
    name: "payments-api",
    applications: 1,
    status: "Private",
  },
  {
    url: "https://charts.example.com",
    type: "helm",
    name: "helm-charts",
    applications: 0,
    status: "Public",
  },
];

export const GITOPS_SETTINGS_CLUSTERS = [
  { name: "in-cluster", server: "https://kubernetes.default.svc", status: "Healthy" as const, apps: 4 },
  { name: "spoke-east", server: "https://api.spoke-east.example.com", status: "Healthy" as const, apps: 1 },
  { name: "edge-lab", server: "https://api.edge-lab.example.com", status: "Degraded" as const, apps: 0 },
];

export const GITOPS_SETTINGS_NOTIFICATIONS = [
  { name: "slack-platform", type: "slack", trigger: "on-sync-failed", destination: "#gitops-alerts" },
  { name: "email-payments", type: "email", trigger: "on-health-degraded", destination: "payments-oncall@example.com" },
];

export const GITOPS_SETTINGS_ROLLOUT_MANAGERS = [
  { name: "openshift-gitops", ns: "openshift-gitops", status: "Healthy" as const, rollouts: 8 },
  { name: "team-b", ns: "team-b-gitops", status: "Healthy" as const, rollouts: 1 },
];

export const GITOPS_SETTINGS_NAMESPACES = [
  { name: "team-b-gitops", apps: 1, managed: true },
  { name: "argocd", apps: 2, managed: true },
  { name: "openshift-gitops", apps: 1, managed: true },
  { name: "demo-workloads", apps: 1, managed: false },
];

export const GITOPS_SETTINGS_ANALYSIS_TEMPLATES = [
  { name: "success-rate", ns: "argocd", provider: "prometheus", age: "12d" },
  { name: "error-rate", ns: "team-b-gitops", provider: "prometheus", age: "30d" },
];

export const GITOPS_NOTIFICATION_HISTORY = [
  { when: "2h ago", channel: "slack-platform", event: "SyncFailed", resource: "payments-api", result: "Delivered" },
  { when: "1d ago", channel: "email-payments", event: "HealthDegraded", resource: "payments-api", result: "Delivered" },
  { when: "4d ago", channel: "slack-platform", event: "SyncSucceeded", resource: "rollouts-demo", result: "Delivered" },
];

export const gitopsDetailPath = (
  kind:
    | "rollouts"
    | "applications"
    | "applicationsets"
    | "argocd"
    | "appprojects"
    | "imageupdaters"
    | "agents"
    | "promotions",
  ns: string,
  name: string
) => `/gitops/ns/${encodeURIComponent(ns)}/${kind}/${encodeURIComponent(name)}`;

export function findRollout(ns: string, name: string) {
  return GITOPS_ROLLOUTS.find((r) => r.ns === ns && r.name === name);
}

export function findApplication(ns: string, name: string) {
  return GITOPS_APPLICATIONS.find((a) => a.ns === ns && a.name === name);
}

/** Applications whose destination targets the given namespace. */
export function applicationsForNamespace(ns: string) {
  const suffix = ` / ${ns}`;
  return GITOPS_APPLICATIONS.filter(
    (a) => a.ns === ns || a.destination.includes(ns) || a.destination.endsWith(suffix)
  );
}

export function findApplicationSet(ns: string, name: string) {
  const prototype = findPrototypeApplicationSet(ns, name);
  if (prototype) return prototype;
  return GITOPS_APPLICATION_SETS.find((a) => a.ns === ns && a.name === name);
}

export function findArgoCd(ns: string, name: string) {
  return ARGO_INSTANCES.find((a) => a.ns === ns && a.name === name);
}

export function findAppProject(ns: string, name: string) {
  return GITOPS_APP_PROJECTS.find((p) => p.ns === ns && p.name === name);
}

export function findImageUpdater(ns: string, name: string) {
  return GITOPS_IMAGE_UPDATERS.find((u) => u.ns === ns && u.name === name);
}

export function findPromotionPipeline(ns: string, name: string) {
  return GITOPS_PROMOTION_PIPELINES.find((p) => p.ns === ns && p.name === name);
}

export type DomainAction = "Promote" | "Full Promote" | "Abort" | "Retry" | "Restart";

type LivePatch = {
  status?: GitOpsHealth;
  message?: string;
  busy?: boolean;
  promoted?: boolean;
};

const liveByKey = new Map<string, LivePatch>();
const listeners = new Set<() => void>();

const keyOf = (ns: string, name: string) => `${ns}/${name}`;

export function subscribeGitOpsLive(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emitLive() {
  listeners.forEach((fn) => fn());
}

export function getRolloutLive(ns: string, name: string): LivePatch {
  return liveByKey.get(keyOf(ns, name)) ?? {};
}

export function patchRolloutLive(ns: string, name: string, patch: LivePatch) {
  const prev = liveByKey.get(keyOf(ns, name)) ?? {};
  liveByKey.set(keyOf(ns, name), { ...prev, ...patch });
  const seed = findRollout(ns, name);
  if (seed && patch.status) seed.status = patch.status;
  emitLive();
}

export function effectiveRolloutStatus(ns: string, name: string, seed?: GitOpsHealth): GitOpsHealth {
  return getRolloutLive(ns, name).status ?? seed ?? findRollout(ns, name)?.status ?? "Healthy";
}

export function actionStateFor(
  ns: string,
  name: string,
  seed?: GitOpsHealth,
  permission: "edit" | "view" | "no-access" = "edit"
) {
  const live = getRolloutLive(ns, name);
  const status = effectiveRolloutStatus(ns, name, seed);
  const busy = !!live.busy;
  const canEdit = permission === "edit";
  const paused = status === "Paused";
  const scalingDown = status === "Degraded" || status === "Aborting";
  const healthy = status === "Healthy";
  const progressing = status === "Progressing";
  return {
    status,
    message: live.message ?? "",
    busy,
    promoted: !!live.promoted,
    scalingDown,
    promote: canEdit && !busy && paused,
    fullPromote: canEdit && !busy && paused,
    abort: canEdit && !busy && (paused || progressing),
    retry: canEdit && !busy && scalingDown,
    restart: canEdit && !busy && healthy,
  };
}

export function applyDomainAction(
  action: DomainAction,
  ns: string,
  name: string,
  permission: "edit" | "view" | "no-access" = "edit"
) {
  if (permission === "view") return "View-only: action blocked.";
  if (permission === "no-access") return "Access denied.";
  if (action === "Promote" || action === "Full Promote") {
    patchRolloutLive(ns, name, {
      busy: true,
      promoted: true,
      status: "Progressing",
      message: action === "Full Promote" ? "Full promote in progress…" : "Promoting preview to stable…",
    });
    window.setTimeout(() => {
      patchRolloutLive(ns, name, {
        busy: false,
        status: "Healthy",
        message: `${action} completed — Rollout is Healthy`,
      });
    }, 1600);
    return `${action} started`;
  }
  if (action === "Abort") {
    patchRolloutLive(ns, name, {
      busy: true,
      status: "Degraded",
      message: "Aborting — scaling down preview…",
    });
    window.setTimeout(() => {
      patchRolloutLive(ns, name, {
        busy: false,
        status: "Healthy",
        promoted: false,
        message: "Abort complete — stable revision remains active",
      });
    }, 1600);
    return "Abort started";
  }
  if (action === "Restart") {
    patchRolloutLive(ns, name, { busy: true, status: "Progressing", message: "Restarting rollout…" });
    window.setTimeout(() => {
      patchRolloutLive(ns, name, {
        busy: false,
        status: "Paused",
        message: "Restart complete — awaiting promote",
      });
    }, 1600);
    return "Restart started";
  }
  patchRolloutLive(ns, name, { busy: true, status: "Progressing", message: "Retrying rollout step…" });
  window.setTimeout(() => {
    patchRolloutLive(ns, name, {
      busy: false,
      status: "Paused",
      message: "Retry complete — paused for promote",
    });
  }, 1600);
  return "Retry started";
}
