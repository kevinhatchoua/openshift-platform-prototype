import { useLocation } from "react-router";
import ClassicOlmOperatorDetailView from "./ClassicOlmOperatorDetailView";
import type { CatalogOperator } from "./installedOperatorsTypes";

type InstalledCatalogOperatorDetailPageProps = {
  operator: CatalogOperator;
};

export default function InstalledCatalogOperatorDetailPage({
  operator,
}: InstalledCatalogOperatorDetailPageProps) {
  const location = useLocation();
  const initialTab = location.pathname.endsWith("/subscription") ? "subscription" : "details";

  return <ClassicOlmOperatorDetailView operator={operator} initialTab={initialTab} />;
}
