import { useMemo } from "react";
import { useLocation } from "react-router";
import { Content, PageSection, Title } from "@patternfly/react-core";

const LABELS: Record<string, string> = {
  "/home/projects": "Projects",
  "/home/search": "Search",
  "/home/api-explorer": "API Explorer",
  "/home/events": "Events",
  "/workloads/deploymentconfigs": "DeploymentConfigs",
  "/workloads/secrets": "Secrets",
  "/workloads/configmaps": "ConfigMaps",
  "/workloads/replicasets": "ReplicaSets",
  "/workloads/replicationcontrollers": "ReplicationControllers",
  "/workloads/horizontalpodautoscalers": "HorizontalPodAutoscalers",
  "/workloads/poddisruptionbudgets": "PodDisruptionBudgets",
  "/networking/routes": "Routes",
  "/networking/ingresses": "Ingresses",
  "/networking/networkpolicies": "NetworkPolicies",
  "/networking/userdefinednetworks": "UserDefinedNetworks",
  "/storage/persistentvolumeclaims": "PersistentVolumeClaims",
  "/storage/storageclasses": "StorageClasses",
  "/storage/volumeattributesclasses": "VolumeAttributesClasses",
  "/storage/volumesnapshots": "VolumeSnapshots",
  "/storage/volumesnapshotclasses": "VolumeSnapshotClasses",
  "/storage/volumesnapshotcontents": "VolumeSnapshotContents",
  "/builds/builds": "Builds",
  "/builds/imagestreams": "ImageStreams",
  "/observe/metrics": "Metrics",
  "/observe/dashboards": "Dashboards",
  "/observe/targets": "Targets",
  "/compute/machines": "Machines",
  "/compute/machineautoscalers": "MachineAutoscalers",
  "/compute/machinehealthchecks": "MachineHealthChecks",
  "/compute/controlplanemachinesets": "ControlPlaneMachineSets",
  "/compute/machinesets": "MachineSets",
  "/compute/machineconfigs": "MachineConfigs",
  "/compute/machineconfigpools": "MachineConfigPools",
  "/user-management/groups": "Groups",
  "/user-management/serviceaccounts": "ServiceAccounts",
  "/user-management/roles": "Roles",
  "/user-management/rolebindings": "RoleBindings",
};

/**
 * Placeholder content for console navigation targets that are not fully built out in this prototype.
 */
export default function ConsoleStubPage() {
  const { pathname } = useLocation();
  const heading = useMemo(() => LABELS[pathname] ?? "Page", [pathname]);

  return (
    <PageSection>
      <Title headingLevel="h1">{heading}</Title>
      <Content className="pf-v6-u-mt-md">
        This view is a placeholder for the OpenShift console navigation in this prototype.
      </Content>
    </PageSection>
  );
}
