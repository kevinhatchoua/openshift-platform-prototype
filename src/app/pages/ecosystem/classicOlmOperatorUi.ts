import type { CatalogOperator } from "./installedOperatorsTypes";

export type ClassicProvidedApi = {
  kind: string;
  abbrev: string;
  description: string;
  createDisabled?: boolean;
};

export type ClassicOperatorChrome = {
  displayName: string;
  provider: string;
  iconKind: string;
  operandTabTitle: string;
  providedApis: ClassicProvidedApi[];
  maintainerEmail: string;
  documentationUrl?: string;
};

function catalogSourceToProvider(source: string): string {
  if (source === "redhat-operators") return "Red Hat";
  if (source === "community-operators") return "Community";
  if (source === "certified-operators") return "Certified";
  return source;
}

const ACM_LIKE_APIS: ClassicProvidedApi[] = [
  {
    kind: "MultiClusterHub",
    abbrev: "MCH",
    description:
      "MultiClusterHub is the Custom Resource for installing and managing Red Hat Advanced Cluster Management for Kubernetes.",
  },
];

const DEFAULT_APIS = (name: string): ClassicProvidedApi[] => [
  {
    kind: name.split(" ")[0] ?? "Operator",
    abbrev: "OP",
    description: `Custom resource API exposed by ${name}.`,
  },
  {
    kind: "Subscription",
    abbrev: "SUB",
    description: "OLM Subscription for this operator package.",
    createDisabled: true,
  },
];

export function getClassicOperatorChrome(operator: CatalogOperator): ClassicOperatorChrome {
  const provider = catalogSourceToProvider(operator.source);

  if (operator.name === "Cert Manager" || operator.name.includes("Cluster Management")) {
    return {
      displayName: operator.name.includes("Cluster Management")
        ? "Advanced Cluster Management for Kubernetes"
        : operator.name,
      provider,
      iconKind: "MultiClusterHub",
      operandTabTitle: "MultiClusterHub",
      providedApis: ACM_LIKE_APIS,
      maintainerEmail: "acm-contact@redhat.com",
      documentationUrl:
        "https://docs.redhat.com/en/documentation/red_hat_advanced_cluster_management_for_kubernetes/2.17/html/install/installing",
    };
  }

  if (operator.name === "Kiali Operator") {
    return {
      displayName: operator.name,
      provider,
      iconKind: "Kiali",
      operandTabTitle: "Kiali",
      providedApis: [
        {
          kind: "Kiali",
          abbrev: "K",
          description: "Kiali is a management console for Istio service mesh.",
        },
      ],
      maintainerEmail: "kiali-dev@redhat.com",
    };
  }

  return {
    displayName: operator.name,
    provider,
    iconKind: operator.packageName ?? operator.name,
    operandTabTitle: "Operands",
    providedApis: DEFAULT_APIS(operator.name),
    maintainerEmail: "openshift-operators@redhat.com",
  };
}
