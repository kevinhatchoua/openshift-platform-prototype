/** Sentinel for cluster-scoped namespace filter (impersonation requires a concrete NS). */
export const ALL_NAMESPACES = "All namespaces";

/**
 * Compact prototype map: namespace → service account names.
 * Keep this small — expand via loops/generators, never giant static literals.
 */
const SERVICE_ACCOUNTS_BY_NAMESPACE: Record<string, readonly string[]> = {
  default: ["default", "builder", "deployer"],
  "openshift-operators": ["olm-operator", "catalog-operator", "packageserver"],
  "openshift-monitoring": ["prometheus-k8s", "grafana", "alertmanager-main"],
  production: ["app-runner", "ci-bot"],
  development: ["dev-sa", "preview-runner"],
};

/** Active cluster namespaces for the Namespace typeahead. */
export const CLUSTER_NAMESPACES: readonly string[] = Object.keys(SERVICE_ACCOUNTS_BY_NAMESPACE);

/** SAs for a concrete namespace, or every unique SA when "All namespaces" is selected. */
export function getServiceAccountsForNamespace(namespace: string): string[] {
  if (!namespace || namespace === ALL_NAMESPACES) {
    return [...new Set(Object.values(SERVICE_ACCOUNTS_BY_NAMESPACE).flat())].sort();
  }
  return [...(SERVICE_ACCOUNTS_BY_NAMESPACE[namespace] ?? [])];
}

/** Resolve owning namespace for an SA when the filter is "All namespaces" (first match). */
export function resolveNamespaceForServiceAccount(
  saName: string,
  preferredNamespace?: string
): string | null {
  if (
    preferredNamespace &&
    preferredNamespace !== ALL_NAMESPACES &&
    SERVICE_ACCOUNTS_BY_NAMESPACE[preferredNamespace]?.includes(saName)
  ) {
    return preferredNamespace;
  }
  for (const [ns, sas] of Object.entries(SERVICE_ACCOUNTS_BY_NAMESPACE)) {
    if (sas.includes(saName)) {
      return ns;
    }
  }
  return null;
}

export function isConcreteNamespace(namespace: string): boolean {
  return Boolean(namespace) && namespace !== ALL_NAMESPACES;
}
