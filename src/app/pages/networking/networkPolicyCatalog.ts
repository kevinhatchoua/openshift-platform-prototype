import { useSyncExternalStore } from "react";

export type PolicyKind = "NetworkPolicy" | "MultiNetworkPolicy";

export type PolicyRule = {
  direction: "Ingress" | "Egress";
  peer: string;
  ports: string;
  effect: "Allow" | "Deny";
};

export type PolicyCondition = {
  type: string;
  status: "True" | "False";
  reason: string;
  message: string;
};

export type NetworkPolicyRecord = {
  id: string;
  name: string;
  namespace: string;
  kind: PolicyKind;
  podSelector: string;
  matchExpressions: { key: string; operator: string; values: string }[];
  policyTypes: ("Ingress" | "Egress")[];
  affectedPods: number;
  nads: { namespace: string; name: string }[];
  conditions: PolicyCondition[];
  rules: PolicyRule[];
  /** Prototype throughput used for the 5.2 heat encoding. */
  trafficMbps: number;
  source: "Manual" | "NSX-T migration";
  chain: string[];
  /** Actionable configuration error. Expected and actual are both shown. */
  mismatch?: {
    title: string;
    object: string;
    layer: string;
    expected: string;
    actual: string;
  };
};

const SEED: NetworkPolicyRecord[] = [
  {
    id: "np:prod-frontend:allow-frontend-to-api",
    name: "allow-frontend-to-api",
    namespace: "prod-frontend",
    kind: "NetworkPolicy",
    podSelector: "app=api",
    matchExpressions: [],
    policyTypes: ["Ingress"],
    affectedPods: 12,
    nads: [],
    conditions: [
      {
        type: "Accepted",
        status: "True",
        reason: "Applied",
        message: "OVN applied this policy on the primary network.",
      },
    ],
    rules: [
      { direction: "Ingress", peer: "namespace=prod-frontend, app=frontend", ports: "TCP/8080", effect: "Allow" },
    ],
    trafficMbps: 840,
    source: "Manual",
    chain: ["br-int", "worker-0"],
  },
  {
    id: "np:staging:default-deny-ingress",
    name: "default-deny-ingress",
    namespace: "staging",
    kind: "NetworkPolicy",
    podSelector: "all pods",
    matchExpressions: [],
    policyTypes: ["Ingress"],
    affectedPods: 28,
    nads: [],
    conditions: [
      {
        type: "Accepted",
        status: "True",
        reason: "Isolation",
        message: "Pods in staging accept no ingress except later allow policies.",
      },
    ],
    rules: [{ direction: "Ingress", peer: "no peers", ports: "all", effect: "Deny" }],
    trafficMbps: 12,
    source: "Manual",
    chain: ["staging namespace", "primary network"],
  },
  {
    id: "mnp:tenant-a:migrated-nsx-web",
    name: "migrated-nsx-web",
    namespace: "tenant-a",
    kind: "MultiNetworkPolicy",
    podSelector: "tier=web",
    matchExpressions: [{ key: "tier", operator: "In", values: "web" }],
    policyTypes: ["Ingress", "Egress"],
    affectedPods: 6,
    nads: [{ namespace: "tenant-a", name: "localnet-rzpi1d" }],
    conditions: [
      {
        type: "Ready",
        status: "False",
        reason: "MTUMismatch",
        message: "Secondary network MTU does not match the translated NSX-T segment.",
      },
    ],
    rules: [
      { direction: "Ingress", peer: "ipBlock 10.20.0.0/24", ports: "TCP/443", effect: "Allow" },
      { direction: "Egress", peer: "tier=db", ports: "TCP/5432", effect: "Allow" },
    ],
    trafficMbps: 2200,
    source: "NSX-T migration",
    chain: ["localnet-rzpi1d", "br-int", "br-ex", "ens5", "worker-0"],
    mismatch: {
      title: "MTU mismatch on migrated web segment",
      object: "NAD localnet-rzpi1d",
      layer: "Secondary network attachment",
      expected: "1500",
      actual: "9000",
    },
  },
  {
    id: "mnp:tenant-a:migrated-nsx-db",
    name: "migrated-nsx-db",
    namespace: "tenant-a",
    kind: "MultiNetworkPolicy",
    podSelector: "tier=db",
    matchExpressions: [{ key: "tier", operator: "In", values: "db" }],
    policyTypes: ["Ingress"],
    affectedPods: 3,
    nads: [{ namespace: "tenant-a", name: "localnet-secondary" }],
    conditions: [
      {
        type: "Ready",
        status: "True",
        reason: "Applied",
        message: "Policy is applied on the secondary network.",
      },
    ],
    rules: [{ direction: "Ingress", peer: "tier=web", ports: "TCP/5432", effect: "Allow" }],
    trafficMbps: 460,
    source: "NSX-T migration",
    chain: ["localnet-secondary", "br-int", "ens5", "worker-0"],
  },
];

type PolicyStoreState = {
  created: NetworkPolicyRecord[];
  patches: Record<string, NetworkPolicyRecord>;
  deleted: string[];
};

const STORAGE_KEY = "ocs-np-mnp-store";
const listeners = new Set<() => void>();
let revision = 0;

function emptyState(): PolicyStoreState {
  return { created: [], patches: {}, deleted: [] };
}

function load(): PolicyStoreState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as PolicyStoreState;
    return {
      created: parsed.created ?? [],
      patches: parsed.patches ?? {},
      deleted: parsed.deleted ?? [],
    };
  } catch {
    return emptyState();
  }
}

let state = load();
let snapshot: NetworkPolicyRecord[] = [];

function computePolicies(): NetworkPolicyRecord[] {
  const byId = new Map<string, NetworkPolicyRecord>();
  for (const policy of SEED) {
    byId.set(policy.id, state.patches[policy.id] ?? policy);
  }
  for (const policy of state.created) byId.set(policy.id, policy);
  for (const id of state.deleted) byId.delete(id);
  return [...byId.values()];
}

snapshot = computePolicies();

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* sessionStorage unavailable */
  }
  snapshot = computePolicies();
  revision += 1;
  listeners.forEach((listener) => listener());
}

export function subscribeNetworkPolicies(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getNetworkPolicyRevision(): number {
  return revision;
}

export function listNetworkPolicies(): NetworkPolicyRecord[] {
  return snapshot;
}

export function useNetworkPolicies(): NetworkPolicyRecord[] {
  return useSyncExternalStore(subscribeNetworkPolicies, listNetworkPolicies, listNetworkPolicies);
}

export function findNetworkPolicy(namespace: string, name: string): NetworkPolicyRecord | undefined {
  return listNetworkPolicies().find((policy) => policy.namespace === namespace && policy.name === name);
}

export function policyDetailPath(policy: Pick<NetworkPolicyRecord, "namespace" | "name">): string {
  return `/networking/networkpolicies/${encodeURIComponent(policy.namespace)}/${encodeURIComponent(policy.name)}`;
}

export function policyEditPath(policy: Pick<NetworkPolicyRecord, "namespace" | "name">): string {
  return `${policyDetailPath(policy)}/edit`;
}

export function saveNetworkPolicy(policy: NetworkPolicyRecord) {
  const isSeed = SEED.some((item) => item.id === policy.id);
  if (isSeed) {
    state = { ...state, patches: { ...state.patches, [policy.id]: policy } };
  } else {
    const created = state.created.some((item) => item.id === policy.id)
      ? state.created.map((item) => (item.id === policy.id ? policy : item))
      : [...state.created, policy];
    state = { ...state, created };
  }
  persist();
}

export function deleteNetworkPolicy(id: string) {
  state = {
    ...state,
    deleted: state.deleted.includes(id) ? state.deleted : [...state.deleted, id],
    created: state.created.filter((item) => item.id !== id),
  };
  persist();
}

export function cloneNetworkPolicy(policy: NetworkPolicyRecord): NetworkPolicyRecord {
  const name = uniqueName(policy.namespace, `${policy.name}-copy`);
  const clone: NetworkPolicyRecord = {
    ...policy,
    id: `${policy.kind === "NetworkPolicy" ? "np" : "mnp"}:${policy.namespace}:${name}`,
    name,
    source: "Manual",
    mismatch: undefined,
    conditions: [
      {
        type: "Accepted",
        status: "True",
        reason: "Cloned",
        message: `Cloned from ${policy.name}. Review selectors before relying on this policy.`,
      },
    ],
  };
  saveNetworkPolicy(clone);
  return clone;
}

function uniqueName(namespace: string, base: string): string {
  const taken = new Set(
    listNetworkPolicies()
      .filter((policy) => policy.namespace === namespace)
      .map((policy) => policy.name)
  );
  if (!taken.has(base)) return base;
  let index = 2;
  while (taken.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

export function policiesTouching(label: string | undefined): NetworkPolicyRecord[] {
  if (!label) return [];
  const needle = label.toLowerCase();
  return listNetworkPolicies().filter(
    (policy) =>
      policy.chain.some((step) => step.toLowerCase().includes(needle)) ||
      policy.nads.some((nad) => nad.name.toLowerCase() === needle) ||
      policy.podSelector.toLowerCase().includes(needle)
  );
}

export function heatLevel(mbps: number): "Low" | "Medium" | "High" {
  if (mbps >= 1000) return "High";
  if (mbps >= 200) return "Medium";
  return "Low";
}

export function policyYaml(policy: NetworkPolicyRecord): string {
  const apiVersion = policy.kind === "NetworkPolicy" ? "networking.k8s.io/v1" : "k8s.ovn.org/v1";
  const expressions = policy.matchExpressions
    .map(
      (expression) =>
        `      - key: ${expression.key}\n        operator: ${expression.operator}\n        values: [${expression.values}]`
    )
    .join("\n");
  const selector = expressions
    ? `  podSelector:\n    matchExpressions:\n${expressions}`
    : `  podSelector:\n    matchLabels:\n      ${policy.podSelector.includes("=") ? policy.podSelector.replace("=", ": ") : "app: " + policy.name}`;
  const nadAnnotation =
    policy.nads.length > 0
      ? `  annotations:\n    k8s.v1.cni.cncf.io/policy-for: ${policy.nads.map((nad) => `${nad.namespace}/${nad.name}`).join(",")}\n`
      : "";
  return `apiVersion: ${apiVersion}
kind: ${policy.kind}
metadata:
  name: ${policy.name}
  namespace: ${policy.namespace}
${nadAnnotation}spec:
${selector}
  policyTypes:
${policy.policyTypes.map((type) => `    - ${type}`).join("\n")}`;
}

export const POLICY_TEMPLATES: { id: string; label: string; policy: Omit<NetworkPolicyRecord, "id"> }[] = [
  {
    id: "deny-ingress",
    label: "Deny all ingress",
    policy: {
      name: "deny-all-ingress",
      namespace: "default",
      kind: "NetworkPolicy",
      podSelector: "all pods",
      matchExpressions: [],
      policyTypes: ["Ingress"],
      affectedPods: 0,
      nads: [],
      conditions: [],
      rules: [{ direction: "Ingress", peer: "no peers", ports: "all", effect: "Deny" }],
      trafficMbps: 0,
      source: "Manual",
      chain: [],
    },
  },
  {
    id: "allow-namespace",
    label: "Allow from same namespace",
    policy: {
      name: "allow-same-namespace",
      namespace: "default",
      kind: "NetworkPolicy",
      podSelector: "app=example",
      matchExpressions: [],
      policyTypes: ["Ingress"],
      affectedPods: 0,
      nads: [],
      conditions: [],
      rules: [{ direction: "Ingress", peer: "same namespace", ports: "TCP/8080", effect: "Allow" }],
      trafficMbps: 0,
      source: "Manual",
      chain: [],
    },
  },
  {
    id: "mnp-nad",
    label: "MultiNetworkPolicy for a secondary NAD",
    policy: {
      name: "secondary-allow",
      namespace: "tenant-a",
      kind: "MultiNetworkPolicy",
      podSelector: "tier=web",
      matchExpressions: [{ key: "tier", operator: "In", values: "web" }],
      policyTypes: ["Ingress", "Egress"],
      affectedPods: 0,
      nads: [{ namespace: "tenant-a", name: "localnet-secondary" }],
      conditions: [],
      rules: [{ direction: "Ingress", peer: "tier=app", ports: "TCP/8080", effect: "Allow" }],
      trafficMbps: 0,
      source: "Manual",
      chain: ["NAD localnet-secondary"],
    },
  },
];
