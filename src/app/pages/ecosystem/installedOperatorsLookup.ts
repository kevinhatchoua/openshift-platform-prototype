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
