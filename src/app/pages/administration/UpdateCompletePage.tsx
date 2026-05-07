import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { CheckCircle } from "@/lib/pfIcons";
import {
  CLUSTER_CATALOG_OPERATOR_INSTALL_COUNT,
  CLUSTER_NODE_COUNT_UPDATED,
  CLUSTER_OPERATOR_UPDATES_TOTAL,
  CLUSTER_PLATFORM_OPERATOR_COUNT,
} from "../../constants/clusterUpdateDemoCounts";

export default function UpdateCompletePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const version = (location.state as any)?.version || "5.1.10";

  useEffect(() => {
    localStorage.removeItem("clusterUpdateInProgress");
  }, []);

  return (
    <div className="ocs-app-page-outer ocs-app-page-outer--end-3xl">
      {/* Success Banner */}
      <div className="flex flex-col items-center justify-center py-[48px] mb-[32px]">
        <div className="size-[72px] rounded-full bg-[rgba(62,134,53,0.1)] flex items-center justify-center mb-[20px]">
          <CheckCircle className="size-[40px] text-[#3e8635]" />
        </div>
        <h1 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[28px] mb-[8px] text-center">
          Cluster Updated Successfully
        </h1>
        <p className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[16px] font-['Red_Hat_Text:Regular',sans-serif] text-center">
          Your cluster has been updated to OpenShift {version}. All {CLUSTER_NODE_COUNT_UPDATED} worker nodes are healthy.
        </p>
      </div>

      {/* Post-Update Summary Card */}
      <div className="rounded-[16px] border border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)] p-[24px] mb-[32px] max-w-[640px] mx-auto">
        <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[18px] mb-[16px]">Post-Update Summary</h2>
        <div className="flex flex-col gap-[14px]">
          <Row label="Previous version" value="5.0.0" />
          <Row label="New version" value={version} valueColor="#3e8635" />
          <Row label="Duration" value="2 hours 12 minutes" />
          <Row
            label="Nodes updated"
            value={`${CLUSTER_NODE_COUNT_UPDATED} of ${CLUSTER_NODE_COUNT_UPDATED}`}
          />
          <Row
            label="Cluster operators updated"
            value={`${CLUSTER_PLATFORM_OPERATOR_COUNT} of ${CLUSTER_PLATFORM_OPERATOR_COUNT}`}
          />
          <Row
            label="Installed operators updated"
            value={`${CLUSTER_CATALOG_OPERATOR_INSTALL_COUNT} of ${CLUSTER_CATALOG_OPERATOR_INSTALL_COUNT}`}
          />
          <Row
            label="Operators updated (total)"
            value={`${CLUSTER_OPERATOR_UPDATES_TOTAL} of ${CLUSTER_OPERATOR_UPDATES_TOTAL}`}
          />
          <Row label="Downtime" value="Zero (rolling update)" valueColor="#3e8635" />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => navigate("/administration/cluster-update")}
          className="bg-[#0066cc] hover:bg-[#004080] text-white border-0 px-[24px] py-[10px] rounded-[8px] cursor-pointer text-[14px] font-['Red_Hat_Text:Regular',sans-serif] font-semibold transition-colors"
        >
          Return to Cluster Update
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-[4px] border-b border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)] last:border-0">
      <span className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[14px] font-['Red_Hat_Text:Regular',sans-serif]">{label}</span>
      <span
        className={`text-[14px] font-['Red_Hat_Mono:Regular',sans-serif] ${!valueColor ? 'text-[#151515] dark:text-white' : ''}`}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
    </div>
  );
}