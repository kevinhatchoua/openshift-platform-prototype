/** Prototype channel catalogs for subscription edit modals and upgrade status. */

export type SubscriptionChannelCatalog = Record<string, { versions: string[] }>;

const GITOPS_CHANNEL_CATALOG: SubscriptionChannelCatalog = {
  "gitops-1.12": { versions: ["1.12.0", "1.12.2", "1.12.4"] },
  "gitops-1.11": { versions: ["1.11.0", "1.11.2"] },
};

const DEFAULT_CHANNEL_CATALOG: SubscriptionChannelCatalog = {
  stable: { versions: ["0.4.0", "0.4.1", "0.5.0"] },
  fast: { versions: ["0.5.0-rc1", "0.5.0"] },
};

export function subscriptionChannelCatalogForOperator(input: {
  channel: string;
  version: string;
  packageName?: string;
  displayName?: string;
}): SubscriptionChannelCatalog {
  const isGitops =
    input.packageName?.includes("gitops") ||
    input.channel.startsWith("gitops") ||
    (input.displayName?.toLowerCase().includes("gitops") ?? false);

  if (isGitops) {
    return GITOPS_CHANNEL_CATALOG;
  }

  const versions = uniqueSortedVersions([
    input.version,
    bumpPatch(input.version),
    bumpMinor(input.version),
  ]);

  return {
    ...DEFAULT_CHANNEL_CATALOG,
    [input.channel]: versions,
  };
}

function uniqueSortedVersions(versions: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of versions) {
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out.sort(compareSemver);
}

function bumpPatch(version: string): string {
  const parts = version.split(".").map((p) => parseInt(p, 10) || 0);
  if (parts.length < 3) parts.push(0);
  parts[2] = (parts[2] ?? 0) + 1;
  return parts.join(".");
}

function bumpMinor(version: string): string {
  const parts = version.split(".").map((p) => parseInt(p, 10) || 0);
  if (parts.length < 2) parts.push(0, 0);
  parts[1] = (parts[1] ?? 0) + 1;
  parts[2] = 0;
  return parts.join(".");
}

export function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map((p) => parseInt(p, 10) || 0);
  const pb = b.split(".").map((p) => parseInt(p, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function channelHeadVersion(catalog: SubscriptionChannelCatalog, channel: string): string {
  const versions = catalog[channel]?.versions ?? [];
  if (versions.length === 0) return "";
  return versions[versions.length - 1];
}

export type SubscriptionUpgradeStatus =
  | { kind: "up-to-date"; label: string }
  | { kind: "update-available"; label: string; targetVersion: string }
  | { kind: "newer-than-channel"; label: string };

export function computeSubscriptionUpgradeStatus(
  installedVersion: string,
  channel: string,
  catalog: SubscriptionChannelCatalog,
): SubscriptionUpgradeStatus {
  const head = channelHeadVersion(catalog, channel) || installedVersion;
  const cmp = compareSemver(installedVersion, head);
  if (cmp === 0) {
    return { kind: "up-to-date", label: "Up to date" };
  }
  if (cmp < 0) {
    return { kind: "update-available", label: "Upgrade available", targetVersion: head };
  }
  return {
    kind: "newer-than-channel",
    label: "Installed version is newer than channel head",
  };
}
