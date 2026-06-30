import { Content } from "@patternfly/react-core";
import { useToast } from "../../contexts/ToastContext";
import NodeNetworkConfigurationStage from "./NodeNetworkConfigurationStage";
import { NetworkingPageShell } from "./networkingShared";

export default function NetworkTopologyPage() {
  const { pushToast, dismissToast } = useToast();

  return (
    <NetworkingPageShell
      title="Topology"
      path="/networking/topology"
      extraHeader={
        <Content component="p" className="ocs-net-topo-page-desc">
          Visualize, scale, and manage your cluster topology. Right-click the canvas to add nodes, or manage worker
          node groups from the toolbar.
        </Content>
      }
    >
      <NodeNetworkConfigurationStage pushToast={pushToast} dismissToast={dismissToast} />
    </NetworkingPageShell>
  );
}
