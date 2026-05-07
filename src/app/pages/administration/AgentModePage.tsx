import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, CheckCircle, AlertTriangle } from "@/lib/pfIcons";

export default function AgentModePage() {
  const [channelPref, setChannelPref] = useState("fast");
  const [riskTolerance, setRiskTolerance] = useState("low-auto");

  const activityLog = [
    { time: "14:32", risk: "Low Risk", riskColor: "#3e8635", text: "Evaluated 5.1.10, auto-approved, scheduled for Apr 2 2026 02:00 UTC" },
    { time: "09:15", risk: null, riskColor: null, text: "Scanned upstream, found 5.1.10 (recommended)" },
    { time: "Mar 28", risk: "Medium Risk", riskColor: "#c58c00", text: "Evaluated 5.1.8, flagged for manual review" },
    { time: "Mar 25", risk: null, riskColor: null, text: "Health check complete, all nodes healthy" },
    { time: "Mar 22", risk: null, riskColor: "#3e8635", text: "Successfully updated 4.18.6 → 5.0.0, 1h 48m, zero downtime", success: true },
  ];

  return (
    <div className="ocs-app-page-outer ocs-app-page-outer--end-3xl">
      <Link to="/administration/cluster-settings" className="flex items-center gap-[6px] text-[#0066cc] dark:text-[#4dabf7] text-[14px] no-underline hover:underline mb-[16px] font-['Red_Hat_Text:Regular',sans-serif]">
        <ArrowLeft className="size-[16px]" /> Back to Cluster Settings
      </Link>

      <div className="flex items-center gap-[12px] mb-[24px]">
        <h1 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[28px]">
          Agent-Based Updates
        </h1>
        <span className="bg-[#6753ac] text-white text-[11px] px-[10px] py-[3px] rounded-[4px] font-semibold">PREVIEW</span>
      </div>

      {/* Agent Status Card */}
      <div className="rounded-[16px] p-[2px] bg-gradient-to-r from-[#6753ac] via-[#0066cc] to-[#009596] mb-[24px]">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-[14px] overflow-hidden">
          <div className="h-[4px] bg-gradient-to-r from-[#6753ac] via-[#0066cc] to-[#009596]" />
          <div className="p-6">
            <div className="flex items-center gap-[10px] mb-[12px]">
              <div className="size-[10px] rounded-full bg-[#3e8635] animate-pulse" />
              <span className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[16px]">Update Agent Active</span>
              <span className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[13px] font-['Red_Hat_Text:Regular',sans-serif]">Last check: 3 minutes ago</span>
            </div>
            <p className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[14px] font-['Red_Hat_Text:Regular',sans-serif] mb-[20px]">
              The update agent monitors upstream releases, evaluates risk, and manages cluster updates within your configured maintenance windows.
            </p>

            <div className="grid grid-cols-2 gap-x-[48px] gap-y-[14px]">
              <Row label="Current version" value="5.0.0" />
              <Row label="Next planned update" value="5.1.10 on Apr 2, 2026 02:00 UTC" />
              <Row label="Maintenance window" value="Tue-Thu 02:00-06:00 UTC" />
              <Row label="Auto-rollback" value="Enabled" valueColor="#3e8635" />
              <Row label="Approval mode" value="Auto-approve Low Risk / Manual for Medium+" />
            </div>
          </div>
        </div>
      </div>

      {/* Agent Activity Log */}
      <div className="rounded-[16px] border border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)] p-[24px] mb-[24px]">
        <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[18px] mb-[16px]">Agent Activity Log</h2>
        <div className="flex flex-col gap-[0]">
          {activityLog.map((entry, i) => (
            <div key={i} className="flex items-start gap-[16px] py-[12px] border-b border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)] last:border-0">
              <span className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[13px] font-['Red_Hat_Mono:Regular',sans-serif] w-[60px] shrink-0 text-right">{entry.time}</span>
              <div className="flex items-start gap-[10px] flex-1 min-w-0">
                {entry.risk && (
                  <span className="text-[11px] px-[8px] py-[2px] rounded-[4px] font-semibold shrink-0" style={{
                    backgroundColor: `${entry.riskColor}15`,
                    color: entry.riskColor!,
                  }}>
                    {entry.risk}
                  </span>
                )}
                <span className={`text-[14px] font-['Red_Hat_Text:Regular',sans-serif] ${
                  (entry as any).success ? 'text-[#3e8635]' : 'text-[#151515] dark:text-white'
                }`}>
                  {(entry as any).success && <CheckCircle className="size-[14px] inline mr-[4px] -mt-[2px]" />}
                  {entry.text}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Configuration */}
      <div className="rounded-[16px] border border-[#e0e0e0] dark:border-[rgba(255,255,255,0.1)] p-[24px]">
        <h2 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[18px] mb-[16px]">Agent Configuration</h2>
        <div className="flex flex-col gap-[16px] max-w-[480px]">
          <div>
            <label className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[13px] font-['Red_Hat_Text:Regular',sans-serif] mb-[4px] block">Channel preference</label>
            <select
              value={channelPref}
              onChange={(e) => setChannelPref(e.target.value)}
              className="w-full bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] rounded-[999px] px-[10px] py-[8px] text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] cursor-pointer"
            >
              <option value="fast">fast</option>
              <option value="stable">stable</option>
            </select>
          </div>
          <div>
            <label className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[13px] font-['Red_Hat_Text:Regular',sans-serif] mb-[4px] block">Risk tolerance</label>
            <select
              value={riskTolerance}
              onChange={(e) => setRiskTolerance(e.target.value)}
              className="w-full bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] rounded-[999px] px-[10px] py-[8px] text-[14px] text-[#151515] dark:text-white font-['Red_Hat_Text:Regular',sans-serif] cursor-pointer"
            >
              <option value="low-auto">Low only (auto)</option>
              <option value="medium-manual">Medium (manual)</option>
              <option value="all">All</option>
            </select>
          </div>
          <div>
            <label className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[13px] font-['Red_Hat_Text:Regular',sans-serif] mb-[4px] block">Notification channels</label>
            <p className="text-[#151515] dark:text-white text-[14px] font-['Red_Hat_Text:Regular',sans-serif]">
              Slack <code className="bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.05)] px-[4px] py-[1px] rounded text-[13px] font-['Red_Hat_Mono:Regular',sans-serif]">#ops-cluster-updates</code>, Email <code className="bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.05)] px-[4px] py-[1px] rounded text-[13px] font-['Red_Hat_Mono:Regular',sans-serif]">ops@acme.com</code>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-[16px] mt-[20px]">
          <button className="bg-transparent border border-[rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] text-[#151515] dark:text-white px-[20px] py-[10px] rounded-[8px] cursor-pointer text-[14px] font-['Red_Hat_Text:Regular',sans-serif] font-semibold hover:bg-[rgba(0,0,0,0.03)] dark:hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            Edit configuration
          </button>
          <button className="bg-transparent border-0 text-[#c9190b] px-[0] cursor-pointer text-[14px] font-['Red_Hat_Text:Regular',sans-serif] hover:underline">
            Disable agent
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div>
      <p className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[13px] font-['Red_Hat_Text:Regular',sans-serif] mb-[2px]">{label}</p>
      <p
        className={`text-[14px] font-['Red_Hat_Text:Regular',sans-serif] ${!valueColor ? 'text-[#151515] dark:text-white' : ''}`}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </p>
    </div>
  );
}