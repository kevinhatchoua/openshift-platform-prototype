import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Button,
  Card,
  CardBody,
  Tab,
  Tabs,
  TabTitleText,
} from "@patternfly/react-core";
import { AlertTriangle, ExternalLink } from "@/lib/pfIcons";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { OlmV1ClusterExtensionSubscriptionPanel } from "../../components/ecosystem/OlmV1ClusterExtensionSubscriptionPanel";
import { ConsoleYamlEditor } from "../../components/console/ConsoleYamlEditor";
import { useOlmV1ExtensionLifecycleActions } from "../../components/ecosystem/OlmV1ExtensionLifecycleActions";
import { OlmOperatorRollbackModal } from "../../components/ecosystem/OlmOperatorRollbackModal";
import { operatorToConsoleModel } from "../../components/ecosystem/installedOperator/InstalledOperatorConsolePanels";
import type { CatalogOperator } from "./installedOperatorsTypes";

function catalogSourceToProvider(source: string): string {
  if (source === "redhat-operators") return "Red Hat";
  if (source === "community-operators") return "Community";
  if (source === "certified-operators") return "Certified";
  return source;
}

function defaultTargetVersion(current: string): string {
  const parts = current.split(".").map((p) => parseInt(p, 10));
  if (parts.length >= 2 && !Number.isNaN(parts[1])) {
    return `${parts[0]}.${parts[1] + 1}.0`;
  }
  return "3.1.0";
}

export type ClusterExtensionRichDetailViewProps = {
  catalogOperator: CatalogOperator;
};

export default function ClusterExtensionRichDetailView({ catalogOperator }: ClusterExtensionRichDetailViewProps) {
  const [extensionOperator, setExtensionOperator] = useState(catalogOperator);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const operatorNameParam = encodeURIComponent(extensionOperator.name);
  const targetNewVersion = extensionOperator.updateAvailable ?? defaultTargetVersion(extensionOperator.version);

  const { actionsDropdown, lifecycleModals, openManageSubscription, canManageClusterExtension } =
    useOlmV1ExtensionLifecycleActions({
    operator: extensionOperator,
    onSpecUpdated: (spec) => {
      setExtensionOperator((prev) => ({
        ...prev,
        channel: spec.channel,
        version: spec.version,
        versionRange: spec.versionRange,
      }));
    },
    onRollBackToClassic: () => setRollbackOpen(true),
  });

  const [activeTab, setActiveTab] = useState<"details" | "yaml" | "subscription" | "events" | "kubapp">("details");

  const consoleModel = useMemo(() => operatorToConsoleModel(extensionOperator), [extensionOperator]);

  const displayTitle = extensionOperator.name.includes("-v")
    ? extensionOperator.name
    : `${extensionOperator.name}-v${extensionOperator.version}`;

  const operator = useMemo(
    () => ({
      id: extensionOperator.name,
      name: displayTitle,
      version: extensionOperator.version,
      newVersion: targetNewVersion,
      provider: catalogSourceToProvider(catalogOperator.source),
      hasUpdate: extensionOperator.version !== targetNewVersion,
      description: consoleModel.description,
      longDescription: `${consoleModel.description}\n\nCluster extension installed via Operator Lifecycle Manager v1. Use the Subscription tab to change channel and version, or YAML to edit the ClusterServiceVersion reference for this extension package.`,
      apis: [
        { name: "XYZ API", description: "A project prescription running an RHPAM/RHDM environment." },
        { name: "XYZ API", description: "A project prescription running an RHPAM/RHDM environment." },
        { name: "XYZ API", description: "A project prescription running an RHPAM/RHDM environment." },
      ],
      clusterServiceVersion: {
        name: consoleModel.csv.name,
        namespace: consoleModel.csv.namespace,
        status: consoleModel.csv.status,
        statusReason: consoleModel.csv.statusReason,
        labels: consoleModel.csv.labels.map((label) => {
          const eq = label.indexOf("=");
          if (eq === -1) return { key: label, value: "" };
          return { key: label.slice(0, eq), value: label.slice(eq + 1) };
        }),
        annotations: [{ key: `${consoleModel.csv.annotationsCount} annotations`, value: "" }],
        managedNamespaces: consoleModel.csv.managedNamespaces,
        operatorDeployments: consoleModel.csv.operatorDeployments.map((name) => ({
          name,
          status: "Ready",
        })),
        operatorServiceAccounts: [{ name: consoleModel.csv.operatorDeployments[0] ?? "operator", status: "Active" }],
        operatorGroup: { name: consoleModel.csv.operatorGroup, status: "Active" },
      },
    }),
    [
      extensionOperator.name,
      extensionOperator.version,
      consoleModel,
      displayTitle,
      targetNewVersion,
      extensionOperator.source,
    ],
  );

  const operatorYaml = useMemo(
    () =>
      `apiVersion: operators.coreos.com/v1alpha1
kind: ClusterServiceVersion
metadata:
  name: ${operator.clusterServiceVersion.name}
  namespace: ${operator.clusterServiceVersion.namespace}
spec:
  displayName: ${operator.name}
  version: ${operator.version}
  provider:
    name: ${operator.provider}
  install:
    strategy: deployment
    spec:
      deployments:
        - name: business-automation-operator
          spec:
            replicas: 1`,
    [operator.clusterServiceVersion.name, operator.clusterServiceVersion.namespace, operator.name, operator.provider, operator.version],
  );

  const tabs = [
    { id: "details", label: "Details" },
    { id: "yaml", label: "YAML" },
    { id: "subscription", label: "Subscription" },
    { id: "events", label: "Events" },
    { id: "kubapp", label: "KubApp" },
  ];

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
        <Breadcrumbs
          items={[
            { label: "Ecosystem", path: "/ecosystem" },
            { label: "Installed Operators", path: "/ecosystem/installed-operators" },
            { label: operator.name },
          ]}
        >

        <div className="mb-[24px]">
          <div className="flex items-center justify-between mb-[8px] flex-wrap gap-[8px]">
            <h1 className="font-['Red_Hat_Display_VF:Medium',sans-serif] font-medium leading-[36.4px] text-[#151515] dark:text-white text-[28px]">
              {operator.name}
            </h1>
            <div className="flex items-center gap-[8px]">
              <FavoriteButton name={operator.name} path={`/ecosystem/installed-operators/${operatorNameParam}`} />
              {actionsDropdown}
            </div>
          </div>
          <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0]">
            {extensionOperator.version} provided by {operator.provider}
          </p>
        </div>

        <Tabs
          activeKey={activeTab}
          onSelect={(_event, tabKey) => setActiveTab(String(tabKey) as typeof activeTab)}
          aria-label="Operator details"
          className="ocs-console-page-tabs pf-v6-u-mb-lg"
        >
          {tabs.map((tab) => (
            <Tab key={tab.id} eventKey={tab.id} title={<TabTitleText>{tab.label}</TabTitleText>} />
          ))}
        </Tabs>

        {/* Tab Content */}
        {activeTab === "details" && (
          <>
            {/* Update Alert */}
            {operator.hasUpdate && (
              <div className="bg-[#fef6e6] dark:bg-[rgba(240,171,0,0.15)] border-l-4 border-[#f0ab00] dark:border-[#f4c145] rounded-[8px] p-[16px] mb-[24px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div className="flex items-start gap-[12px]">
                    <AlertTriangle className="size-[20px] text-[#f0ab00] dark:text-[#f4c145] shrink-0 mt-[2px]" />
                    <p className="text-[14px] text-[#151515] dark:text-white font-semibold">
                      New version {operator.newVersion} available!
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("subscription")}
                    className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold whitespace-nowrap"
                  >
                    View subscription
                  </button>
                </div>
              </div>
            )}

            {/* Provided APIs */}
            <div className="mb-[32px]">
              <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[20px] text-[#151515] dark:text-white mb-[16px]">
                Provided APIs
              </h2>
              <div className="grid grid-cols-3 gap-[16px]">
                {operator.apis.map((api, index) => (
                  <div key={index} className="ocs-console-surface-card rounded-[16px] p-[20px]">
                    <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[16px] text-[#151515] dark:text-white mb-[8px]">{api.name}</h3>
                    <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[12px]">{api.description}</p>
                    <button className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold flex items-center gap-[4px]">
                      <span className="size-[16px] bg-[#0066cc] dark:bg-[#4dabf7] text-white rounded-full flex items-center justify-center text-[10px]">+</span>
                      Create instance
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-[32px]">
              <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[20px] text-[#151515] dark:text-white mb-[16px]">Description</h2>
              <div className="space-y-[12px] text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0]">
                {operator.longDescription.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              <button className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold mt-[12px]">See more</button>
            </div>

            {/* ClusterServiceVersion details */}
            <div className="mb-[32px]">
              <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[20px] text-[#151515] dark:text-white mb-[16px]">ClusterServiceVersion details</h2>
              <div className="ocs-console-surface-card rounded-[16px] p-[20px] space-y-[16px]">
                <div className="grid grid-cols-2 gap-[16px]">
                  <div>
                    <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[4px]">Name</p>
                    <p className="text-[14px] text-[#151515] dark:text-white">{operator.clusterServiceVersion.name}</p>
                  </div>
                  <div>
                    <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[4px]">Namespace</p>
                    <div className="flex items-center gap-[8px]">
                      <span className="px-[8px] py-[2px] bg-[#0066cc] dark:bg-[#4dabf7] text-white rounded-[4px] text-[12px] font-semibold">NS</span>
                      <span className="text-[14px] text-[#151515] dark:text-white">{operator.clusterServiceVersion.namespace}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-[16px]">
                  <div>
                    <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[4px]">Status</p>
                    <div className="flex items-center gap-[8px]">
                      <span className="size-[8px] bg-[#3e8635] dark:bg-[#5ba352] rounded-full"></span>
                      <span className="text-[14px] text-[#151515] dark:text-white">{operator.clusterServiceVersion.status}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[4px]">Status reason</p>
                    <p className="text-[14px] text-[#151515] dark:text-white">{operator.clusterServiceVersion.statusReason}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-[8px]">
                    <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0]">Labels</p>
                    <button className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold flex items-center gap-[4px]">
                      Edit <span className="size-[14px]">✎</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-[8px]">
                    {operator.clusterServiceVersion.labels.map((label, index) => (
                      <span key={index} className="px-[10px] py-[4px] bg-[#e7f6fd] dark:bg-[rgba(43,154,243,0.15)] text-[#2b9af3] dark:text-[#73bcf7] rounded-[999px] text-[12px] font-semibold">
                        {label.key}={label.value || "''"}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[8px]">Annotations</p>
                  <button className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold flex items-center gap-[4px]">
                    <span className="size-[14px]">✎</span> 23 annotations
                  </button>
                </div>
                <div>
                  <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[8px]">Managed Namespaces</p>
                  <div className="flex items-center gap-[8px]">
                    <span className="px-[8px] py-[2px] bg-[#0066cc] dark:bg-[#4dabf7] text-white rounded-[4px] text-[12px] font-semibold">NS</span>
                    <span className="text-[14px] text-[#151515] dark:text-white">{operator.clusterServiceVersion.managedNamespaces[0]}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Operator Deployments */}
            <div className="mb-[32px]">
              <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[18px] text-[#151515] dark:text-white mb-[12px]">Operator Deployments</h3>
              <div className="ocs-console-surface-card rounded-[16px] p-[20px]">
                {operator.clusterServiceVersion.operatorDeployments.map((deployment, index) => (
                  <div key={index} className="flex items-center gap-[8px]">
                    <span className="size-[8px] bg-[#0066cc] dark:bg-[#4dabf7] rounded-full"></span>
                    <Link to="#" className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold">{deployment.name}</Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Operator ServiceAccounts */}
            <div className="mb-[32px]">
              <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[18px] text-[#151515] dark:text-white mb-[12px]">Operator ServiceAccounts</h3>
              <div className="ocs-console-surface-card rounded-[16px] p-[20px]">
                {operator.clusterServiceVersion.operatorServiceAccounts.map((sa, index) => (
                  <div key={index} className="flex items-center gap-[8px]">
                    <span className="size-[8px] bg-[#0066cc] dark:bg-[#4dabf7] rounded-full"></span>
                    <Link to="#" className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold">{sa.name}</Link>
                  </div>
                ))}
              </div>
            </div>

            {/* OperatorGroup */}
            <div className="mb-[32px]">
              <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[18px] text-[#151515] dark:text-white mb-[12px]">OperatorGroup</h3>
              <div className="ocs-console-surface-card rounded-[16px] p-[20px]">
                <div className="flex items-center gap-[8px]">
                  <span className="px-[8px] py-[2px] bg-[#0066cc] dark:bg-[#4dabf7] text-white rounded-[4px] text-[12px] font-semibold">OG</span>
                  <Link to="#" className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold">{operator.clusterServiceVersion.operatorGroup.name}</Link>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "subscription" && (
          <div className="flex gap-[24px]">
            <div className="flex-1">
              <OlmV1ClusterExtensionSubscriptionPanel
                operator={extensionOperator}
                canManage={canManageClusterExtension}
                onSpecUpdated={(spec) => {
                  setExtensionOperator((prev) => ({
                    ...prev,
                    channel: spec.channel,
                    version: spec.version,
                    versionRange: spec.versionRange,
                  }));
                }}
                onManageSubscription={openManageSubscription}
              />
            </div>
            <div className="ocs-operator-update-plan-sidebar">
              <Card isPlain className="ocs-console-surface-card">
                <CardBody>
                  <Button
                    variant="link"
                    isInline
                    component="a"
                    href="https://console.redhat.com/openshift"
                    target="_blank"
                    rel="noopener noreferrer"
                    icon={<ExternalLink className="size-[12px]" aria-hidden />}
                    iconPosition="right"
                  >
                    Manage in OpenShift Cluster Management
                  </Button>
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "yaml" ? (
          <ConsoleYamlEditor
            initialYaml={operatorYaml}
            downloadFileName="clusterserviceversion.yaml"
            ariaLabel="ClusterServiceVersion YAML"
          />
        ) : null}

        {activeTab === "events" && (
          <div className="ocs-console-surface-card rounded-[16px] p-[24px]">
            <div className="space-y-[12px]">
              {[
                { type: "Normal", reason: "InstallSucceeded", message: "install strategy completed with no errors", time: "2m ago" },
                { type: "Normal", reason: "AllCatalogSourcesHealthy", message: "all available catalogsources are healthy", time: "5m ago" },
                { type: "Warning", reason: "UpdateAvailable", message: `New version ${operator.newVersion} available in channel ${extensionOperator.channel}`, time: "1h ago" },
              ].map((event, i) => (
                <div key={i} className="ocs-console-surface-card--inset flex items-start gap-[12px] p-[12px]">
                  <div className={`size-[8px] rounded-full mt-[6px] shrink-0 ${event.type === "Normal" ? "bg-[#3e8635]" : "bg-[#f0ab00]"}`} />
                  <div className="flex-1">
                    <p className="text-[13px] text-[#151515] dark:text-white font-semibold">{event.reason}</p>
                    <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0]">{event.message}</p>
                  </div>
                  <span className="text-[12px] text-[#6a6e73] shrink-0">{event.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "kubapp" && (
          <div className="ocs-console-surface-card rounded-[16px] p-[48px] text-center">
            <p className="text-[14px] text-[#6a6e73] dark:text-[#a0a0a0]">No KubApp resources found for this operator.</p>
          </div>
        )}
        </Breadcrumbs>
      {lifecycleModals}
      <OlmOperatorRollbackModal
        operator={extensionOperator}
        isOpen={rollbackOpen}
        onClose={() => setRollbackOpen(false)}
        onRollbackConfirmed={() => setRollbackOpen(false)}
      />
    </div>
  );
}