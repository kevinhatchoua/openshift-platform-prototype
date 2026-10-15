import type { DemoPermission } from "../../contexts/PrototypeDemoContext";

/** Mirrors console SSAR: lifecycle actions render only when the user can mutate the extension. */
export function canManageOlmV1ClusterExtension(permission: DemoPermission): boolean {
  return permission === "edit";
}
