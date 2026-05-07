/**
 * Red Hat OpenShift Operator support phases and dates.
 * @see https://access.redhat.com/support/policy/updates/openshift_operators
 */

export const RH_OPERATOR_LC_DOC_URL =
  "https://access.redhat.com/support/policy/updates/openshift_operators";

/** OpenShift cluster (OCP) version support policy — use with operator dates in context. */
export const RH_OPENSHIFT_CLUSTER_LIFECYCLE_URL =
  "https://access.redhat.com/support/policy/updates/openshift";

/** Product / life cycle lookup (Customer Portal). */
export const RH_PRODUCT_LIFE_CYCLES_URL = "https://access.redhat.com/product-life-cycles";

export type SupportPhase =
  | "Full Support"
  | "Maintenance"
  | "EUS1"
  | "EUS2"
  | "EUS3"
  | "End of life"
  | "Unsupported";

export type OperatorSupportLifecycle = {
  /** Red Hat “Full support ends” for this operator version line. */
  fullSupportEndDate?: string;
  /** Red Hat “Maintenance ends”. */
  maintenanceEndDate?: string;
  eus1EndDate?: string;
  eus2EndDate?: string;
  eus3EndDate?: string;
  /** Final end of support (EOL). If omitted with no EUS, defaults to maintenance end for comparisons. */
  eolEndDate?: string;
};

/** Parses prototype date strings like "Nov 13, 2025" reliably across environments. */
export function parseSupportEndDateMs(supportEndDate?: string): number | undefined {
  if (!supportEndDate || supportEndDate === "—") return undefined;
  const trimmed = supportEndDate.trim();
  let parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) return parsed;
  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime())) return d.getTime();
  const mdy = trimmed.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/);
  if (mdy) {
    parsed = Date.parse(`${mdy[1]} ${mdy[2]}, ${mdy[3]}`);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    parsed = Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return parsed;
  }
  return undefined;
}

export function formatLifecycleDateShort(raw?: string): string {
  if (!raw || raw === "—") return "—";
  const ms = parseSupportEndDateMs(raw);
  if (ms === undefined) return raw;
  return new Date(ms).toLocaleDateString("en-US", { dateStyle: "medium" });
}

export function getDerivedSupportPhase(
  op: Pick<{ supportLifecycle?: OperatorSupportLifecycle; isUnsupported?: boolean }, "supportLifecycle" | "isUnsupported">,
  nowMs: number = Date.now()
): SupportPhase {
  if (op.isUnsupported) return "Unsupported";
  const L = op.supportLifecycle;
  if (!L) return "Unsupported";

  const m = (s?: string) => parseSupportEndDateMs(s);
  const full = m(L.fullSupportEndDate);
  const maint = m(L.maintenanceEndDate);
  const e1 = m(L.eus1EndDate);
  const e2 = m(L.eus2EndDate);
  const e3 = m(L.eus3EndDate);
  const eol = m(L.eolEndDate ?? L.maintenanceEndDate);

  if (eol !== undefined && nowMs >= eol) return "End of life";
  if (full !== undefined && nowMs < full) return "Full Support";
  if (maint !== undefined && nowMs < maint) return "Maintenance";

  const hasEus = e1 !== undefined || e2 !== undefined || e3 !== undefined;
  if (!hasEus) {
    if (maint !== undefined && nowMs >= maint) return "End of life";
    return "Maintenance";
  }

  if (e1 !== undefined && nowMs < e1) return "EUS1";
  if (e2 !== undefined && nowMs < e2) return "EUS2";
  if (e3 !== undefined && nowMs < e3) return "EUS3";

  return "End of life";
}

export function getPhaseBadgeType(phase: SupportPhase): "success" | "warning" | "danger" {
  switch (phase) {
    case "Full Support":
    case "EUS1":
      return "success";
    case "Maintenance":
    case "EUS2":
    case "EUS3":
      return "warning";
    case "End of life":
    case "Unsupported":
      return "danger";
    default:
      return "success";
  }
}

export function getSupportLifecycleSortTimestamp(op: {
  isUnsupported?: boolean;
  supportLifecycle?: OperatorSupportLifecycle;
}): number {
  if (op.isUnsupported) return Number.MAX_SAFE_INTEGER - 2;
  const L = op.supportLifecycle;
  if (!L) return Number.MAX_SAFE_INTEGER - 1;
  const eol = parseSupportEndDateMs(L.eolEndDate ?? L.maintenanceEndDate);
  if (eol !== undefined) return eol;
  return Number.MAX_SAFE_INTEGER - 1;
}

/** Maps lifecycle phase to PatternFly Label `status` (semantic color + icon). */
export function getPhaseLabelStatus(phase: SupportPhase): "success" | "warning" | "danger" {
  switch (phase) {
    case "Full Support":
    case "EUS1":
      return "success";
    case "Maintenance":
    case "EUS2":
    case "EUS3":
      return "warning";
    case "End of life":
    case "Unsupported":
      return "danger";
    default:
      return "success";
  }
}

/**
 * Raw published date string for when the operator’s current {@link getDerivedSupportPhase} ends
 * (full support end, maintenance end, EUS milestone, or final EOL as applicable).
 */
export function getCurrentPhaseEndDateRaw(
  op: Pick<{ supportLifecycle?: OperatorSupportLifecycle; isUnsupported?: boolean }, "supportLifecycle" | "isUnsupported">,
  nowMs: number = Date.now()
): string | undefined {
  if (op.isUnsupported) return undefined;
  const L = op.supportLifecycle;
  if (!L) return undefined;
  const phase = getDerivedSupportPhase(op, nowMs);
  switch (phase) {
    case "Full Support":
      return L.fullSupportEndDate;
    case "Maintenance":
      return L.maintenanceEndDate;
    case "EUS1":
      return L.eus1EndDate;
    case "EUS2":
      return L.eus2EndDate;
    case "EUS3":
      return L.eus3EndDate;
    case "End of life":
      return L.eolEndDate ?? L.maintenanceEndDate;
    case "Unsupported":
    default:
      return undefined;
  }
}

/** Timestamp for sorting the “Support phase end date” column; missing dates sort last (asc). */
export function getCurrentPhaseEndSortTimestamp(op: {
  isUnsupported?: boolean;
  isOlmV1Extension?: boolean;
  supportLifecycle?: OperatorSupportLifecycle;
}): number {
  if (op.isOlmV1Extension) return Number.MAX_SAFE_INTEGER - 1;
  const raw = getCurrentPhaseEndDateRaw(op);
  const ms = raw ? parseSupportEndDateMs(raw) : undefined;
  return ms ?? Number.MAX_SAFE_INTEGER;
}

/** Rows for a PatternFly DescriptionList (policy-aligned labels). */
export function getSupportLifecycleDateEntries(op: {
  isUnsupported?: boolean;
  supportLifecycle?: OperatorSupportLifecycle;
}): { term: string; description: string }[] {
  if (op.isUnsupported) return [];
  const L = op.supportLifecycle;
  if (!L) return [];

  const rows: { term: string; description: string }[] = [];
  if (L.fullSupportEndDate) {
    rows.push({ term: "Full support ends", description: formatLifecycleDateShort(L.fullSupportEndDate) });
  }
  if (L.maintenanceEndDate) {
    rows.push({ term: "Maintenance ends", description: formatLifecycleDateShort(L.maintenanceEndDate) });
  }
  if (L.eus1EndDate) rows.push({ term: "EUS1 ends", description: formatLifecycleDateShort(L.eus1EndDate) });
  if (L.eus2EndDate) rows.push({ term: "EUS2 ends", description: formatLifecycleDateShort(L.eus2EndDate) });
  if (L.eus3EndDate) rows.push({ term: "EUS3 ends", description: formatLifecycleDateShort(L.eus3EndDate) });
  const eol = L.eolEndDate ?? L.maintenanceEndDate;
  if (eol) {
    rows.push({ term: "End of life (no further support)", description: formatLifecycleDateShort(eol) });
  }
  return rows;
}
