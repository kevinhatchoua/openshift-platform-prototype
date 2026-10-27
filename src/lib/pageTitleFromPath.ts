import {
  ADMINISTRATION_SUB,
  AGENTIC_RUNS_SUB,
  BUILDS_SUB,
  COMPUTE_SUB,
  ECOSYSTEM_SUB,
  GITOPS_SUB,
  HOME_SUB,
  NETWORKING_SUB,
  OBSERVE_SUB,
  STORAGE_SUB,
  USER_MANAGEMENT_SUB,
  VIRTUALIZATION_SUB,
  WORKLOADS_SUB,
  type SubNavEntry,
} from "../app/navigation/consoleNav";

const EXTRA_PATH_TITLES: Record<string, string> = {
  "/favorites": "Favorites",
  "/user-preferences": "User preferences",
  "/alerts": "Alerts",
  "/inventory": "Cluster inventory",
};

function collectNavTitles(groups: SubNavEntry[][]): Map<string, string> {
  const map = new Map<string, string>();
  for (const group of groups) {
    for (const entry of group) {
      if (entry === "separator") continue;
      map.set(entry.path, entry.label);
    }
  }
  return map;
}

const PATH_TITLES = collectNavTitles([
  HOME_SUB,
  ECOSYSTEM_SUB,
  WORKLOADS_SUB,
  GITOPS_SUB,
  NETWORKING_SUB,
  STORAGE_SUB,
  BUILDS_SUB,
  OBSERVE_SUB,
  VIRTUALIZATION_SUB,
  COMPUTE_SUB,
  AGENTIC_RUNS_SUB,
  USER_MANAGEMENT_SUB,
  ADMINISTRATION_SUB,
]);

for (const [path, label] of Object.entries(EXTRA_PATH_TITLES)) {
  PATH_TITLES.set(path, label);
}

/** Fallback when the page heading is not yet in the DOM (or missing). */
export function pageTitleFromPath(pathname: string): string {
  const path = pathname.replace(/\/+$/, "") || "/";
  const exact = PATH_TITLES.get(path);
  if (exact) return exact;

  if (path.endsWith("/create")) {
    const parent = path.replace(/\/create$/, "");
    const parentLabel = PATH_TITLES.get(parent);
    if (parentLabel) return `Create ${parentLabel}`;
    return "Create";
  }

  const segments = path.split("/").filter(Boolean);
  if (segments.length >= 2) {
    const listPath = `/${segments.slice(0, -1).join("/")}`;
    const listLabel = PATH_TITLES.get(listPath);
    const last = decodeURIComponent(segments[segments.length - 1]!);
    if (listLabel) return last;
  }

  if (segments.length === 1) {
    const single = PATH_TITLES.get(`/${segments[0]}`);
    if (single) return single;
  }

  const lastSegment = decodeURIComponent(segments[segments.length - 1] ?? "");
  return lastSegment || "Overview";
}
