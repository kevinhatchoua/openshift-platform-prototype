import { useParams } from "react-router";
import GitOpsOperatorDetailView from "../gitops/GitOpsOperatorDetailView";
import OlmV1ExtensionDetailView from "./OlmV1ExtensionDetailView";
import { getPrototypeInstalledOperator, isOlmV1ExtensionOperatorName } from "./installedOperatorsLookup";
import InstalledCatalogOperatorDetailPage from "./InstalledCatalogOperatorDetailPage";
import type { CatalogOperator } from "./installedOperatorsTypes";

/** Demo fallback when navigating to a non-fixture operator id (Abot screenshots 1–5). */
export const ABOT_DEMO_CATALOG_OPERATOR: CatalogOperator = {
  name: "Abot Operator",
  namespace: "bap",
  version: "3.0.0",
  channel: "stable-4.5",
  source: "certified-operators",
  status: "Running",
  autoUpdate: false,
  clusterCompatibility: "Compatible",
  packageName: "abot-operator",
  isOlmV1Extension: true,
  updateAvailable: "3.1.0",
  managedNamespaces: ["bap"],
};

export default function OperatorDetailPage() {
  const { operatorId, operatorName } = useParams();
  const decodedOperatorName = decodeURIComponent(operatorName ?? operatorId ?? "");
  const catalogOperator = getPrototypeInstalledOperator(decodedOperatorName);

  if (catalogOperator && !catalogOperator.isOlmV1Extension) {
    return <InstalledCatalogOperatorDetailPage operator={catalogOperator} />;
  }

  if (isOlmV1ExtensionOperatorName(decodedOperatorName)) {
    if (decodedOperatorName.toLowerCase().includes("gitops")) {
      return <GitOpsOperatorDetailView operatorName={decodedOperatorName} />;
    }
    return <OlmV1ExtensionDetailView operatorName={decodedOperatorName} />;
  }

  return <OlmV1ExtensionDetailView operatorName={ABOT_DEMO_CATALOG_OPERATOR.name} />;
}
