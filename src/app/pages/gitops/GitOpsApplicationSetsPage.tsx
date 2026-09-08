import { GitOpsSimpleListPage } from "./GitOpsSimpleListPage";
import GitOpsApplicationSetDetailRich from "./GitOpsApplicationSetDetailRich";
import { applicationSetsForInstance } from "./gitopsData";
import { useGitOpsInstance } from "./GitOpsPageHeader";
import { HealthStatus } from "./gitopsShared";

export default function GitOpsApplicationSetsPage() {
  const { instance } = useGitOpsInstance();
  return (
    <GitOpsSimpleListPage
      title="ApplicationSets"
      path="/gitops/applicationsets"
      createLabel="Create ApplicationSet"
      kind="ApplicationSet"
      detailKind="applicationsets"
      items={applicationSetsForInstance(instance)}
      columns={[
        { key: "name", label: "Name" },
        { key: "namespace", label: "Namespace" },
        { key: "generators", label: "Generators" },
        { key: "apps", label: "Applications" },
        { key: "age", label: "Age" },
        { key: "status", label: "Status" },
      ]}
      renderCell={(item, key) => {
        if (key === "generators") return item.generators;
        if (key === "apps") return item.apps;
        if (key === "age") return item.age;
        if (key === "status") return <HealthStatus status={item.status} />;
        return null;
      }}
      footnote="ApplicationSet topology graph: Topology tab on ApplicationSet detail (HPUX-1942)."
    />
  );
}

export function GitOpsApplicationSetDetailPage() {
  return <GitOpsApplicationSetDetailRich />;
}
