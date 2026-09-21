import type { OperatorSupportLifecycle } from "@/lib/operatorSupportLifecycle";

export type OlmMigrationEligibility = "eligible" | "ineligible" | "migrated" | "conflict";

export type OlmMigrationBlocker = {
  code: string;
  title: string;
  description: string;
  resolution: string;
  actionLabel?: string;
  actionHref?: string;
};

export type OlmMigrationDemoResult = "success" | "failed" | "error" | "incomplete";

type InstalledOperator = {
  name: string;
  namespace: string;
  version: string;
  channel: string;
  source: string;
  status: "Running" | "Degraded" | "Pending";
  autoUpdate: boolean;
  clusterCompatibility: "Compatible" | "Incompatible";
  compatibilityMessage?: string;
  supportLifecycle?: OperatorSupportLifecycle;
  isHpbuOwned?: boolean;
  isPlatformAligned?: boolean;
  isUnsupported?: boolean;
  updateAvailable?: string;
  maxOcpVersion?: string;
  lastUpdated?: string;
  managedNamespaces?: string[];
};

export type CatalogOperator = InstalledOperator & {
  requiredBeforeClusterUpdate?: boolean;
  isOlmV1Extension?: boolean;
  /** OLMv0 → OLMv1 migration eligibility (OCPSTRAT-2692 prototype). */
  olmMigrationEligibility?: OlmMigrationEligibility;
  olmMigrationReason?: string;
  /** Structured blockers with resolution paths (OCPSTRAT-2692 prototype). */
  olmMigrationBlockers?: OlmMigrationBlocker[];
  /** Prototype-only simulated migration outcome for eligible operators. */
  olmMigrationDemoResult?: OlmMigrationDemoResult;
};
