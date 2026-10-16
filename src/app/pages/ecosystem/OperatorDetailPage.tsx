import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  Button,
  Card,
  CardBody,
  Flex,
  FormSelect,
  FormSelectOption,
  Tab,
  Tabs,
  TabTitleText,
} from "@patternfly/react-core";
import { AlertTriangle, ExternalLink, ChevronRight, CheckCircle2, Info } from "@/lib/pfIcons";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { OperatorSubscriptionUpdateModal } from "../../components/ecosystem/OperatorSubscriptionUpdateModal";
import GitOpsOperatorDetailView from "../gitops/GitOpsOperatorDetailView";
import OlmV1ExtensionDetailView from "./OlmV1ExtensionDetailView";
import { getPrototypeInstalledOperator, isOlmV1ExtensionOperatorName } from "./installedOperatorsLookup";
import InstalledCatalogOperatorDetailPage from "./InstalledCatalogOperatorDetailPage";
import { ConsoleYamlEditor } from "../../components/console/ConsoleYamlEditor";

// Channel definitions with available versions and cluster compatibility
interface ChannelDef {
  name: string;
  versions: { version: string; requiresClusterUpdate?: boolean; clusterMin?: string }[];
}

const CHANNELS: ChannelDef[] = [
  {
    name: "stable-4.5",
    versions: [
      { version: "3.0.2" },
      { version: "3.0.3" },
      { version: "3.0.4" },
      { version: "3.0.5" },
      { version: "3.1.0" },
    ],
  },
  {
    name: "stable-4.6",
    versions: [
      { version: "3.1.0" },
      { version: "3.1.1" },
      { version: "3.2.0", requiresClusterUpdate: true, clusterMin: "4.22.0" },
    ],
  },
  {
    name: "candidate-4.6",
    versions: [
      { version: "3.1.0" },
      { version: "3.2.0-rc1", requiresClusterUpdate: true, clusterMin: "4.22.0" },
      { version: "3.2.0", requiresClusterUpdate: true, clusterMin: "4.22.0" },
      { version: "3.3.0-alpha", requiresClusterUpdate: true, clusterMin: "4.22.0" },
    ],
  },
];

export default function OperatorDetailPage() {
  const { operatorId, operatorName } = useParams();
  const decodedOperatorName = decodeURIComponent(operatorName ?? operatorId ?? "");
  const catalogOperator = getPrototypeInstalledOperator(decodedOperatorName);
  if (catalogOperator && !catalogOperator.isOlmV1Extension) {
    return <InstalledCatalogOperatorDetailPage operator={catalogOperator} />;
  }
  if (isOlmV1ExtensionOperatorName(decodedOperatorName)) {
    if (decodedOperatorName.toLowerCase().includes("gitops")) {
      return <GitOpsOperatorDetailView operatorName={decodedOperatorName} />;
    }
    return <OlmV1ExtensionDetailView operatorName={decodedOperatorName} />;
  }
  return <DefaultOperatorDetailPage />;
}

function DefaultOperatorDetailPage() {
  const { operatorId, operatorName } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"details" | "yaml" | "subscription" | "events" | "kubapp">("details");

  const clusterVersion = "4.21.0";
  const [installedChannel, setInstalledChannel] = useState("stable-4.5");
  const [installedVersion, setInstalledVersion] = useState("3.0.0");
  const [installedApproval, setInstalledApproval] = useState<"Automatic" | "Manual">("Manual");

  const [selectedChannel, setSelectedChannel] = useState("stable-4.5");
  const [selectedVersion, setSelectedVersion] = useState("3.1.0");
  const [updateApproval, setUpdateApproval] = useState<"Automatic" | "Manual">("Manual");
  const [subscriptionUpdateOpen, setSubscriptionUpdateOpen] = useState(false);

  const channelDef = useMemo(() => CHANNELS.find((c) => c.name === selectedChannel), [selectedChannel]);
  const availableVersions = useMemo(() => channelDef?.versions ?? [], [channelDef]);
  const selectedVersionDef = useMemo(() => availableVersions.find((v) => v.version === selectedVersion), [availableVersions, selectedVersion]);

  const subscriptionHasChanges =
    selectedChannel !== installedChannel ||
    selectedVersion !== installedVersion ||
    updateApproval !== installedApproval;

  const canStartSubscriptionUpdate =
    subscriptionHasChanges && !selectedVersionDef?.requiresClusterUpdate;

  // When channel changes, auto-select the latest version in that channel
  const handleChannelChange = (ch: string) => {
    setSelectedChannel(ch);
    const chDef = CHANNELS.find((c) => c.name === ch);
    if (chDef && chDef.versions.length > 0) {
      setSelectedVersion(chDef.versions[chDef.versions.length - 1].version);
    }
  };

  // Mock operator data
  const id = operatorId || operatorName;
  const operator = {
    id,
    name: "Abot Operator-v3.0.0",
    version: installedVersion,
    newVersion: "3.1.0",
    provider: "Refactz Technologies Pvt Ltd",
    hasUpdate: installedVersion !== "3.1.0",
    description: "Deploys and manages Red Hat Process Automation Manager and Red Hat Decision Manager environments.",
    longDescription: `Red Hat Process Automation Manager is a platform for developing containerized microservices and applications that automate business decisions and processes. It includes business process management (BPM), business rules management (BRM), and business resource optimization and complex event processing (CEP) technologies. It also includes a user experience platform to create engaging user interfaces for process and decision services with minimal coding.

To use the guided installer to provision an environment, open the Installer link, in the links section on the left side of this page.`,
    apis: [
      { name: "XYZ API", description: "A project prescription running an RHPAM/RHDM environment." },
      { name: "XYZ API", description: "A project prescription running an RHPAM/RHDM environment." },
      { name: "XYZ API", description: "A project prescription running an RHPAM/RHDM environment." },
    ],
    clusterServiceVersion: {
      name: "businessautomation-operator-7.13.5-r7",
      namespace: "bap",
      status: "Succeeded",
      statusReason: "install strategy completed with no errors",
      labels: [
        { key: "olm.copiedFrom", value: "operator-businesstemplate-ryx" },
        { key: "operator-businesstemplate-ryx", value: "olm.api.operator-businesstemplate-ryx" },
        { key: "operatorframework.io/arch.amd64", value: "supported" },
        { key: "operatorframework.io/os.linux", value: "supported" },
        { key: "operators.coreos.com/businessautomation-operator.bap", value: "" },
      ],
      annotations: [{ key: "23 annotations", value: "" }],
      managedNamespaces: ["bap"],
      operatorDeployments: [{ name: "business-automation-operator", status: "Ready" }],
      operatorServiceAccounts: [{ name: "business-automation-operator", status: "Active" }],
      operatorGroup: { name: "bap-qbid4", status: "Active" },
    },
  };

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
          <div className="flex items-center justify-between mb-[8px]">
            <h1 className="font-['Red_Hat_Display_VF:Medium',sans-serif] font-medium leading-[36.4px] text-[#151515] dark:text-white text-[28px]">
              {operator.name}
            </h1>
            <FavoriteButton name={operator.name} path={`/ecosystem/installed-operators/${operatorName}`} />
          </div>
          <p className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0]">
            {installedVersion} provided by {operator.provider}
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
                  <div key={index} className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-[20px]">
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
              <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-[20px] space-y-[16px]">
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
              <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-[20px]">
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
              <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-[20px]">
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
              <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-[20px]">
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
            {/* Main content */}
            <div className="flex-1">
              <Card isPlain className="ocs-operator-update-plan-target pf-v6-u-mb-lg">
                <CardBody>
                <div className="ocs-operator-update-plan-target__rows">
                  <div className="ocs-operator-update-plan-target__row">
                    <div className="ocs-operator-update-plan-target__current">
                      <p className="ocs-operator-update-plan-target__label">Current channel</p>
                      <p className="ocs-operator-update-plan-target__value">{installedChannel}</p>
                    </div>
                    <div className="ocs-operator-update-plan-target__field">
                      <label className="ocs-operator-update-plan-target__label" htmlFor="operator-target-channel">
                        Target channel
                      </label>
                      <FormSelect
                        id="operator-target-channel"
                        aria-label="Target channel"
                        value={selectedChannel}
                        onChange={(_e, value) => handleChannelChange(value)}
                      >
                        {CHANNELS.map((ch) => (
                          <FormSelectOption key={ch.name} value={ch.name} label={ch.name} />
                        ))}
                      </FormSelect>
                    </div>
                  </div>

                  <div className="ocs-operator-update-plan-target__row">
                    <div className="ocs-operator-update-plan-target__current">
                      <p className="ocs-operator-update-plan-target__label">Current version</p>
                      <p className="ocs-operator-update-plan-target__value">{installedVersion}</p>
                    </div>
                    <div className="ocs-operator-update-plan-target__field">
                      <label className="ocs-operator-update-plan-target__label" htmlFor="operator-target-version">
                        Target version
                      </label>
                      <FormSelect
                        id="operator-target-version"
                        aria-label="Target version"
                        value={selectedVersion}
                        onChange={(_e, value) => setSelectedVersion(value)}
                      >
                        {availableVersions.map((v) => (
                          <FormSelectOption
                            key={v.version}
                            value={v.version}
                            label={
                              v.requiresClusterUpdate
                                ? `${v.version} (requires cluster ${v.clusterMin}+)`
                                : v.version
                            }
                          />
                        ))}
                      </FormSelect>
                      <Button
                        className="ocs-operator-update-plan-target__release-notes pf-v6-u-mt-sm"
                        variant="link"
                        isInline
                        component="a"
                        href="https://docs.openshift.com/container-platform/latest/release_notes/ocp-4-18-release-notes.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        icon={<ExternalLink className="size-[12px]" aria-hidden />}
                        iconPosition="right"
                      >
                        View release notes
                      </Button>
                    </div>
                  </div>

                  <div className="ocs-operator-update-plan-target__row">
                    <div className="ocs-operator-update-plan-target__current">
                      <p className="ocs-operator-update-plan-target__label">Update approval</p>
                      <p className="ocs-operator-update-plan-target__value">{installedApproval}</p>
                    </div>
                    <div className="ocs-operator-update-plan-target__field ocs-operator-update-plan-target__field--control-only">
                      <label
                        className="ocs-operator-update-plan-target__label ocs-operator-update-plan-target__label--spacer"
                        htmlFor="operator-update-approval"
                      >
                        Update approval
                      </label>
                      <FormSelect
                        id="operator-update-approval"
                        aria-label="Update approval"
                        value={updateApproval}
                        onChange={(_e, value) => setUpdateApproval(value as "Automatic" | "Manual")}
                      >
                        <FormSelectOption value="Automatic" label="Automatic" />
                        <FormSelectOption value="Manual" label="Manual" />
                      </FormSelect>
                    </div>
                  </div>
                </div>
                </CardBody>
              </Card>

              {/* Cluster compatibility warning */}
              {selectedVersionDef?.requiresClusterUpdate && (
                <div className="bg-[#fef6e6] dark:bg-[rgba(240,171,0,0.15)] border-l-4 border-[#f0ab00] dark:border-[#f4c145] rounded-[8px] p-[16px] mb-[24px]">
                  <div className="flex items-start gap-[12px]">
                    <AlertTriangle className="size-[20px] text-[#f0ab00] dark:text-[#f4c145] shrink-0 mt-[1px]" />
                    <div>
                      <p className="text-[14px] text-[#151515] dark:text-white font-semibold mb-[4px]">
                        Cluster update required
                      </p>
                      <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[8px]">
                        Version {selectedVersion} requires cluster version {selectedVersionDef.clusterMin} or later.
                        Your cluster is currently on <span className="font-semibold">{clusterVersion}</span>.
                        Update your cluster before updating this operator.
                      </p>
                      <Link
                        to="/administration/cluster-settings"
                        className="text-[13px] text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold"
                      >
                        View cluster settings
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Version timeline */}
              <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-[24px] mb-[24px]">
                <h3 className="font-semibold text-[16px] text-[#151515] dark:text-white mb-[4px]">{selectedChannel}</h3>
                <p className="text-[13px] text-[#6a6e73] dark:text-[#a0a0a0] mb-[16px]">{installedVersion} (Current)</p>

                <div className="flex flex-col">
                  {availableVersions.map((v, i) => {
                    const isCurrent = v.version === installedVersion;
                    const isSelected = v.version === selectedVersion;
                    const isLast = i === availableVersions.length - 1;
                    return (
                      <div key={v.version} className="flex items-start gap-[12px]">
                        {/* Timeline line + dot */}
                        <div className="flex flex-col items-center">
                          <div className={`size-[12px] rounded-full border-2 shrink-0 ${
                            isCurrent
                              ? "bg-[#3e8635] border-[#3e8635]"
                              : isSelected
                                ? "ocs-operator-update-plan-timeline__dot--selected"
                                : v.requiresClusterUpdate
                                  ? "bg-transparent border-[#f0ab00]"
                                  : "bg-transparent border-[#6a6e73] dark:border-[#a0a0a0]"
                          }`} />
                          {!isLast && (
                            <div className="w-[2px] h-[28px] bg-[rgba(0,0,0,0.15)] dark:bg-[rgba(255,255,255,0.15)]" />
                          )}
                        </div>
                        <div className="pb-[16px]">
                          <button
                            onClick={() => setSelectedVersion(v.version)}
                            className={`text-[14px] ocs-operator-update-plan-timeline__version ${
                              isSelected ? "ocs-operator-update-plan-timeline__version--selected" : ""
                            } ${isCurrent ? "font-semibold" : ""}`}
                          >
                            {v.version}
                          </button>
                          {v.requiresClusterUpdate && (
                            <span className="ml-[8px] px-[6px] py-[1px] text-[10px] font-semibold rounded-[4px] bg-[#fef6e6] dark:bg-[rgba(240,171,0,0.15)] text-[#8a6d3b] dark:text-[#f0ab00]">
                              Requires cluster {v.clusterMin}+
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Flex gap={{ default: "gapMd" }} alignItems={{ default: "alignItemsCenter" }}>
                <Button
                  variant="primary"
                  isDisabled={!canStartSubscriptionUpdate}
                  onClick={() => setSubscriptionUpdateOpen(true)}
                >
                  Update
                </Button>
              </Flex>

              <OperatorSubscriptionUpdateModal
                operatorName={operator.name}
                isOpen={subscriptionUpdateOpen}
                current={{
                  channel: installedChannel,
                  version: installedVersion,
                  approval: installedApproval,
                }}
                target={{
                  channel: selectedChannel,
                  version: selectedVersion,
                  approval: updateApproval,
                }}
                onClose={() => setSubscriptionUpdateOpen(false)}
                onComplete={(target) => {
                  setInstalledChannel(target.channel);
                  setInstalledVersion(target.version);
                  setInstalledApproval(target.approval);
                  setSelectedChannel(target.channel);
                  setSelectedVersion(target.version);
                  setUpdateApproval(target.approval);
                }}
              />
            </div>

            <div className="ocs-operator-update-plan-sidebar">
              <Card isPlain>
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
          <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-[24px]">
            <div className="space-y-[12px]">
              {[
                { type: "Normal", reason: "InstallSucceeded", message: "install strategy completed with no errors", time: "2m ago" },
                { type: "Normal", reason: "AllCatalogSourcesHealthy", message: "all available catalogsources are healthy", time: "5m ago" },
                { type: "Warning", reason: "UpdateAvailable", message: `New version ${operator.newVersion} available in channel ${installedChannel}`, time: "1h ago" },
              ].map((event, i) => (
                <div key={i} className="flex items-start gap-[12px] p-[12px] rounded-[8px] bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)]">
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
          <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-[48px] text-center">
            <p className="text-[14px] text-[#6a6e73] dark:text-[#a0a0a0]">No KubApp resources found for this operator.</p>
          </div>
        )}
        </Breadcrumbs>
    </div>
  );
}