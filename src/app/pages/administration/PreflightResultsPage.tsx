import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { CheckCircle, AlertCircle, Sparkles, Download, Code2, Columns2, FileText, ChevronDown, ChevronUp, AlertTriangle } from "@/lib/pfIcons";
import Breadcrumbs from "../../components/Breadcrumbs";
import OperatorKebabMenu from "../../components/OperatorKebabMenu";
import NodeKebabMenu from "../../components/NodeKebabMenu";
import OperatorUpdateModal from "../../components/OperatorUpdateModal";
import OperatorUninstallModal from "../../components/OperatorUninstallModal";
import { useChat } from "../../contexts/ChatContext";
import { ConsoleYamlEditor } from "../../components/console/ConsoleYamlEditor";

type ViewMode = "form" | "split" | "yaml";

const PREFLIGHT_CLUSTER_YAML = `apiVersion: config.openshift.io/v1
kind: ClusterVersion
metadata:
  name: version
spec:
  channel: candidate-4.22
  clusterID: e3b0c442-98fc-1c14-b39f-92d1282b8e23
  desiredUpdate:
    version: 4.22.0
    image: quay.io/openshift-release-dev/ocp-release@sha256:abcd1234
  upstream: https://api.openshift.com/api/upgrades_info/v1/graph
---
apiVersion: v1
kind: Namespace
metadata:
  name: openshift-operators
---
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: airflow-helm-operator
  namespace: openshift-operators
spec:
  channel: stable
  installPlanApproval: Automatic
  name: airflow-helm-operator
  source: community-operators
  sourceNamespace: openshift-marketplace
  startingCSV: airflow-helm-operator.v2.4.0
---
apiVersion: config.openshift.io/v1
kind: Infrastructure
metadata:
  name: cluster
spec:
  platformSpec:
    type: AWS
status:
  apiServerURL: https://api.prod-cluster.example.com:6443
  etcdDiscoveryDomain: prod-cluster.example.com
  infrastructureName: prod-cluster-xyz123
  platform: AWS`;

// Cluster update pre-check results page
export default function PreflightResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsOpen: setIsAIOpen } = useChat();
  const [viewMode, setViewMode] = useState<ViewMode>("form");
  const [isClusterHealthExpanded, setIsClusterHealthExpanded] = useState(true);
  const [isAPIChangesExpanded, setIsAPIChangesExpanded] = useState(true);
  const [isOperatorReadinessExpanded, setIsOperatorReadinessExpanded] = useState(true);
  const [isWorkerNodesExpanded, setIsWorkerNodesExpanded] = useState(true);
  
  // Modals state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showUninstallModal, setShowUninstallModal] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<{name: string; version: string; targetVersion?: string} | null>(null);

  const clusterHealth = [
    { name: "All nodes healthy", status: "Ready", icon: <CheckCircle className="size-[16px] text-[#3e8635]" /> },
    { name: "Storage available", status: "Ready", icon: <CheckCircle className="size-[16px] text-[#3e8635]" /> },
    { name: "Network connectivity", status: "Ready", icon: <CheckCircle className="size-[16px] text-[#3e8635]" /> },
    { name: "API server response", status: "Ready", icon: <CheckCircle className="size-[16px] text-[#3e8635]" /> },
    { name: "RBAC", status: "Ready", icon: <CheckCircle className="size-[16px] text-[#3e8635]" /> },
  ];

  const apiChanges = [
    { 
      name: "oauthv1.DevelopmentInfo", 
      status: "Ready", 
      action: "None", 
      icon: <CheckCircle className="size-[16px] text-[#3e8635]" />,
    },
    { 
      name: "networking.k8s.io/v1beta1", 
      status: "Ready", 
      action: "None", 
      icon: <CheckCircle className="size-[16px] text-[#3e8635]" />,
    },
    { 
      name: "rbac.authorization.k8s.io/v1beta1", 
      status: "Review", 
      action: "Verify permissions", 
      icon: <AlertCircle className="size-[16px] text-[#ff9800]" />,
    },
  ];

  const operators = [
    { 
      name: "Abot Operator-v3.0.0", 
      status: "Ready", 
      version: "3.0.0", 
      icon: <CheckCircle className="size-[16px] text-[#3e8635]" />,
      updateAvailable: false
    },
    { 
      name: "Airflow Helm Operator", 
      status: "Ready", 
      version: "2.1.0", 
      icon: <CheckCircle className="size-[16px] text-[#3e8635]" />,
      updateAvailable: false
    },
    { 
      name: "Ansible Automation Platform", 
      status: "Pending", 
      version: "3.1.0", 
      icon: <AlertCircle className="size-[16px] text-[#ff9800]" />,
      updateAvailable: true,
      updateVersion: "3.2.0"
    },
  ];

  const workerNodes = [
    {
      name: "worker-east",
      status: "Update available",
      version: "4.18.16",
      compatibility: "compatible",
      icon: <AlertCircle className="size-[16px] text-[#0066cc]" />
    }
  ];

  const handleUpdateOperator = (operatorName: string, currentVersion: string, targetVersion?: string) => {
    setSelectedOperator({ name: operatorName, version: currentVersion, targetVersion });
    setShowUpdateModal(true);
  };

  const handleUninstallOperator = (operatorName: string, currentVersion: string) => {
    setSelectedOperator({ name: operatorName, version: currentVersion });
    setShowUninstallModal(true);
  };

  const handleSimulateError = () => {
    // Navigate to preflight failed page with simulated errors
    navigate('/administration/cluster-update/preflight-failed', {
      state: { aiMode: false, errorType: 'storage' }
    });
  };

  const handleUpdateWithAI = () => {
    setIsAIOpen(true);
  };

  const handleUpdateCluster = () => {
    navigate('/administration/cluster-update/in-progress');
  };

  const handleExportPreCheck = () => {
    const reportContent = `OpenShift Cluster Update Pre-check Report
Generated: ${new Date().toLocaleString()}

CLUSTER DETAILS
Cluster ID: b861eae3-b06c-4ab2-8fa7-54b89a2bf4b2
Current Version: 4.21.0
Target Version: 4.22.0
Target Channel: candidate-4.22

PRE-CHECK RESULTS
Status: PASSED
Estimated Update Time: 2 hours 12 minutes

CLUSTER HEALTH
✓ All nodes healthy - Ready
✓ Storage available - Ready
✓ Network connectivity - Ready
✓ API server response - Ready
✓ RBAC - Ready

API CHANGES IN NEXT UPDATE
✓ oauthv1.DevelopmentInfo - Ready (No action required)
✓ networking.k8s.io/v1beta1 - Ready (No action required)
⚠ rbac.authorization.k8s.io/v1beta1 - Review (Verify permissions)

OPERATOR READINESS
✓ Abot Operator-v3.0.0 (v3.0.0) - Ready
✓ Airflow Helm Operator (v2.1.0) - Ready
⚠ Ansible Automation Platform (v3.1.0) - Pending (Update to v3.2.0)

WORKER NODES
⚠ worker-east - Update available (v4.18.16)

---
Report generated by OpenShift LightSpeed AI
`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cluster-update-pre-check-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const ActionButtons = () => (
    <div className="flex gap-[12px] flex-wrap">
      <button
        onClick={handleUpdateCluster}
        className="bg-[#0066cc] hover:bg-[#004080] dark:bg-[#4dabf7] dark:hover:bg-[#339af0] text-white px-[20px] py-[10px] rounded-[8px] font-semibold text-[14px] transition-colors"
      >
        Update cluster
      </button>
      <button
        onClick={handleUpdateWithAI}
        className="bg-white dark:bg-[rgba(255,255,255,0.05)] border-2 border-[#0066cc] dark:border-[#4dabf7] text-[#0066cc] dark:text-[#4dabf7] px-[20px] py-[10px] rounded-[8px] font-semibold text-[14px] transition-colors flex items-center gap-[8px] hover:bg-[rgba(0,102,204,0.05)] dark:hover:bg-[rgba(79,171,247,0.1)]"
      >
        <Sparkles className="size-[16px]" />
        Update with AI
      </button>
      <button 
        onClick={handleExportPreCheck}
        className="bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] text-[#151515] dark:text-white px-[20px] py-[10px] rounded-[8px] font-semibold text-[14px] hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.08)] transition-colors flex items-center gap-[8px]"
      >
        <Download className="size-[16px]" />
        Export cluster update pre-check
      </button>
      <button 
        onClick={handleSimulateError}
        className="bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] text-[#c9190b] dark:text-[#ee0000] px-[20px] py-[10px] rounded-[8px] font-semibold text-[14px] hover:bg-[rgba(201,25,11,0.05)] dark:hover:bg-[rgba(201,25,11,0.15)] transition-colors flex items-center gap-[8px]"
      >
        <AlertTriangle className="size-[16px]" />
        Simulate errors
      </button>
      <button
        onClick={() => navigate('/administration/cluster-settings')}
        className="text-[#0066cc] dark:text-[#4dabf7] hover:underline font-semibold text-[14px] px-[12px]"
      >
        Cancel
      </button>
    </div>
  );

  const FormView = () => (
    <div className="grid grid-cols-1 gap-[24px]">
      {/* Cluster Health */}
      <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] rounded-[16px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.06)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
        <button
          onClick={() => setIsClusterHealthExpanded(!isClusterHealthExpanded)}
          className="w-full p-[24px] flex items-center gap-[12px] hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors rounded-t-[16px]"
        >
          {isClusterHealthExpanded ? (
            <ChevronUp className="size-[20px] text-[#4d4d4d] dark:text-[#b0b0b0]" />
          ) : (
            <ChevronDown className="size-[20px] text-[#4d4d4d] dark:text-[#b0b0b0]" />
          )}
          <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[18px] text-[#151515] dark:text-white">
            Cluster Health
          </h3>
        </button>
        {isClusterHealthExpanded && (
          <div className="px-[24px] pb-[24px]">
            <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[16px]">
              Review the health status of your cluster components before proceeding with the update.
            </p>
            <div className="space-y-[12px]">
              {clusterHealth.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-[12px] bg-white dark:bg-[rgba(255,255,255,0.03)] rounded-[8px]">
                  <div className="flex items-center gap-[12px]">
                    {item.icon}
                    <p className="text-[14px] text-[#151515] dark:text-white font-semibold">{item.name}</p>
                  </div>
                  <span className="px-[10px] py-[4px] bg-[#e8f5e9] dark:bg-[rgba(62,134,53,0.15)] text-[#3e8635] dark:text-[#81c784] rounded-[999px] text-[12px] font-semibold">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* API Changes */}
      <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] rounded-[16px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.06)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
        <button
          onClick={() => setIsAPIChangesExpanded(!isAPIChangesExpanded)}
          className="w-full p-[24px] flex items-center gap-[12px] hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors rounded-t-[16px]"
        >
          {isAPIChangesExpanded ? (
            <ChevronUp className="size-[20px] text-[#4d4d4d] dark:text-[#b0b0b0]" />
          ) : (
            <ChevronDown className="size-[20px] text-[#4d4d4d] dark:text-[#b0b0b0]" />
          )}
          <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[18px] text-[#151515] dark:text-white">
            API Changes in Next Update
          </h3>
        </button>
        {isAPIChangesExpanded && (
          <div className="px-[24px] pb-[24px]">
            <p className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0] mb-[16px]">
              Review API changes that will occur during the update. Some APIs may require action before update.
            </p>
            <div className="space-y-[12px]">
              {apiChanges.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-[12px] bg-white dark:bg-[rgba(255,255,255,0.03)] rounded-[8px]">
                  <div className="flex items-center gap-[12px] flex-1">
                    {item.icon}
                    <div className="flex-1">
                      <p className="text-[14px] text-[#151515] dark:text-white font-semibold">{item.name}</p>
                      <p className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0]">{item.action}</p>
                    </div>
                  </div>
                  <span className={`px-[10px] py-[4px] rounded-[999px] text-[12px] font-semibold ${
                    item.status === "Ready" 
                      ? "bg-[#e8f5e9] dark:bg-[rgba(62,134,53,0.15)] text-[#3e8635] dark:text-[#81c784]"
                      : "bg-[#fff4e5] dark:bg-[rgba(255,152,0,0.15)] text-[#ff9800] dark:text-[#ffb74d]"
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Operator Readiness */}
      <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] rounded-[16px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.06)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
        <button
          onClick={() => setIsOperatorReadinessExpanded(!isOperatorReadinessExpanded)}
          className="w-full p-[24px] flex items-center gap-[12px] hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors rounded-t-[16px]"
        >
          {isOperatorReadinessExpanded ? (
            <ChevronUp className="size-[20px] text-[#4d4d4d] dark:text-[#b0b0b0]" />
          ) : (
            <ChevronDown className="size-[20px] text-[#4d4d4d] dark:text-[#b0b0b0]" />
          )}
          <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[18px] text-[#151515] dark:text-white">
            Operator Readiness
          </h3>
        </button>
        {isOperatorReadinessExpanded && (
          <div className="px-[24px] pb-[24px]">
            <div className="space-y-[12px]">
              {operators.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-[12px] bg-white dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] group">
                  <div className="flex items-center gap-[12px] flex-1">
                    {item.icon}
                    <div className="flex-1">
                      <p className="text-[14px] text-[#151515] dark:text-white font-semibold">{item.name}</p>
                      <p className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0]">Version {item.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-[12px]">
                    <span className={`px-[10px] py-[4px] rounded-[999px] text-[12px] font-semibold ${
                      item.status === "Ready" 
                        ? "bg-[#e8f5e9] dark:bg-[rgba(62,134,53,0.15)] text-[#3e8635] dark:text-[#81c784]"
                        : "bg-[#fff4e5] dark:bg-[rgba(255,152,0,0.15)] text-[#ff9800] dark:text-[#ffb74d]"
                    }`}>
                      {item.status}
                    </span>
                    <OperatorKebabMenu
                      operatorName={item.name}
                      operatorVersion={item.version}
                      updateAvailable={item.updateAvailable}
                      updateVersion={item.updateVersion}
                      onUpdate={() => handleUpdateOperator(item.name, item.version, item.updateVersion)}
                      onUninstall={() => handleUninstallOperator(item.name, item.version)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Worker Nodes */}
      <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] rounded-[16px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.06)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
        <button
          onClick={() => setIsWorkerNodesExpanded(!isWorkerNodesExpanded)}
          className="w-full p-[24px] flex items-center gap-[12px] hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.02)] transition-colors rounded-t-[16px]"
        >
          {isWorkerNodesExpanded ? (
            <ChevronUp className="size-[20px] text-[#4d4d4d] dark:text-[#b0b0b0]" />
          ) : (
            <ChevronDown className="size-[20px] text-[#4d4d4d] dark:text-[#b0b0b0]" />
          )}
          <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[18px] text-[#151515] dark:text-white">
            Worker Nodes
          </h3>
        </button>
        {isWorkerNodesExpanded && (
          <div className="px-[24px] pb-[24px]">
            <div className="bg-[#fffbf0] dark:bg-[rgba(255,152,0,0.1)] border border-[#ffb300] dark:border-[#ffb74d] rounded-[8px] p-[12px] mb-[16px]">
              <p className="text-[13px] text-[#151515] dark:text-white">
                1 or more node pool update required.
              </p>
            </div>
            <div className="space-y-[12px]">
              {workerNodes.map((node, index) => (
                <div key={index} className="flex items-center justify-between p-[12px] bg-white dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] group">
                  <div className="flex items-center gap-[12px] flex-1">
                    {node.icon}
                    <div className="flex-1">
                      <p className="text-[14px] text-[#151515] dark:text-white font-semibold">{node.name}</p>
                      <p className="text-[12px] text-[#4d4d4d] dark:text-[#b0b0b0]">Version {node.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-[12px]">
                    <span className="px-[10px] py-[4px] rounded-[999px] text-[12px] font-semibold bg-[#e7f1fa] dark:bg-[rgba(43,154,243,0.15)] text-[#0066cc] dark:text-[#4dabf7]">
                      {node.status}
                    </span>
                    <NodeKebabMenu
                      nodeName={node.name}
                      onDrain={() => console.log('Drain', node.name)}
                      onRestart={() => console.log('Restart', node.name)}
                      onDelete={() => console.log('Delete', node.name)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const YAMLView = () => (
    <ConsoleYamlEditor
      initialYaml={PREFLIGHT_CLUSTER_YAML}
      editable={false}
      downloadFileName="cluster-preflight-resources.yaml"
      ariaLabel="Cluster resources YAML"
    />
  );

  const SplitView = () => (
    <div className="grid grid-cols-2 gap-[24px]">
      <div className="space-y-[24px]">
        <FormView />
      </div>
      <div className="sticky top-[24px] h-fit">
        <YAMLView />
      </div>
    </div>
  );

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
        <Breadcrumbs
          items={[
            { label: "Home", path: "/" },
            { label: "Administrator" },
            { label: "Cluster Settings", path: "/administration/cluster-settings" },
            { label: "Pre-check Results" },
          ]}
        >

        <div className="mb-[24px]">
          <h1 className="font-['Red_Hat_Display_VF:Medium',sans-serif] font-medium leading-[36.4px] text-[#151515] dark:text-white text-[28px] mb-[16px]">
            Cluster Update
          </h1>
          <div className="flex gap-[24px] text-[14px] border-b border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
            <button
              className="pb-[12px] border-b-2 border-[#0066cc] dark:border-[#4dabf7] font-semibold text-[#151515] dark:text-white -mb-[1px]"
            >
              Update plan
            </button>
            <button
              className="pb-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] hover:text-[#151515] dark:hover:text-white"
              onClick={() => navigate('/administration/cluster-update/operators')}
            >
              Cluster operators
            </button>
            <button 
              className="pb-[12px] text-[#4d4d4d] dark:text-[#b0b0b0] hover:text-[#151515] dark:hover:text-white"
              onClick={() => navigate('/administration/cluster-update/history')}
            >
              Update history
            </button>
          </div>
        </div>

        {/* Success Banner with Estimated Time */}
        <div className="bg-[#e7f1fa] dark:bg-[rgba(43,154,243,0.1)] border-2 border-[#0066cc] dark:border-[#4dabf7] rounded-[16px] p-[24px] mb-[32px]">
          <div className="flex items-center gap-[12px] mb-[12px]">
            <svg className="size-[20px]" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" className="text-[#0066cc] dark:text-[#4dabf7]"/>
              <path d="M10 5v5l3 3" stroke="currentColor" strokeWidth="2" className="text-[#0066cc] dark:text-[#4dabf7]"/>
            </svg>
            <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[16px] text-[#151515] dark:text-white">
              Estimated update time 2 hours 12 minutes
            </h3>
          </div>
          <p className="text-[14px] text-[#151515] dark:text-white mb-[16px]">
            This is a rough estimate and will vary based on resource availability and usage.
          </p>
          <ActionButtons />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-end mb-[24px]">
          <div className="flex items-center gap-[12px]">
            <span className="text-[14px] text-[#4d4d4d] dark:text-[#b0b0b0]">Configure via</span>
            <div className="flex gap-[8px]">
              <button
                onClick={() => setViewMode("form")}
                className={`px-[16px] py-[8px] rounded-[999px] font-semibold text-[14px] transition-colors flex items-center gap-[8px] ${
                  viewMode === "form"
                    ? "bg-[#0066cc] dark:bg-[#4dabf7] text-white"
                    : "bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] text-[#151515] dark:text-white hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.08)]"
                }`}
              >
                <FileText className="size-[16px]" />
                Form
              </button>
              <button
                onClick={() => setViewMode("yaml")}
                className={`px-[16px] py-[8px] rounded-[999px] font-semibold text-[14px] transition-colors flex items-center gap-[8px] ${
                  viewMode === "yaml"
                    ? "bg-[#0066cc] dark:bg-[#4dabf7] text-white"
                    : "bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] text-[#151515] dark:text-white hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.08)]"
                }`}
              >
                <Code2 className="size-[16px]" />
                YAML
              </button>
              <button
                onClick={() => setViewMode("split")}
                className={`px-[16px] py-[8px] rounded-[999px] font-semibold text-[14px] transition-colors flex items-center gap-[8px] ${
                  viewMode === "split"
                    ? "bg-[#0066cc] dark:bg-[#4dabf7] text-white"
                    : "bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] text-[#151515] dark:text-white hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.08)]"
                }`}
              >
                <Columns2 className="size-[16px]" />
                Split
              </button>
            </div>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === "form" && <FormView />}
        {viewMode === "yaml" && <YAMLView />}
        {viewMode === "split" && <SplitView />}

        {/* Bottom Action Buttons */}
        <div className="mt-[32px] pt-[24px] border-t border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
          <ActionButtons />
        </div>
        </Breadcrumbs>

      {/* Modals */}
      {selectedOperator && (
        <>
          <OperatorUpdateModal
            isOpen={showUpdateModal}
            onClose={() => {
              setShowUpdateModal(false);
              setSelectedOperator(null);
            }}
            operatorName={selectedOperator.name}
            currentVersion={selectedOperator.version}
            targetVersion={selectedOperator.targetVersion || ""}
          />

          <OperatorUninstallModal
            isOpen={showUninstallModal}
            onClose={() => {
              setShowUninstallModal(false);
              setSelectedOperator(null);
            }}
            operatorName={selectedOperator.name}
            operatorVersion={selectedOperator.version}
          />
        </>
      )}

    </div>
  );
}