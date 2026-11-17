import { Link, useLocation } from "react-router";
import {
  Button,
  Content,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateVariant,
} from "@patternfly/react-core";
import CubesIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon";
import {
  NMSTATE_OPERATOR_CATALOG_ENTRY,
  NMSTATE_OPERATOR_INSTALL_PATH,
} from "../../constants/networkingNmstate";

type NmStateOperatorBlockedStateProps = {
  /** Short label for the surface that is blocked (e.g. Topology). */
  surfaceName: string;
  compact?: boolean;
};

export default function NmStateOperatorBlockedState({
  surfaceName,
  compact = false,
}: NmStateOperatorBlockedStateProps) {
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;

  const installState = {
    ...NMSTATE_OPERATOR_CATALOG_ENTRY,
    installKind: "subscription" as const,
    namespace: "openshift-nmstate",
    returnTo,
    returnLabel: surfaceName,
  };

  return (
    <div
      className={`ocs-nmstate-blocked${compact ? " ocs-nmstate-blocked--compact" : ""}`}
      data-ouia-component-id="nmstate-operator-blocked"
    >
      <EmptyState
        variant={compact ? EmptyStateVariant.sm : EmptyStateVariant.lg}
        titleText="Kubernetes NMState Operator is not installed"
        headingLevel="h2"
        icon={CubesIcon}
      >
        <EmptyStateBody>
          <Content component="p">
            {surfaceName} needs the Kubernetes NMState Operator to report node network state and apply
            NodeNetworkConfigurationPolicy resources. This is not a permissions issue: the operator is missing from
            the cluster.
          </Content>
          <Content component="p">
            Install the operator here instead of searching OperatorHub or the Software Catalog separately.
          </Content>
        </EmptyStateBody>
        <EmptyStateFooter>
          <EmptyStateActions>
            <Button
              variant="primary"
              component={Link}
              to={NMSTATE_OPERATOR_INSTALL_PATH}
              state={installState}
            >
              Install operator
            </Button>
            <Button
              variant="link"
              component={Link}
              to="/ecosystem/software-catalog"
              state={{ highlightCatalogId: NMSTATE_OPERATOR_CATALOG_ENTRY.id }}
            >
              View in Software Catalog
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      </EmptyState>
    </div>
  );
}