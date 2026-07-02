import { Content } from "@patternfly/react-core";
import OVToolsTopologyStage from "./OVToolsTopologyStage";
import { NetworkingPageShell } from "./networkingShared";

export default function NetworkTopologyPage() {
  return (
    <NetworkingPageShell
      title="Topology"
      path="/networking/topology"
      extraHeader={
        <Content component="p" className="ocs-net-topo-page-desc">
          OVTools-style infrastructure topology. Explore node, VM, network, and storage relationships with drill-down,
          filters, and persistent view state — aligned with{" "}
          <a href="https://github.com/linuxelitebr/ovtools-release" target="_blank" rel="noopener noreferrer">
            OpenShift Virtualization Tools
          </a>
          .
        </Content>
      }
    >
      <OVToolsTopologyStage />
    </NetworkingPageShell>
  );
}
