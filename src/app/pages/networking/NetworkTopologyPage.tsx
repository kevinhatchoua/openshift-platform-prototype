import { Alert, Content, Label } from "@patternfly/react-core";
import OVToolsTopologyStage from "./OVToolsTopologyStage";
import { NetworkingPageShell } from "./networkingShared";

export default function NetworkTopologyPage() {
  return (
    <NetworkingPageShell
      title="Topology"
      path="/networking/topology"
      extraHeader={
        <>
          <Alert variant="info" title="Phase 2 prototype" isInline className="pf-v6-u-mb-md">
            Topology visualization is scheduled for Phase 2 (after Phase 1 link automation). The team chose a graph
            topology over a tree view — similar to VMware vSphere port-group workflows — with simplicity prioritized for
            large clusters.
          </Alert>
          <Content component="p" className="ocs-net-topo-page-desc">
            Explore node, VM, network, and storage relationships with drill-down, filters, and collapsible NAD clusters.
            Use <strong>Network problems only</strong> to focus on degraded paths. For connected VMs, use{" "}
            <a href="/virtualization/virtualmachinenetworks">Virtual machine networks</a> (Phase 1).
          </Content>
        </>
      }
    >
      <OVToolsTopologyStage />
    </NetworkingPageShell>
  );
}
