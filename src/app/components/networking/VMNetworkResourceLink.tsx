import { Link } from "react-router";
import { Button } from "@patternfly/react-core";
import {
  networkDisplayName,
  networkResourcePath,
  type VmNetworkTarget,
} from "../../pages/networking/networkingMockData";

/** Secondary network names link to NAD/UDN/CUDN detail; Pod networking stays plain text (HPUX-1766). */
export function VMNetworkResourceLink({ network }: { network: VmNetworkTarget }) {
  if (network.kind === "pod") {
    return <>{networkDisplayName(network)}</>;
  }

  return (
    <Button variant="link" isInline component={Link} to={networkResourcePath(network)}>
      {networkDisplayName(network)}
    </Button>
  );
}
