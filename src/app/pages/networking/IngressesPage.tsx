import { NetworkingEmptyState, NetworkingPageShell } from "./networkingShared";

export default function IngressesPage() {
  return (
    <NetworkingPageShell title="Ingresses" path="/networking/ingresses" createLabel="Create Ingress">
      <NetworkingEmptyState
        title="No Ingress found"
        description="Click Create Ingress to create your first Ingress"
        createLabel="Create Ingress"
        learnMoreHref="https://docs.openshift.com/container-platform/latest/networking/ingress_operator.html"
        learnMoreLabel="Learn more about Ingress"
      />
    </NetworkingPageShell>
  );
}
