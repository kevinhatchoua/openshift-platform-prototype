import type { CatalogOperator } from "./installedOperatorsTypes";

const MIGRATION_ELIGIBLE_SCALE_OPERATOR_NAMES = [
  "OpenShift Virtualization",
  "Advanced Cluster Management",
  "OpenShift Data Foundation",
  "OpenShift Pipelines",
  "MetalLB Operator",
  "External Secrets Operator",
  "OpenShift Serverless",
  "Quay Registry Operator",
  "Cost Management Metrics",
  "Node Feature Discovery Operator",
  "OpenShift Sandboxed Containers",
  "Loki Operator",
  "Tempo Operator",
  "OpenShift Logging",
  "Red Hat OpenShift Distributed Tracing",
  "OpenShift Service Mesh",
  "Crunchy Postgres Operator",
  "MongoDB Community Operator",
  "Vault Secrets Operator",
  "Keycloak Operator",
  "Rook-Ceph Operator",
  "OpenShift Dev Spaces",
  "OpenShift GitOps Operator",
  "Argo CD Operator",
  "Grafana Operator",
  "Prometheus Operator",
  "Thanos Operator",
  "OpenShift AI",
  "NFD GPU Operator",
  "SR-IOV Network Operator",
] as const;

function buildMigrationEligibleScaleOperators(): CatalogOperator[] {
  const channels = ["stable", "stable-v1", "fast", "alpha", "release-2.12"] as const;
  const sources = ["redhat-operators", "community-operators"] as const;

  return MIGRATION_ELIGIBLE_SCALE_OPERATOR_NAMES.map((name, index) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const major = 1 + (index % 4);
    const minor = index % 10;
    const patch = (index * 3) % 20;
    const version = `${major}.${minor}.${patch}`;
    const channel = channels[index % channels.length];
    const source = sources[index % sources.length];
    const namespace = `olm-migrate-${slug.slice(0, 28)}`;

    return {
      name,
      namespace,
      version,
      channel,
      source,
      status: "Running" as const,
      autoUpdate: index % 3 !== 0,
      clusterCompatibility: "Compatible" as const,
      supportLifecycle: {
        fullSupportEndDate: "2027-06-01",
        maintenanceEndDate: "2028-06-01",
        eus1EndDate: "2029-06-01",
        eus2EndDate: "2030-06-01",
        eus3EndDate: "2031-06-01",
        eolEndDate: "2031-06-01",
      },
      maxOcpVersion: "5.2",
      lastUpdated: `May ${(index % 28) + 1}, 2026, ${(index % 12) + 1}:${String(
        (index * 7) % 60,
      ).padStart(2, "0")} AM`,
      managedNamespaces: [namespace],
      olmMigrationEligibility: "eligible" as const,
    };
  });
}

/** Additional prototype operators for lifecycle / ELC / compatibility scenarios. */
const BASE_ADDITIONAL_CATALOG_OPERATORS: CatalogOperator[] = [
  {
    name: "OpenShift Virtualization",
    namespace: "openshift-cnv",
    version: "4.17.5",
    channel: "stable",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2027-06-01",
      maintenanceEndDate: "2028-06-01",
      eus1EndDate: "2029-06-01",
      eus2EndDate: "2030-06-01",
      eus3EndDate: "2031-06-01",
      eolEndDate: "2031-06-01",
    },
    maxOcpVersion: "5.2",
    lastUpdated: "May 10, 2026, 11:20 AM",
    managedNamespaces: ["openshift-cnv", "kubevirt"],
    olmMigrationEligibility: "eligible",
  },
  {
    name: "Advanced Cluster Management",
    namespace: "open-cluster-management",
    version: "2.17.3",
    channel: "release-2.17",
    packageName: "advanced-cluster-management",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2026-01-15",
      maintenanceEndDate: "2026-07-20",
      eus1EndDate: "2027-07-20",
      eus2EndDate: "2028-07-20",
      eus3EndDate: "2029-07-20",
      eolEndDate: "2029-07-20",
    },
    maxOcpVersion: "5.2",
    lastUpdated: "Oct 26, 2026, 2:55 PM",
    managedNamespaces: ["open-cluster-management", "multicluster-engine"],
    olmMigrationEligibility: "eligible",
  },
  {
    name: "OpenShift Data Foundation",
    namespace: "openshift-storage",
    version: "4.17.0",
    channel: "stable-4.17",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2025-12-01",
      maintenanceEndDate: "2026-06-01",
      eus1EndDate: "2027-06-01",
      eus2EndDate: "2028-06-01",
      eus3EndDate: "2029-06-01",
      eolEndDate: "2029-06-01",
    },
    maxOcpVersion: "5.2",
    lastUpdated: "Mar 28, 2026, 2:10 PM",
    managedNamespaces: ["openshift-storage"],
    olmMigrationEligibility: "eligible",
  },
  {
    name: "Node Tuning Operator",
    namespace: "openshift-cluster-node-tuning-operator",
    version: "5.0.0",
    channel: "stable",
    source: "Built-in",
    status: "Running",
    autoUpdate: true,
    isPlatformAligned: true,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2025-08-01",
      maintenanceEndDate: "2026-04-01",
      eus1EndDate: "2026-10-01",
      eus2EndDate: "2027-10-01",
      eus3EndDate: "2028-10-01",
      eolEndDate: "2028-10-01",
    },
    lastUpdated: "Mar 1, 2026, 3:48 AM",
    managedNamespaces: ["openshift-cluster-node-tuning-operator"],
  },
  {
    name: "NVIDIA GPU Operator",
    namespace: "nvidia-gpu-operator",
    version: "24.9.0",
    channel: "stable",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: true,
    isHpbuOwned: false,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2025-06-01",
      maintenanceEndDate: "2026-02-01",
      eus1EndDate: "2026-08-01",
      eus2EndDate: "2027-08-01",
      eus3EndDate: "2027-12-01",
      eolEndDate: "2028-01-01",
    },
    lastUpdated: "Feb 14, 2026, 6:30 PM",
    managedNamespaces: ["nvidia-gpu-operator", "nvidia-gpu"],
  },
  {
    name: "Compliance Operator",
    namespace: "openshift-compliance",
    version: "1.5.0",
    channel: "stable",
    source: "redhat-operators",
    status: "Degraded",
    autoUpdate: false,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2024-06-01",
      maintenanceEndDate: "2025-01-01",
      eus1EndDate: "2025-06-01",
      eus2EndDate: "2025-10-01",
      eus3EndDate: "2026-01-01",
      eolEndDate: "2026-02-01",
    },
    updateAvailable: "1.6.0",
    lastUpdated: "Jan 5, 2026, 9:00 AM",
    managedNamespaces: ["openshift-compliance"],
  },
  {
    name: "File Integrity Operator",
    namespace: "openshift-file-integrity",
    version: "1.3.0",
    channel: "stable",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2025-09-01",
      maintenanceEndDate: "2026-09-01",
      eolEndDate: "2027-09-01",
    },
    lastUpdated: "May 1, 2026, 10:15 AM",
    managedNamespaces: ["openshift-file-integrity"],
    olmMigrationEligibility: "eligible",
  },
  {
    name: "OpenShift Pipelines",
    namespace: "openshift-pipelines-operator",
    version: "1.17.0",
    channel: "pipelines-1.17",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2027-03-01",
      maintenanceEndDate: "2028-03-01",
      eus1EndDate: "2029-03-01",
      eus2EndDate: "2030-03-01",
      eus3EndDate: "2031-03-01",
      eolEndDate: "2031-03-01",
    },
    maxOcpVersion: "5.2",
    lastUpdated: "May 12, 2026, 1:40 PM",
    managedNamespaces: ["openshift-pipelines", "tekton-pipelines"],
    olmMigrationEligibility: "eligible",
  },
  {
    name: "MetalLB Operator",
    namespace: "metallb-system",
    version: "4.17.0",
    channel: "stable",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2026-02-01",
      maintenanceEndDate: "2026-08-15",
      eus1EndDate: "2027-08-15",
      eus2EndDate: "2028-08-15",
      eus3EndDate: "2029-08-15",
      eolEndDate: "2029-08-15",
    },
    lastUpdated: "Apr 18, 2026, 4:55 PM",
    managedNamespaces: ["metallb-system"],
    olmMigrationEligibility: "eligible",
  },
  {
    name: "External Secrets Operator",
    namespace: "external-secrets-operator",
    version: "0.10.0",
    channel: "stable",
    source: "community-operators",
    status: "Running",
    autoUpdate: true,
    isHpbuOwned: false,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2025-11-01",
      maintenanceEndDate: "2026-05-01",
      eus1EndDate: "2027-05-01",
      eus2EndDate: "2028-05-01",
      eus3EndDate: "2029-05-01",
      eolEndDate: "2029-05-01",
    },
    lastUpdated: "May 3, 2026, 7:22 AM",
    managedNamespaces: ["external-secrets-operator"],
    olmMigrationEligibility: "eligible",
  },
  {
    name: "Red Hat Integration (Camel K)",
    namespace: "redhat-camel-k",
    version: "2.5.0",
    channel: "stable",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: false,
    clusterCompatibility: "Incompatible",
    compatibilityMessage: "Requires cluster update to 5.2 before operator upgrade.",
    supportLifecycle: {
      fullSupportEndDate: "2024-01-01",
      maintenanceEndDate: "2024-12-01",
      eolEndDate: "2025-06-01",
    },
    updateAvailable: "2.6.0",
    maxOcpVersion: "5.0",
    lastUpdated: "Oct 8, 2025, 3:30 PM",
    managedNamespaces: ["redhat-camel-k"],
  },
  {
    name: "Strimzi Kafka",
    namespace: "strimzi-kafka-operator",
    version: "0.43.0",
    channel: "stable",
    source: "community-operators",
    status: "Degraded",
    autoUpdate: false,
    isHpbuOwned: false,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2026-03-01",
      maintenanceEndDate: "2027-03-01",
      eus1EndDate: "2028-03-01",
      eus2EndDate: "2029-03-01",
      eus3EndDate: "2030-03-01",
      eolEndDate: "2030-03-01",
    },
    lastUpdated: "May 15, 2026, 9:08 AM",
    managedNamespaces: ["strimzi-kafka-operator", "kafka"],
  },
  {
    name: "OpenShift Serverless",
    namespace: "openshift-serverless",
    version: "1.34.0",
    channel: "stable",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2027-12-01",
      maintenanceEndDate: "2028-12-01",
      eus1EndDate: "2029-12-01",
      eus2EndDate: "2030-12-01",
      eus3EndDate: "2031-12-01",
      eolEndDate: "2031-12-01",
    },
    maxOcpVersion: "5.2",
    lastUpdated: "May 16, 2026, 2:00 PM",
    managedNamespaces: ["openshift-serverless", "knative-serving"],
    olmMigrationEligibility: "eligible",
  },
  {
    name: "Quay Registry Operator",
    namespace: "quay-operator",
    version: "3.12.0",
    channel: "stable",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: true,
    isPlatformAligned: true,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2026-01-01",
      maintenanceEndDate: "2026-07-01",
      eus1EndDate: "2027-07-01",
      eus2EndDate: "2028-07-01",
      eus3EndDate: "2029-07-01",
      eolEndDate: "2029-07-01",
    },
    lastUpdated: "Apr 30, 2026, 5:18 PM",
    managedNamespaces: ["quay-operator", "quay-enterprise"],
    olmMigrationEligibility: "eligible",
  },
  {
    name: "Cost Management Metrics",
    namespace: "costmanagement-metrics-operator",
    version: "3.2.0",
    channel: "stable",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2025-07-01",
      maintenanceEndDate: "2026-03-01",
      eus1EndDate: "2026-09-01",
      eus2EndDate: "2027-09-01",
      eus3EndDate: "2028-09-01",
      eolEndDate: "2028-09-01",
    },
    lastUpdated: "May 8, 2026, 12:05 PM",
    managedNamespaces: ["costmanagement-metrics-operator"],
    olmMigrationEligibility: "eligible",
  },
  {
    name: "OpenShift API Management",
    namespace: "3scale",
    version: "2.14.0",
    channel: "threescale-2.14",
    source: "redhat-operators",
    status: "Pending",
    autoUpdate: false,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2025-04-01",
      maintenanceEndDate: "2026-04-01",
      eus1EndDate: "2027-04-01",
      eus2EndDate: "2028-04-01",
      eus3EndDate: "2029-04-01",
      eolEndDate: "2029-04-01",
    },
    lastUpdated: "May 17, 2026, 8:30 AM",
    managedNamespaces: ["3scale", "apicast-production"],
    olmMigrationEligibility: "eligible",
  },
];

const MIGRATION_ELIGIBLE_SCALE_OPERATORS = buildMigrationEligibleScaleOperators();

/** Names already defined in BASE_ADDITIONAL or INITIAL_CATALOG_OPERATORS — skip duplicates in scale set. */
const EXISTING_OPERATOR_NAMES = new Set(
  BASE_ADDITIONAL_CATALOG_OPERATORS.map((op) => op.name),
);

export const ADDITIONAL_CATALOG_OPERATORS: CatalogOperator[] = [
  ...BASE_ADDITIONAL_CATALOG_OPERATORS,
  ...MIGRATION_ELIGIBLE_SCALE_OPERATORS.filter((op) => !EXISTING_OPERATOR_NAMES.has(op.name)),
];

const CLUSTER_EXTENSION_OPERATOR_NAMES = [
  "Argo CD",
  "Prometheus Operator",
  "cert-manager",
  "Elastic Cloud on Kubernetes",
  "Vault Operator",
  "Grafana Operator",
  "OpenTelemetry Operator",
  "Loki Operator",
  "Tempo Operator",
  "Thanos Operator",
  "Knative Operator",
  "Submariner",
  "NVIDIA GPU Operator",
  "Node Health Check Operator",
  "File Integrity Operator",
] as const;

/** Prototype error rows for Cluster extensions tab — Troubleshoot with AI (row Actions). */
const CLUSTER_EXTENSION_ERROR_FIXTURES: Partial<
  Record<(typeof CLUSTER_EXTENSION_OPERATOR_NAMES)[number], Partial<CatalogOperator>>
> = {
  "Vault Operator": {
    status: "Degraded",
    olmMigrationActivity: "error",
    olmMigrationActivityDetail:
      "ClusterExtension install strategy failed: catalog bundle unpack error (digest mismatch).",
    olmClusterExtensionMigration: {
      installedCondition: "False",
      migrationPhase: "InstallFailed",
      rollbackState: "None",
      lastTransitionTime: "2026-03-09T18:40:00Z",
      message: "install strategy completed with errors",
    },
  },
  "Loki Operator": {
    status: "Degraded",
    updateAvailable: "2.7.6",
    olmMigrationActivity: "failed_manual",
    olmMigrationActivityDetail:
      "Subscription reconcile stalled after version bump; operand pods not ready in managed namespace.",
    olmClusterExtensionMigration: {
      installedCondition: "False",
      migrationPhase: "ReconcileError",
      rollbackState: "ManualRequired",
      lastTransitionTime: "2026-03-11T09:12:00Z",
      message: "0/3 operand pods ready",
    },
  },
  Submariner: {
    status: "Degraded",
    olmMigrationActivity: "incomplete",
    olmMigrationActivityDetail: "Cluster extension reported incomplete recovery; gateway DaemonSet not scheduled.",
    compatibilityMessage: "Operand health check failed on one or more nodes (prototype).",
  },
  "File Integrity Operator": {
    status: "Degraded",
    updateAvailable: "3.2.2",
    olmMigrationActivity: "failed_rollback",
    olmMigrationActivityDetail: "Automatic rollback did not restore prior ClusterServiceVersion reference.",
    olmClusterExtensionMigration: {
      installedCondition: "Unknown",
      migrationPhase: "RollbackFailed",
      rollbackState: "Failed",
      lastTransitionTime: "2026-03-08T22:05:00Z",
      message: "rollback to previous bundle version timed out",
    },
  },
  "Elastic Cloud on Kubernetes": {
    status: "Degraded",
    updateAvailable: "1.3.7",
    olmMigrationActivity: "error",
    olmMigrationActivityDetail: "Elasticsearch operand CR failed validation after extension upgrade.",
  },
};

function buildClusterExtensionOperators(): CatalogOperator[] {
  const channels = ["stable", "alpha", "fast", "preview"] as const;
  const sources = ["redhat-operators", "community-operators", "certified-operators"] as const;

  return CLUSTER_EXTENSION_OPERATOR_NAMES.map((name, index) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const major = 1 + (index % 3);
    const minor = index % 12;
    const patch = (index * 2) % 9;
    const namespace = `ce-${slug.slice(0, 24)}`;

    const version = `${major}.${minor}.${patch}`;
    const updateAvailable =
      index % 4 === 0 ? `${major}.${minor}.${patch + 1}` : index % 5 === 0 ? `${major}.${minor + 1}.0` : undefined;

    const errorFixture = CLUSTER_EXTENSION_ERROR_FIXTURES[name];
    const defaultStatus: CatalogOperator["status"] =
      index % 13 === 6 ? "Pending" : "Running";

    return {
      name,
      namespace,
      version,
      channel: channels[index % channels.length],
      source: sources[index % sources.length],
      status: errorFixture?.status ?? defaultStatus,
      autoUpdate: index % 4 !== 0,
      clusterCompatibility: index % 7 === 0 ? "Incompatible" : "Compatible",
      updateAvailable,
      compatibilityMessage:
        index % 7 === 0 ? "Cluster extension compatibility check failed (prototype)." : undefined,
      lastUpdated: `Mar ${(index % 27) + 1}, 2026, ${(index % 11) + 8}:${String((index * 5) % 60).padStart(2, "0")} AM`,
      managedNamespaces: [namespace],
      isOlmV1Extension: true,
      packageName: slug,
      versionRange: `>=${major}.${minor}.0 <${major}.${minor + 2}.0`,
      maxOcpVersion: "5.2",
      ...errorFixture,
    };
  });
}

/** Fifteen additional OLM v1 cluster extensions for the Installed Operators next-gen tab. */
export const CLUSTER_EXTENSION_PROTOTYPE_OPERATORS: CatalogOperator[] = buildClusterExtensionOperators();
