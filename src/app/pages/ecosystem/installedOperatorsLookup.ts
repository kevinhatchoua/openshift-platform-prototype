import type { CatalogOperator } from "./installedOperatorsTypes";

/** Prototype lookup for Installed Operators detail/update flows (subset of list fixture). */
const PROTOTYPE_INSTALLED_OPERATORS: CatalogOperator[] = [
  {
    name: "OpenShift GitOps (cluster extension)",
    namespace: "openshift-gitops-operator",
    version: "1.12.0",
    channel: "gitops-1.12",
    source: "redhat-operators",
    status: "Running",
    autoUpdate: true,
    clusterCompatibility: "Compatible",
    supportLifecycle: {
      fullSupportEndDate: "2025-06-01",
      maintenanceEndDate: "2026-05-01",
      eus1EndDate: "2027-05-01",
      eus2EndDate: "2028-05-01",
      eus3EndDate: "2029-05-01",
      eolEndDate: "2029-05-01",
    },
    maxOcpVersion: "5.2",
    lastUpdated: "Jun 12, 2025, 4:02 PM",
    managedNamespaces: ["openshift-gitops"],
    isOlmV1Extension: true,
    updateAvailable: "1.13.0",
    olmMigrationEligibility: "migrated",
    olmClusterExtensionMigration: {
      installedCondition: "True",
      migrationPhase: "Succeeded",
      rollbackState: "NotApplicable",
      lastTransitionTime: "Jun 12, 2025, 4:02 PM",
      message:
        "State is read from the ClusterExtension CR. If the console restarts during migration, progress is recovered from the cluster.",
    },
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
    isUnsupported: true,
    lastUpdated: "Jun 11, 2025, 9:15 AM",
    managedNamespaces: ["observability-sample"],
    isOlmV1Extension: true,
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
    lastUpdated: "Mar 18, 2026, 2:05 AM",
    managedNamespaces: ["cert-manager", "cert-manager-operator"],
    olmMigrationEligibility: "eligible",
    olmMigrationActivity: "failed_manual",
    olmMigrationActivityDetail:
      "Migration failed after point of no return. ClusterExtension reports FailedManualRecovery; review CRDs and operand secrets.",
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
    lastUpdated: "Dec 20, 2025, 9:15 AM",
    managedNamespaces: ["kiali-operator", "istio-system"],
    olmMigrationEligibility: "eligible",
    olmMigrationActivity: "failed_rollback",
    olmMigrationActivityDetail:
      "Migration failed before point of no return. Library rolled management back to Classic Operators automatically.",
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
    lastUpdated: "Feb 12, 2026, 4:32 AM",
    managedNamespaces: ["openshift-operators-redhat"],
    olmMigrationEligibility: "eligible",
    olmMigrationActivity: "migrating",
    olmMigrationActivityDetail: "Creating ClusterObjectSet and waiting for ClusterExtension Installed=True.",
  },
];

export function getPrototypeInstalledOperator(name: string): CatalogOperator | undefined {
  const decoded = decodeURIComponent(name);
  return PROTOTYPE_INSTALLED_OPERATORS.find(
    (op) => op.name === decoded || op.name === name,
  );
}

export function isOlmV1ExtensionOperatorName(name: string): boolean {
  const op = getPrototypeInstalledOperator(name);
  return op?.isOlmV1Extension === true;
}
