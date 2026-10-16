import type { DemoPermission } from "../../contexts/PrototypeDemoContext";

/**
 * Prototype: Installed Operators and extension detail always expose HPUX-2225 lifecycle
 * actions (unsubscribe, delete, edit channel/version). Production hides menu items via SSAR.
 *
 * The global demo permission switcher targets GitOps rollouts, not OLM ecosystem flows.
 */
export function canManageOlmV1ClusterExtension(_permission?: DemoPermission): boolean {
  return true;
}
