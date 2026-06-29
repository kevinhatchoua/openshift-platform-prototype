import { NetworkingEmptyState, NetworkingPageShell } from "./networkingShared";

export default function RoutesPage() {
  return (
    <NetworkingPageShell title="Routes" path="/networking/routes" createLabel="Create Route">
      <NetworkingEmptyState
        title="No Route found"
        description="Click Create Route to create your first Route"
        createLabel="Create Route"
        learnMoreHref="https://docs.openshift.com/container-platform/latest/networking/routes/route-configuration.html"
        learnMoreLabel="Learn more about Route"
      />
    </NetworkingPageShell>
  );
}
