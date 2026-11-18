import { Link, useLocation } from "react-router";
import { Alert, Button, Content } from "@patternfly/react-core";
import {
  NMSTATE_OPERATOR_CATALOG_ENTRY,
  NMSTATE_OPERATOR_INSTALL_PATH,
} from "../../constants/networkingNmstate";

type NmStateCapabilityInlineAlertProps = {
  /** What the user cannot do without the operator (e.g. assign interfaces). */
  actionLabel?: string;
  className?: string;
};

export default function NmStateCapabilityInlineAlert({
  actionLabel = "assign or remove host interfaces",
  className,
}: NmStateCapabilityInlineAlertProps) {
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  const installState = {
    ...NMSTATE_OPERATOR_CATALOG_ENTRY,
    installKind: "subscription" as const,
    namespace: "openshift-nmstate",
    returnTo,
    returnLabel: "Networking topology",
  };

  return (
    <Alert
      isInline
      variant="info"
      title="Kubernetes NMState Operator is not installed"
      className={className}
    >
      <Content component="p">
        Connections shown here are read-only from cluster discovery. Install the operator to {actionLabel}, apply
        NodeNetworkConfigurationPolicy resources, and observe live interface state on nodes.
      </Content>
      <Button
        variant="link"
        isInline
        component={Link}
        to={NMSTATE_OPERATOR_INSTALL_PATH}
        state={installState}
        className="pf-v6-u-mt-sm"
      >
        Install operator
      </Button>
    </Alert>
  );
}