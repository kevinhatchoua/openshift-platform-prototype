import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { AlertTriangle, ExternalLink, ChevronRight, ArrowRight, CheckCircle2, Info, Edit2 } from "@/lib/pfIcons";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import GitOpsOperatorDetailView from "../gitops/GitOpsOperatorDetailView";
import OlmV1ExtensionDetailView from "./OlmV1ExtensionDetailView";
import { isOlmV1ExtensionOperatorName } from "./installedOperatorsLookup";

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
  const [activeTab, setActiveTab] = useState<"details" | "yaml" | "update-plan" | "events" | "kubapp">("details");

  // Update plan state
  const [selectedChannel, setSelectedChannel] = useState("stable-4.5");
  const [selectedVersion, setSelectedVersion] = useState("3.1.0");

  const currentChannel = "stable-4.5";
  const currentVersion = "3.0.0";
  const clusterVersion = "4.21.0";

  const channelDef = useMemo(() => CHANNELS.find((c) => c.name === selectedChannel), [selectedChannel]);
  const availableVersions = useMemo(() => channelDef?.versions ?? [], [channelDef]);
  const selectedVersionDef = useMemo(() => availableVersions.find((v) => v.version === selectedVersion), [availableVersions, selectedVersion]);

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
    version: currentVersion,
    newVersion: "3.1.0",
    provider: "Refactz Technologies Pvt Ltd",
    hasUpdate: true,
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

  const tabs = [
    { id: "details", label: "Details" },
    { id: "yaml", label: "YAML" },
    { id: "update-plan", label: "Update plan" },
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
            {operator.version} provided by {operator.provider}
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] mb-[24px]">
          <div className="flex gap-[24px]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-[12px] border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-[#0066cc] dark:border-[#4dabf7] font-semibold text-[#151515] dark:text-white"
                    : "border-transparent text-[#4d4d4d] dark:text-[#b0b0b0] hover:text-[#151515] dark:hover:text-white"
                } text-[14px] -mb-[1px]`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

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
                    onClick={() => setActiveTab("update-plan")}
                    className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold whitespace-nowrap"
                  >
                    View update plan
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

        {activeTab === "update-plan" && (
          <div className="flex gap-[24px]">
            {/* Main content */}
            <div className="flex-1">
              {/* Channel and Version selectors */}
              <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-[24px] mb-[24px]">
                {/* Row 1: Channel */}
                <div className="flex items-center gap-[16px] mb-[20px]">
                  <div className="min-w-[160px]">
                    <p className="text-[12px] text-[#6a6e73] dark:text-[#a0a0a0] mb-[4px]">Current channel</p>
                    <p className="text-[15px] text-[#151515] dark:text-white font-semibold">{currentChannel}</p>
                  </div>
                  <ArrowRight className="size-[18px] text-[#6a6e73] dark:text-[#a0a0a0] shrink-0 mt-[16px]" />
                  <div className="min-w-[200px]">
                    <p className="text-[12px] text-[#6a6e73] dark:text-[#a0a0a0] mb-[4px]">Target channel</p>
                    <select
                      value={selectedChannel}
                      onChange={(e) => handleChannelChange(e.target.value)}
                      className="w-full px-[12px] py-[8px] bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] rounded-[999px] text-[14px] text-[#151515] dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0066cc]"
                    >
                      {CHANNELS.map((ch) => (
                        <option key={ch.name} value={ch.name}>{ch.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Version */}
                <div className="flex items-center gap-[16px] mb-[16px]">
                  <div className="min-w-[160px]">
                    <p className="text-[12px] text-[#6a6e73] dark:text-[#a0a0a0] mb-[4px]">Current version</p>
                    <p className="text-[15px] text-[#151515] dark:text-white font-semibold">{currentVersion}</p>
                  </div>
                  <ArrowRight className="size-[18px] text-[#6a6e73] dark:text-[#a0a0a0] shrink-0 mt-[16px]" />
                  <div className="min-w-[200px]">
                    <p className="text-[12px] text-[#6a6e73] dark:text-[#a0a0a0] mb-[4px]">Target version</p>
                    <select
                      value={selectedVersion}
                      onChange={(e) => setSelectedVersion(e.target.value)}
                      className="w-full px-[12px] py-[8px] bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] rounded-[999px] text-[14px] text-[#151515] dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0066cc]"
                    >
                      {availableVersions.map((v) => (
                        <option key={v.version} value={v.version}>
                          {v.version}{v.requiresClusterUpdate ? ` (requires cluster ${v.clusterMin}+)` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <a href="https://docs.openshift.com/container-platform/latest/release_notes/ocp-4-18-release-notes.html" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#0066cc] dark:text-[#4dabf7] hover:underline flex items-center gap-[4px]">
                  View release notes <ExternalLink className="size-[12px]" />
                </a>
              </div>

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
                <p className="text-[13px] text-[#6a6e73] dark:text-[#a0a0a0] mb-[16px]">{currentVersion} (Current)</p>

                <div className="flex flex-col">
                  {availableVersions.map((v, i) => {
                    const isCurrent = v.version === currentVersion;
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
                                ? "bg-[#0066cc] border-[#0066cc] dark:bg-[#4dabf7] dark:border-[#4dabf7]"
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
                            className={`text-[14px] ${
                              isSelected
                                ? "text-[#0066cc] dark:text-[#4dabf7] font-semibold"
                                : isCurrent
                                  ? "text-[#151515] dark:text-white font-semibold"
                                  : "text-[#151515] dark:text-white hover:text-[#0066cc] dark:hover:text-[#4dabf7]"
                            }`}
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

              {/* Actions */}
              <div className="flex items-center gap-[12px]">
                <button
                  disabled={!!selectedVersionDef?.requiresClusterUpdate}
                  className={`px-[20px] py-[10px] rounded-[8px] font-semibold text-[14px] transition-colors ${
                    selectedVersionDef?.requiresClusterUpdate
                      ? "bg-[#d2d2d2] text-[#6a6e73] cursor-not-allowed"
                      : "bg-[#0066cc] hover:bg-[#004080] dark:bg-[#4dabf7] dark:hover:bg-[#339af0] text-white"
                  }`}
                >
                  Approve update
                </button>
                <button className="px-[20px] py-[10px] border border-[rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] rounded-[8px] font-semibold text-[14px] text-[#151515] dark:text-white hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                  Preview update
                </button>
                <a href="https://docs.openshift.com/container-platform/latest/operators/understanding/olm-understanding-operatorhub.html" target="_blank" rel="noopener noreferrer" className="text-[14px] text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold flex items-center gap-[4px]">
                  Link <ExternalLink className="size-[14px]" />
                </a>
              </div>
            </div>

            {/* Right sidebar - Update strategy */}
            <div className="w-[260px] shrink-0">
              <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-[20px]">
                <h3 className="font-semibold text-[15px] text-[#151515] dark:text-white mb-[16px]">Update strategy</h3>

                <div className="space-y-[14px]">
                  <div>
                    <p className="text-[12px] text-[#6a6e73] dark:text-[#a0a0a0] mb-[2px]">Update approval</p>
                    <div className="flex items-center gap-[6px]">
                      <p className="text-[14px] text-[#151515] dark:text-white">Manual</p>
                      <Edit2 className="size-[12px] text-[#6a6e73] dark:text-[#a0a0a0] cursor-pointer hover:text-[#0066cc]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#6a6e73] dark:text-[#a0a0a0] mb-[2px]">Update channel</p>
                    <div className="flex items-center gap-[6px]">
                      <p className="text-[14px] text-[#151515] dark:text-white">{selectedChannel}</p>
                      <Edit2 className="size-[12px] text-[#6a6e73] dark:text-[#a0a0a0] cursor-pointer hover:text-[#0066cc]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#6a6e73] dark:text-[#a0a0a0] mb-[2px]">Version</p>
                    <p className="text-[14px] text-[#151515] dark:text-white">{currentVersion}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#6a6e73] dark:text-[#a0a0a0] mb-[2px]">Cluster version</p>
                    <p className="text-[14px] text-[#151515] dark:text-white">{clusterVersion}</p>
                  </div>
                  <div className="pt-[8px] border-t border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                    <p className="text-[12px] text-[#6a6e73] dark:text-[#a0a0a0] mb-[4px]">Manage Subscription</p>
                    <Link to="/ecosystem/installed-operators" className="text-[13px] text-[#0066cc] dark:text-[#4dabf7] hover:underline flex items-center gap-[4px]">
                      Manage in OpenShift Cluster Management <ExternalLink className="size-[12px]" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "yaml" && (
          <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-[24px]">
            <pre className="text-[13px] font-mono text-[#151515] dark:text-[#e0e0e0] whitespace-pre-wrap">
{`apiVersion: operators.coreos.com/v1alpha1
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
            replicas: 1`}
            </pre>
          </div>
        )}

        {activeTab === "events" && (
          <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-[16px] p-[24px]">
            <div className="space-y-[12px]">
              {[
                { type: "Normal", reason: "InstallSucceeded", message: "install strategy completed with no errors", time: "2m ago" },
                { type: "Normal", reason: "AllCatalogSourcesHealthy", message: "all available catalogsources are healthy", time: "5m ago" },
                { type: "Warning", reason: "UpdateAvailable", message: `New version ${operator.newVersion} available in channel ${currentChannel}`, time: "1h ago" },
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