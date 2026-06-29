import { NetworkingEmptyState, NetworkingPageShell } from "./networkingShared";

export default function PhysicalNetworksPage() {
  return (
    <NetworkingPageShell title="Physical networks" path="/networking/physical-networks" createLabel="Create network">
      <NetworkingEmptyState
        title="No physical networks defined yet"
        description="A physical network establishes a specific network configuration on cluster nodes. To get started, create a physical network."
        createLabel="Create network"
      />
    </NetworkingPageShell>
  );
}
