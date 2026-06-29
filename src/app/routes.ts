import { createBrowserRouter } from "react-router";
import { collectStubPaths } from "./navigation/consoleNav";
import RootLayout from "./components/RootLayout";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import FavoritesPage from "./pages/FavoritesPage";
import EcosystemPage from "./pages/EcosystemPage";
import WorkloadsPage from "./pages/WorkloadsPage";
import PodsPage from "./pages/workloads/PodsPage";
import PodDetailPage from "./pages/workloads/PodDetailPage";
import DeploymentsPage from "./pages/workloads/DeploymentsPage";
import StatefulSetsPage from "./pages/workloads/StatefulSetsPage";
import DaemonSetsPage from "./pages/workloads/DaemonSetsPage";
import JobsPage from "./pages/workloads/JobsPage";
import CronJobsPage from "./pages/workloads/CronJobsPage";
import TopologyPage from "./pages/workloads/TopologyPage";
import ServicesPage from "./pages/networking/ServicesPage";
import RoutesPage from "./pages/networking/RoutesPage";
import IngressesPage from "./pages/networking/IngressesPage";
import PhysicalNetworksPage from "./pages/networking/PhysicalNetworksPage";
import NetworkPoliciesPage from "./pages/networking/NetworkPoliciesPage";
import NodeNetworkConfigurationPolicyPage from "./pages/networking/NodeNetworkConfigurationPolicyPage";
import NetworkAttachmentDefinitionsPage from "./pages/networking/NetworkAttachmentDefinitionsPage";
import UserDefinedNetworksPage from "./pages/networking/UserDefinedNetworksPage";
import NodeNetworkConfigurationPage from "./pages/networking/NodeNetworkConfigurationPage";
import StoragePage from "./pages/StoragePage";
import BuildsPage from "./pages/BuildsPage";
import ObservePage from "./pages/ObservePage";
import ComputePage from "./pages/ComputePage";
import UserManagementPage from "./pages/UserManagementPage";
import SettingsPage from "./pages/SettingsPage";
import AlertsPage from "./pages/AlertsPage";
import ActivityDetailsPage from "./pages/ActivityDetailsPage";
import ClusterInventoryPage from "./pages/ClusterInventoryPage";
import ClusterSettingsPage from "./pages/administration/ClusterSettingsPage";
import ClusterUpdatePlanPage from "./pages/administration/ClusterUpdatePlanPage";

import ClusterUpdateInProgressPage from "./pages/administration/ClusterUpdateInProgressPage";
import OperatorsLifecyclePage from "./pages/administration/OperatorsLifecyclePage";
import UpdateCompletePage from "./pages/administration/UpdateCompletePage";
import UpdateFailedPage from "./pages/administration/UpdateFailedPage";
import VersionDetailPage from "./pages/administration/VersionDetailPage";
import AgentModePage from "./pages/administration/AgentModePage";
import ClusterUpdateHistoryPage from "./pages/administration/ClusterUpdateHistoryPage";
import NamespacesPage from "./pages/administration/NamespacesPage";
import ResourceQuotasPage from "./pages/administration/ResourceQuotasPage";
import LimitRangesPage from "./pages/administration/LimitRangesPage";
import CustomResourceDefinitionsPage from "./pages/administration/CustomResourceDefinitionsPage";
import DynamicPluginsPage from "./pages/administration/DynamicPluginsPage";
import SoftwareCatalogPage from "./pages/ecosystem/SoftwareCatalogPage";
import InstalledOperatorsPage from "./pages/ecosystem/InstalledOperatorsPage";
import HelmPage from "./pages/ecosystem/HelmPage";
import OperatorDetailPage from "./pages/ecosystem/OperatorDetailPage";
import OperatorUpdatePage from "./pages/ecosystem/OperatorUpdatePage";
import OperatorInstallingPage from "./pages/ecosystem/OperatorInstallingPage";
import OperatorInstalledPage from "./pages/ecosystem/OperatorInstalledPage";

import NodeDetailPage from "./pages/compute/NodeDetailPage";
import ConsoleStubPage from "./pages/ConsoleStubPage";

const consoleStubRoutes = collectStubPaths().map((fullPath) => ({
  path: fullPath.replace(/^\//, ""),
  Component: ConsoleStubPage,
}));

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        /** Pathless layout: matches `/` and all child paths (avoids empty-string segment issues). */
        Component: Layout,
        children: [
          { index: true, Component: HomePage },
          { path: "favorites", Component: FavoritesPage },
          { path: "ecosystem", Component: EcosystemPage },
          { path: "ecosystem/software-catalog", Component: SoftwareCatalogPage },
          { path: "ecosystem/software-catalog/:operatorId", Component: OperatorDetailPage },
          { path: "ecosystem/software-catalog/:operatorId/update", Component: OperatorUpdatePage },
          { path: "ecosystem/software-catalog/:operatorId/install", Component: OperatorInstallingPage },
          { path: "ecosystem/software-catalog/:operatorId/installing", Component: OperatorInstallingPage },
          { path: "ecosystem/software-catalog/:operatorId/installed", Component: OperatorInstalledPage },

          { path: "ecosystem/installed-operators", Component: InstalledOperatorsPage },
          { path: "ecosystem/installed-operators/:operatorName", Component: OperatorDetailPage },
          { path: "ecosystem/installed-operators/:operatorName/update", Component: OperatorUpdatePage },
          { path: "ecosystem/installed-operators/:operatorName/installing", Component: OperatorInstallingPage },
          { path: "ecosystem/installed-operators/:operatorName/installed", Component: OperatorInstalledPage },
          { path: "ecosystem/installed-operators/:operatorName/subscription", Component: OperatorDetailPage },
          { path: "ecosystem/installed-operators/:operatorName/yaml", Component: OperatorDetailPage },
          { path: "ecosystem/installed-operators/:operatorName/logs", Component: OperatorDetailPage },
          { path: "ecosystem/installed-operators/:operatorName/events", Component: OperatorDetailPage },
          { path: "ecosystem/helm", Component: HelmPage },
          { path: "workloads", Component: WorkloadsPage },
          { path: "workloads/pods", Component: PodsPage },
          { path: "workloads/pods/:namespace/:podName", Component: PodDetailPage },
          { path: "workloads/deployments", Component: DeploymentsPage },
          { path: "workloads/statefulsets", Component: StatefulSetsPage },
          { path: "workloads/daemonsets", Component: DaemonSetsPage },
          { path: "workloads/jobs", Component: JobsPage },
          { path: "workloads/cronjobs", Component: CronJobsPage },
          { path: "workloads/topology", Component: TopologyPage },
          { path: "networking", Component: ServicesPage },
          { path: "networking/routes", Component: RoutesPage },
          { path: "networking/ingresses", Component: IngressesPage },
          { path: "networking/physical-networks", Component: PhysicalNetworksPage },
          { path: "networking/networkpolicies", Component: NetworkPoliciesPage },
          { path: "networking/nodenetworkconfigurationpolicy", Component: NodeNetworkConfigurationPolicyPage },
          { path: "networking/networkattachmentdefinitions", Component: NetworkAttachmentDefinitionsPage },
          { path: "networking/userdefinednetworks", Component: UserDefinedNetworksPage },
          { path: "networking/node-network-configuration", Component: NodeNetworkConfigurationPage },
          { path: "storage", Component: StoragePage },
          { path: "builds", Component: BuildsPage },
          { path: "observe", Component: ObservePage },
          { path: "compute", Component: ComputePage },
          { path: "compute/nodes/:nodeName", Component: NodeDetailPage },
          { path: "user-management", Component: UserManagementPage },
          { path: "administration/cluster-update", Component: ClusterUpdatePlanPage },
          { path: "administration/cluster-update/version/:version", Component: VersionDetailPage },
          { path: "administration/cluster-update/in-progress", Component: ClusterUpdateInProgressPage },
          { path: "administration/cluster-update/operators", Component: OperatorsLifecyclePage },
          { path: "administration/cluster-update/history", Component: ClusterUpdateHistoryPage },
          { path: "administration/cluster-update/complete", Component: UpdateCompletePage },
          { path: "administration/cluster-update/failed", Component: UpdateFailedPage },
          { path: "administration/cluster-update/agent-mode", Component: AgentModePage },
          { path: "administration/cluster-settings", Component: ClusterSettingsPage },
          { path: "administration/namespaces", Component: NamespacesPage },
          { path: "administration/resource-quotas", Component: ResourceQuotasPage },
          { path: "administration/limit-ranges", Component: LimitRangesPage },
          { path: "administration/custom-resource-definitions", Component: CustomResourceDefinitionsPage },
          { path: "administration/dynamic-plugins", Component: DynamicPluginsPage },
          { path: "settings", Component: SettingsPage },
          { path: "alerts", Component: AlertsPage },
          { path: "activity/:id", Component: ActivityDetailsPage },
          { path: "inventory", Component: ClusterInventoryPage },
          ...consoleStubRoutes,
        ],
      },
    ],
  },
]);