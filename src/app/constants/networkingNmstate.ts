import type { OperatorCatalogInstallState } from "../pages/ecosystem/operatorCatalogInstallState";

export const NMSTATE_OPERATOR_CATALOG_ID = "kubernetes-nmstate-operator";

export const NMSTATE_OPERATOR_CATALOG_ENTRY: Pick<
  OperatorCatalogInstallState,
  "id" | "name" | "provider" | "channel" | "version"
> = {
  id: NMSTATE_OPERATOR_CATALOG_ID,
  name: "Kubernetes NMState Operator",
  provider: "Red Hat",
  channel: "stable",
  version: "4.19.0",
};

export const NMSTATE_OPERATOR_INSTALL_PATH = `/ecosystem/software-catalog/${NMSTATE_OPERATOR_CATALOG_ID}/install`;

export type NetworkingNmstateScenario = "installed" | "missing-operator";