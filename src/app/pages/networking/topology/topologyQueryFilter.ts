import type { NetResource } from "../networkTopologyData";
import type { StandaloneTopologyResource } from "../networkTopologyData";
import type { WorkloadAttachment } from "./topologyPerspective";

export type QueryField =
  | "source"
  | "destination"
  | "endpoint"
  | "namespace"
  | "kind"
  | "ip"
  | "mac"
  | "icmp"
  | "name";

export type QueryOperator = "equals" | "not_equals" | "contains";

export type QueryLogic = "and" | "or";

export type QueryEndpointScope = "a" | "b" | "either";

export type TopologyQueryClause = {
  id: string;
  field: QueryField;
  operator: QueryOperator;
  value: string;
  endpoint?: QueryEndpointScope;
};

export type TopologyQueryState = {
  logic: QueryLogic;
  clauses: TopologyQueryClause[];
  rawQuery: string;
};

export const QUERY_FIELD_OPTIONS: { id: QueryField; label: string; indexed?: boolean }[] = [
  { id: "source", label: "Source", indexed: true },
  { id: "destination", label: "Destination", indexed: true },
  { id: "endpoint", label: "Endpoint", indexed: true },
  { id: "namespace", label: "Namespace", indexed: true },
  { id: "kind", label: "Kind", indexed: true },
  { id: "name", label: "Name", indexed: true },
  { id: "ip", label: "IP" },
  { id: "mac", label: "MAC" },
  { id: "icmp", label: "ICMP" },
];

export const QUERY_OPERATOR_OPTIONS: { id: QueryOperator; label: string }[] = [
  { id: "equals", label: "equals" },
  { id: "not_equals", label: "not equals" },
  { id: "contains", label: "contains" },
];

export function createEmptyQueryState(): TopologyQueryState {
  return { logic: "and", clauses: [], rawQuery: "" };
}

export function createQueryClause(field: QueryField = "namespace"): TopologyQueryClause {
  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    field,
    operator: "equals",
    value: "",
    endpoint: "either",
  };
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function compare(operator: QueryOperator, haystack: string, needle: string): boolean {
  const h = normalize(haystack);
  const n = normalize(needle);
  if (!n) return true;
  switch (operator) {
    case "equals":
      return h === n;
    case "not_equals":
      return h !== n;
    case "contains":
    default:
      return h.includes(n);
  }
}

/** Parse `field equals "value"` / `field contains value` tokens from a raw query string. */
export function parseRawQuery(raw: string): TopologyQueryClause[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const clauses: TopologyQueryClause[] = [];
  const pattern =
    /\b(source|destination|endpoint|namespace|kind|ip|mac|icmp|name)\s+(equals|not equals|contains)\s+"([^"]+)"/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(trimmed)) !== null) {
    const field = match[1].toLowerCase() as QueryField;
    const operatorToken = match[2].toLowerCase().replace(" ", "_") as QueryOperator;
    clauses.push({
      id: createQueryClause(field).id,
      field,
      operator: operatorToken,
      value: match[3],
      endpoint: field === "endpoint" || field === "namespace" ? "either" : "either",
    });
  }

  if (clauses.length === 0 && trimmed.length > 0) {
    clauses.push({
      ...createQueryClause("name"),
      operator: "contains",
      value: trimmed,
    });
  }

  return clauses;
}

export function serializeQuery(state: TopologyQueryState): string {
  if (state.clauses.length === 0) return state.rawQuery.trim();
  const parts = state.clauses
    .filter((clause) => clause.value.trim())
    .map((clause) => {
      const op = clause.operator === "not_equals" ? "not equals" : clause.operator;
      return `${clause.field} ${op} "${clause.value.trim()}"`;
    });
  if (parts.length === 0) return state.rawQuery.trim();
  return parts.join(` ${state.logic.toUpperCase()} `);
}

export type TopologyQueryTarget = {
  name: string;
  namespace?: string;
  kind?: string;
  ip?: string;
  mac?: string;
  icmp?: string;
  source?: string;
  destination?: string;
  endpoint?: string;
};

export function valuesForResource(
  resource: Pick<NetResource, "label" | "kind" | "detail">,
  extras?: { namespace?: string; ip?: string; mac?: string }
): TopologyQueryTarget {
  return {
    name: resource.label,
    kind: resource.kind,
    namespace: extras?.namespace,
    ip: extras?.ip,
    mac: extras?.mac ?? resource.detail,
    endpoint: resource.label,
    source: resource.label,
    destination: resource.label,
  };
}

export function valuesForStandalone(resource: StandaloneTopologyResource): TopologyQueryTarget {
  return {
    name: resource.label,
    kind: resource.kind,
    namespace: resource.label.includes("/") ? resource.label.split("/")[0] : undefined,
    endpoint: resource.label,
    source: resource.label,
    destination: resource.label,
  };
}

export function valuesForWorkload(attachment: WorkloadAttachment): TopologyQueryTarget {
  return {
    name: attachment.label,
    namespace: attachment.namespace,
    kind: attachment.kind,
    ip: attachment.ip,
    endpoint: attachment.namespace,
    source: attachment.namespace,
    destination: attachment.networkLabel,
  };
}

function fieldValue(target: TopologyQueryTarget, field: QueryField): string {
  switch (field) {
    case "source":
      return target.source ?? target.namespace ?? target.name;
    case "destination":
      return target.destination ?? target.name;
    case "endpoint":
      return target.endpoint ?? target.namespace ?? target.name;
    case "namespace":
      return target.namespace ?? "";
    case "kind":
      return target.kind ?? "";
    case "ip":
      return target.ip ?? "";
    case "mac":
      return target.mac ?? "";
    case "icmp":
      return target.icmp ?? "";
    case "name":
    default:
      return target.name;
  }
}

export function matchesTopologyQuery(target: TopologyQueryTarget, state: TopologyQueryState): boolean {
  const clauses =
    state.clauses.length > 0
      ? state.clauses
      : state.rawQuery.trim()
        ? parseRawQuery(state.rawQuery)
        : [];

  if (clauses.length === 0) return true;

  const results = clauses.map((clause) => compare(clause.operator, fieldValue(target, clause.field), clause.value));
  return state.logic === "or" ? results.some(Boolean) : results.every(Boolean);
}
