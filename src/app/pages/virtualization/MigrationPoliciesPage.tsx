import { VirtListEmptyPanel, VirtResourceTableShell } from "./virtualizationShared";

export default function MigrationPoliciesPage() {
  return (
    <VirtResourceTableShell
      title="MigrationPolicies"
      path="/virtualization/migrationpolicies"
      createLabel="Create MigrationPolicy"
    >
      <VirtListEmptyPanel resource="MigrationPolicy" createLabel="Create MigrationPolicy" />
    </VirtResourceTableShell>
  );
}
