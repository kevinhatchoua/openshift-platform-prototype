export type OperatorCatalogInstallState = {
  id: string;
  name: string;
  provider: string;
  channel?: string;
  version?: string;
};

export function readOperatorCatalogInstallState(
  operatorId: string | undefined,
  locationState: unknown,
): OperatorCatalogInstallState {
  const fromNav = locationState as OperatorCatalogInstallState | null;
  if (fromNav?.name && fromNav?.provider) {
    return {
      id: fromNav.id ?? operatorId ?? "operator",
      name: fromNav.name,
      provider: fromNav.provider,
      channel: fromNav.channel,
      version: fromNav.version,
    };
  }

  const fallbacks: Record<string, Pick<OperatorCatalogInstallState, "name" | "provider">> = {
    "business-automation": { name: "Business Automation", provider: "Red Hat" },
    "abot-operator": { name: "Abot Operator", provider: "Refactz Technologies" },
    postgresql: { name: "PostgreSQL Operator", provider: "CrunchyData" },
    "argocd-operator-v1": { name: "Argo CD", provider: "Argo Project" },
    argocd: { name: "Argo CD", provider: "Argo Project" },
    "cert-manager-v1": { name: "cert-manager", provider: "Jetstack" },
  };

  const fallback = operatorId ? fallbacks[operatorId] : undefined;
  return {
    id: operatorId ?? "operator",
    name: fallback?.name ?? "Operator",
    provider: fallback?.provider ?? "Red Hat",
    channel: "stable",
    version: "2.16.0",
  };
}
