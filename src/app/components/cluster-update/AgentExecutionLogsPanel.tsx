import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Button,
  Content,
  Switch,
  Title,
} from "@patternfly/react-core";
import { X } from "@/lib/pfIcons";
import { AiAgentLogsHeading } from "../lightspeed/LightspeedLegalCopy";

/** Simulated agent analysis lines (tool_use / thinking), aligned with console-style agent output. */
const AGENT_ANALYSIS_LINES: string[] = [
  "2026-04-15T17:28:02.184231891Z [sdk:analysis] thinking: Need ClusterVersion, channel, and PLCC data before proposing target.",
  '2026-04-15T17:28:14.552109004Z [sdk:analysis] tool_use: Bash({"cmd":"curl -sSk https://api.openshift.com/api/upgrades_info/v1/graph?channel=fast-5.1"})',
  "2026-04-15T17:28:18.901442221Z [sdk:analysis] thinking: Parsing Cincinnati graph for edges into 5.1.10.",
  '2026-04-15T17:29:44.112883554Z [sdk:analysis] tool_use: Bash({"cmd":"oc get clusterversion -o json"})',
  "2026-04-15T17:30:16.124654354Z [sdk:analysis] thinking: Now I have all the data I need. Checking container-security-operator PLCC entry for the target payload.",
  '2026-04-15T17:30:42.008221441Z [sdk:analysis] tool_use: Bash({"cmd":"oc get operators -A -o json | python3 -c \"import sys,json;…\"" })',
  "2026-04-15T17:31:05.661098773Z [sdk:analysis] thinking: Compatibility summary built; emitting proposed plan with maintenance window and risk score.",
];

/**
 * Platform cluster operator reconcile order (no run-level grouping) — must complete before catalog operators in logs.
 * Names align with OpenShift clusteroperator resources.
 */
export const PLATFORM_CLUSTER_OPERATORS = [
  "config-operator",
  "etcd",
  "kube-apiserver",
  "kube-controller-manager",
  "kube-scheduler",
  "cloud-controller-manager",
  "control-plane-machine-set",
  "machine-api",
  "baremetal",
  "cloud-credential",
  "authentication",
  "cluster-autoscaler",
  "csi-snapshot-controller",
  "image-registry",
  "ingress",
  "kube-storage-version-migrator",
  "machine-approver",
  "monitoring",
  "node-tuning",
  "openshift-apiserver",
  "openshift-controller-manager",
  "openshift-samples",
  "storage",
  "console",
  "insights",
  "operator-lifecycle-manager",
  "operator-lifecycle-manager-catalog",
  "operator-lifecycle-manager-packageserver",
  "marketplace",
  "service-ca",
  "network",
  "dns",
  "machine-config",
] as const;

function formatElapsedSec(totalSec: number): string {
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function buildClusterProgressLines(): { ts: string; level: string; msg: string }[] {
  const rows: { ts: string; level: string; msg: string }[] = [];
  let elapsed = 1;

  const push = (level: string, msg: string, stepSec = 2) => {
    rows.push({ ts: formatElapsedSec(elapsed), level, msg });
    elapsed += stepSec;
  };

  push("info", "ClusterVersion operator initiated update to {version}", 1);
  push("info", "Setting desiredUpdate.version={version}, channel=fast-5.1", 1);
  push("info", "Reconciling ClusterVersion: status=Progressing", 2);
  push("info", "Downloading release image quay.io/openshift-release-dev/ocp-release:{version}-x86_64", 7);
  push("info", "Release image verified. Signature OK.", 2);
  push("info", "Beginning cluster operator updates (platform payload order; catalog operators follow).", 2);

  for (const name of PLATFORM_CLUSTER_OPERATORS) {
    push("info", `Updating cluster operator: ${name} (5.0.0 → {version})`, 2);
    push("info", `Cluster operator ${name}: reconcile complete — now at {version}`, 1);
  }

  push(
    "info",
    "All platform cluster operators reconciled. Beginning catalog operator and subscription updates…",
    3,
  );

  push("info", "Updating catalog operator: Abot Operator-v3.0.0 → 3.2.5", 2);
  push("info", "Updating catalog operator: Airflow Helm Operator → 3.5", 2);
  push("info", "Updating catalog operator: Ansible Automation Platform → 3.25", 2);
  push("warn", "Catalog operator Bare Metal Event Relay: waiting for dependency resolution", 2);
  push("info", "Catalog operator Abot Operator-v3.0.0 update complete", 2);
  push("info", "Catalog operator Airflow Helm Operator update complete", 2);
  push("info", "Catalog operator Ansible Automation Platform update complete", 2);
  push("info", "Catalog operator Bare Metal Event Relay: dependency resolved; update complete", 2);

  push("info", "Beginning worker node updates…", 3);
  push("info", "Cordoning worker-east-1. Draining pods…", 3);
  push("info", "Worker worker-east-1 drained. Applying update…", 4);
  push("info", "Worker worker-east-1 rebooting with new OS image", 5);
  push("info", "Worker worker-east-1 update complete. Uncordoning.", 3);
  push("info", "Node worker-east-1 Ready. Continuing worker pool rollout…", 2);
  push("info", "Cordoning worker-east-2. Draining pods…", 3);
  push("info", "Worker worker-east-2 drained. Applying update…", 4);
  push("info", "Worker worker-east-2 rebooting with new OS image", 5);
  push("info", "Worker worker-east-2 update complete. Uncordoning.", 3);
  push("info", "MachineConfigPool worker: all nodes updated and Ready", 2);
  push("info", "Cluster operators: Available=True, Progressing=False", 3);
  push("info", "ClusterVersion: status=Available; desired version {version} reconciled", 3);
  push("info", "Cluster update finished successfully. OpenShift {version} is active.", 3);

  return rows;
}

const CLUSTER_PROGRESS_LINES: { ts: string; level: string; msg: string }[] = buildClusterProgressLines();

const CLUSTER_PROGRESS_LINE_COUNT = CLUSTER_PROGRESS_LINES.length;

/**
 * Post-success agent / verification lines — streamed after main cluster log + finale, with longer delays
 * so the log feels like it keeps reporting briefly after the update completes.
 */
function buildCompletionEpilogueLines(): { ts: string; level: string; msg: string }[] {
  const startMm = 45;
  let ss = 18;
  const rows: { ts: string; level: string; msg: string }[] = [];
  const push = (level: string, msg: string, step = 3) => {
    rows.push({
      ts: `${String(startMm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`,
      level,
      msg,
    });
    ss += step;
  };
  push("info", "Running post-update validation: console routes, samples, and default SCCs…");
  push("info", "Cluster extensions catalog refreshed; subscription health OK.");
  push("warn", "Insights operator: advisory bundle refresh delayed 12s (within SLA).");
  push("info", "Agent policy engine: recording successful plan execution (plan hash verified).");
  push("info", "Emitting completion webhook to notification channels (if configured).");
  push("info", "Agent log stream idle — cluster update and follow-up checks complete.");
  return rows;
}

const COMPLETION_EPILOGUE_LINES: { ts: string; level: string; msg: string }[] = buildCompletionEpilogueLines();

const COMPLETION_EPILOGUE_LINE_COUNT = COMPLETION_EPILOGUE_LINES.length;

/** Last N lines declare full cluster success — withheld until UI progress catches up (in-progress page). */
export const CLUSTER_PROGRESS_FINALE_LINE_COUNT = 4;

export const CLUSTER_PROGRESS_BODY_LINES = CLUSTER_PROGRESS_LINES.slice(0, -CLUSTER_PROGRESS_FINALE_LINE_COUNT);

const CLUSTER_PROGRESS_FINALE_LINES = CLUSTER_PROGRESS_LINES.slice(-CLUSTER_PROGRESS_FINALE_LINE_COUNT);

/** Indices derived from generated log text so progress mapping stays aligned with {@link CLUSTER_PROGRESS_LINES}. */
const CLUSTER_LOG_SEGMENTS = (() => {
  const L = CLUSTER_PROGRESS_LINES;
  const iBegin = L.findIndex((l) => l.msg.includes("Beginning cluster operator updates"));
  const iAll = L.findIndex((l) => l.msg.includes("All platform cluster operators reconciled"));
  const iWorker = L.findIndex((l) => l.msg.includes("Beginning worker node updates"));
  const bodyLastIdx = CLUSTER_PROGRESS_LINE_COUNT - CLUSTER_PROGRESS_FINALE_LINE_COUNT - 1;
  return {
    iBegin: Math.max(0, iBegin),
    iAll: Math.max(0, iAll),
    iWorker: Math.max(0, iWorker),
    bodyLastIdx,
  };
})();

/**
 * Maps dashboard progress bars (cluster operators → catalog operators → worker pools) to how many
 * cluster log lines should be visible. Finale lines only apply when releaseCompletion is true and all phases complete.
 */
export function clusterVisibleLineCountFromDashboard(
  controlPct: number,
  operatorPct: number,
  workerPct: number,
  releaseCompletion: boolean,
): number {
  const { iBegin, iAll, iWorker, bodyLastIdx } = CLUSTER_LOG_SEGMENTS;
  if (iBegin < 0 || iAll < 0 || iWorker < 0) {
    const avg = (controlPct + operatorPct + workerPct) / 300;
    let n = Math.round(avg * CLUSTER_PROGRESS_LINE_COUNT);
    if (!releaseCompletion) {
      n = Math.min(n, CLUSTER_PROGRESS_LINE_COUNT - CLUSTER_PROGRESS_FINALE_LINE_COUNT);
    } else if (controlPct >= 100 && operatorPct >= 100 && workerPct >= 100) {
      n = CLUSTER_PROGRESS_LINE_COUNT;
    }
    return Math.max(1, n);
  }

  const nPlatform = Math.max(0, iAll - iBegin - 1);
  const nCatalog = Math.max(0, iWorker - iAll - 1);
  const workerSpan = Math.max(0, bodyLastIdx - (iWorker - 1));

  let lastIdx: number;

  if (controlPct < 100) {
    const p = Math.round((controlPct / 100) * nPlatform);
    lastIdx = iBegin + p;
  } else if (operatorPct < 100) {
    const c = Math.round((operatorPct / 100) * nCatalog);
    lastIdx = iAll + c;
  } else {
    const w = Math.round((workerPct / 100) * workerSpan);
    lastIdx = iWorker - 1 + w;
  }

  lastIdx = Math.min(Math.max(lastIdx, 0), CLUSTER_PROGRESS_LINE_COUNT - 1);

  if (!releaseCompletion) {
    lastIdx = Math.min(lastIdx, bodyLastIdx);
  } else if (controlPct >= 100 && operatorPct >= 100 && workerPct >= 100) {
    lastIdx = CLUSTER_PROGRESS_LINE_COUNT - 1;
  }

  return lastIdx + 1;
}

/** Rotating activity lines while cluster UI is still catching up (inserted after body, before finale). */
const ACTIVITY_PULSE_MESSAGES = [
  "Cluster operators reconciling; operands progressing…",
  "MachineConfigPools and DaemonSets still rolling…",
  "Monitoring ClusterVersion Progressing status…",
  "Worker pools: cordon/drain cycle in progress…",
  "Verifying API availability and etcd quorum…",
  "Catalog subscriptions reconciling after platform sync…",
];

function formatActivityTs(holdIndex: number): string {
  const baseSec = 6 * 60 + 49;
  const t = baseSec + holdIndex;
  const mm = Math.floor(t / 60);
  const ss = t % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function activityPulseEntry(holdIndex: number): { ts: string; level: string; msg: string } {
  return {
    ts: formatActivityTs(holdIndex),
    level: "info",
    msg: ACTIVITY_PULSE_MESSAGES[holdIndex % ACTIVITY_PULSE_MESSAGES.length],
  };
}

export interface AgentExecutionLogsPanelProps {
  version: string;
  onClose: () => void;
  /** When false, panel is not mounted (parent controls visibility). */
  isOpen: boolean;
  /** Plan number shown in log header (e.g. matches proposed plan # on Cluster Update). */
  planSerial?: number;
  /**
   * When false, finale lines stay queued until the cluster UI reports full completion (all phases done).
   * Default true — full stream for update-plan / approvals.
   */
  releaseCompletionLogLines?: boolean;
  /**
   * When set (e.g. Cluster Update in-progress page), visible log lines follow cluster / catalog / worker progress
   * instead of replaying from line one each time the panel opens.
   */
  dashboardProgress?: {
    operatorPct: number;
    controlPct: number;
    workerPct: number;
  };
}

/**
 * Slide-over panel: agent analysis (tool_use / thinking) plus cluster update progress lines.
 * Answers “how do I see agent execution details?” from update flows.
 */
export default function AgentExecutionLogsPanel({
  version,
  onClose,
  isOpen,
  planSerial = 13,
  releaseCompletionLogLines = true,
  dashboardProgress,
}: AgentExecutionLogsPanelProps) {
  const agentLen = AGENT_ANALYSIS_LINES.length;
  const bodyLen = CLUSTER_PROGRESS_BODY_LINES.length;
  const finaleLen = CLUSTER_PROGRESS_FINALE_LINE_COUNT;
  const epilogueLen = COMPLETION_EPILOGUE_LINE_COUNT;

  const [visibleCount, setVisibleCount] = useState(1);
  const [autoScroll, setAutoScroll] = useState(true);
  /** When panel opens on in-progress page, stream uses body + rolling activity lines until UI completes. */
  const [useHoldLayout, setUseHoldLayout] = useState(false);
  /** Frozen count of activity lines once cluster UI reports complete (hold mode). */
  const pulseFrozenRef = useRef<number | null>(null);
  const prevIsOpenRef = useRef(false);

  const autoScrollRef = useRef(autoScroll);
  autoScrollRef.current = autoScroll;
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logScrollRef = useRef<HTMLDivElement>(null);
  const logContentRef = useRef<HTMLDivElement>(null);

  const syncCp = dashboardProgress?.controlPct;
  const syncOp = dashboardProgress?.operatorPct;
  const syncWn = dashboardProgress?.workerPct;

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      pulseFrozenRef.current = null;
      setUseHoldLayout(!releaseCompletionLogLines);
      if (
        dashboardProgress &&
        syncCp !== undefined &&
        syncOp !== undefined &&
        syncWn !== undefined
      ) {
        const cc = clusterVisibleLineCountFromDashboard(syncCp, syncOp, syncWn, releaseCompletionLogLines);
        setVisibleCount(agentLen + cc);
      } else {
        setVisibleCount(1);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, releaseCompletionLogLines, agentLen, syncCp, syncOp, syncWn]);

  /** Advance log tail when dashboard progress moves forward (panel may stay open). */
  useEffect(() => {
    if (!isOpen || syncCp === undefined || syncOp === undefined || syncWn === undefined) {
      return;
    }
    const cc = clusterVisibleLineCountFromDashboard(syncCp, syncOp, syncWn, releaseCompletionLogLines);
    const target = agentLen + cc;
    setVisibleCount((v) => Math.max(v, target));
  }, [isOpen, syncCp, syncOp, syncWn, releaseCompletionLogLines, agentLen]);

  const streamEndVisible = useMemo(() => {
    if (!useHoldLayout) {
      return agentLen + CLUSTER_PROGRESS_LINE_COUNT + epilogueLen;
    }
    if (!releaseCompletionLogLines) {
      return Number.MAX_SAFE_INTEGER;
    }
    if (pulseFrozenRef.current === null) {
      const slots = Math.max(0, visibleCount - agentLen);
      pulseFrozenRef.current = Math.max(0, slots - bodyLen);
    }
    return agentLen + bodyLen + (pulseFrozenRef.current ?? 0) + finaleLen + epilogueLen;
  }, [useHoldLayout, releaseCompletionLogLines, visibleCount, agentLen, bodyLen, finaleLen, epilogueLen]);

  const delayBeforeNextLine = useCallback(
    (vc: number) => {
      if (vc < agentLen) {
        return 360;
      }
      const co = vc - agentLen;

      if (!useHoldLayout) {
        const finStart = CLUSTER_PROGRESS_LINE_COUNT - CLUSTER_PROGRESS_FINALE_LINE_COUNT;
        if (co < finStart) {
          return 440;
        }
        if (co < CLUSTER_PROGRESS_LINE_COUNT) {
          return 760;
        }
        if (co < CLUSTER_PROGRESS_LINE_COUNT + epilogueLen) {
          return 940;
        }
        return 440;
      }

      if (!releaseCompletionLogLines) {
        return co < bodyLen ? 440 : 520;
      }

      const pulseCap = pulseFrozenRef.current ?? 0;
      if (co < bodyLen) {
        return 440;
      }
      if (co < bodyLen + pulseCap) {
        return 520;
      }
      if (co < bodyLen + pulseCap + finaleLen) {
        return 760;
      }
      if (co < bodyLen + pulseCap + finaleLen + epilogueLen) {
        return 940;
      }
      return 440;
    },
    [agentLen, bodyLen, epilogueLen, finaleLen, releaseCompletionLogLines, useHoldLayout],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (visibleCount >= streamEndVisible) {
      return;
    }
    const delay = delayBeforeNextLine(visibleCount);
    const timer = setTimeout(() => {
      setVisibleCount((c) => {
        const next = Math.min(streamEndVisible, c + 1);
        if (syncCp === undefined || syncOp === undefined || syncWn === undefined) {
          return next;
        }
        const syncCap =
          agentLen +
          clusterVisibleLineCountFromDashboard(syncCp, syncOp, syncWn, releaseCompletionLogLines);
        const allowPulsePastSync =
          useHoldLayout && !releaseCompletionLogLines && c >= agentLen + bodyLen;
        if (allowPulsePastSync) {
          return next;
        }
        return Math.min(next, syncCap);
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [
    isOpen,
    visibleCount,
    streamEndVisible,
    delayBeforeNextLine,
    syncCp,
    syncOp,
    syncWn,
    agentLen,
    bodyLen,
    releaseCompletionLogLines,
    useHoldLayout,
  ]);

  /** Layout phase: scrollHeight matches new DOM before paint (effect ran too late for “live” stream). */
  useLayoutEffect(() => {
    if (!isOpen || !autoScroll) return;
    const el = logScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    logsEndRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
  }, [visibleCount, isOpen, autoScroll]);

  /** Content height grows inside a fixed-height overflow:auto shell — border box of the shell does not resize, so observe inner column and re-stick to bottom when it grows (fonts, streaming lines). */
  useEffect(() => {
    if (!isOpen || typeof ResizeObserver === "undefined") return;
    const inner = logContentRef.current;
    const outer = logScrollRef.current;
    if (!inner || !outer) return;
    const ro = new ResizeObserver(() => {
      if (!autoScrollRef.current) return;
      outer.scrollTop = outer.scrollHeight;
    });
    ro.observe(inner);
    return () => ro.disconnect();
  }, [isOpen]);

  const clusterFmt = (msg: string) => msg.replace(/\{version\}/g, version);

  const agentSlice = AGENT_ANALYSIS_LINES.slice(0, Math.min(visibleCount, agentLen));

  const clusterSlice = useMemo(() => {
    const clusterIdxStart = Math.max(0, visibleCount - agentLen);
    if (!useHoldLayout) {
      const rows: { ts: string; level: string; msg: string }[] = [];
      const mainTake = Math.min(clusterIdxStart, CLUSTER_PROGRESS_LINE_COUNT);
      rows.push(
        ...CLUSTER_PROGRESS_LINES.slice(0, mainTake).map((e) => ({
          ...e,
          msg: clusterFmt(e.msg),
        })),
      );
      if (clusterIdxStart > CLUSTER_PROGRESS_LINE_COUNT) {
        const epTake = Math.min(clusterIdxStart - CLUSTER_PROGRESS_LINE_COUNT, epilogueLen);
        rows.push(
          ...COMPLETION_EPILOGUE_LINES.slice(0, epTake).map((e) => ({
            ...e,
            msg: clusterFmt(e.msg),
          })),
        );
      }
      return rows;
    }

    const rows: { ts: string; level: string; msg: string }[] = [];
    const bodyShown = Math.min(clusterIdxStart, bodyLen);
    rows.push(
      ...CLUSTER_PROGRESS_BODY_LINES.slice(0, bodyShown).map((e) => ({
        ...e,
        msg: clusterFmt(e.msg),
      })),
    );

    let rem = clusterIdxStart - bodyShown;
    if (rem <= 0) return rows;

    if (!releaseCompletionLogLines) {
      for (let i = 0; i < rem; i++) {
        rows.push(activityPulseEntry(i));
      }
      return rows;
    }

    const pulseCap = pulseFrozenRef.current ?? 0;
    const pulseRows = Math.min(rem, pulseCap);
    for (let i = 0; i < pulseRows; i++) {
      rows.push(activityPulseEntry(i));
    }
    rem -= pulseRows;
    if (rem <= 0) return rows;

    const finaleTake = Math.min(rem, finaleLen);
    rows.push(
      ...CLUSTER_PROGRESS_FINALE_LINES.slice(0, finaleTake).map((e) => ({
        ...e,
        msg: clusterFmt(e.msg),
      })),
    );
    rem -= finaleTake;
    if (rem <= 0) return rows;

    rows.push(
      ...COMPLETION_EPILOGUE_LINES.slice(0, Math.min(rem, epilogueLen)).map((e) => ({
        ...e,
        msg: clusterFmt(e.msg),
      })),
    );
    return rows;
  }, [
    useHoldLayout,
    visibleCount,
    agentLen,
    bodyLen,
    epilogueLen,
    finaleLen,
    releaseCompletionLogLines,
    version,
  ]);

  if (!isOpen) return null;

  /** Portaled like {@link LightSpeedPanel}: avoids nested glass/opacity under `#root`. */
  const panel = (
    <div
      className="fixed inset-0 z-[1100] flex items-stretch justify-end"
      role="dialog"
      aria-label="AI agent logs"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      {/** min-h-0: flex item must shrink below content min-height so inner flex-1 + overflow-y-auto creates a scroll region */}
      <div className="ocs-update-details-panel relative flex h-full max-h-dvh min-h-0 w-[min(640px,92vw)] min-w-0 flex-col self-stretch overflow-hidden">
        <div className="ocs-update-details-panel__chrome flex shrink-0 items-start justify-between gap-[var(--pf-t--global--spacer--md)] border-b border-[var(--pf-t--global--border--color--default)] px-[var(--pf-t--global--spacer--lg)] py-[var(--pf-t--global--spacer--md)]">
          <div>
            <Title headingLevel="h2" size="lg" className="ocs-update-details-panel__title">
              <AiAgentLogsHeading />
            </Title>
          </div>
          <Button variant="plain" onClick={onClose} aria-label="Close agent logs">
            <X className="size-[18px]" aria-hidden />
          </Button>
        </div>

        <div className="ocs-update-details-panel__chrome flex shrink-0 flex-wrap items-center gap-x-[var(--pf-t--global--spacer--lg)] gap-y-[var(--pf-t--global--spacer--sm)] border-b border-[var(--pf-t--global--border--color--default)] px-[var(--pf-t--global--spacer--lg)] py-[var(--pf-t--global--spacer--sm)]">
          <Switch
            id="agent-logs-autoscroll"
            isReversed
            label="Auto-scroll"
            isChecked={autoScroll}
            onChange={(_e, checked) => setAutoScroll(checked)}
          />
        </div>

        <div
          ref={logScrollRef}
          className="ocs-update-details-panel__log-well min-h-0 flex-1 overflow-y-auto overscroll-contain p-[var(--pf-t--global--spacer--md)] font-[family-name:var(--pf-t--global--FontFamily--mono)] text-[0.75rem] leading-relaxed"
          style={{ WebkitOverflowScrolling: "touch" }}
          tabIndex={0}
          aria-label="Agent and cluster update log output"
        >
          <div ref={logContentRef}>
            <div className="pb-[var(--pf-t--global--spacer--sm)] font-semibold text-[#151515] dark:text-white font-[family-name:var(--pf-t--global--FontFamily--text)] text-[0.8125rem]">
              Agent executing update plan #{planSerial}
            </div>
            {agentSlice.map((line, i) => (
              <div key={`a-${i}`} className="break-words pb-[var(--pf-t--global--spacer--xs)]">
                {line}
              </div>
            ))}
            {clusterSlice.map((entry, i) => (
              <div key={`c-${i}`} className="flex flex-wrap gap-x-[var(--pf-t--global--spacer--sm)] pb-[var(--pf-t--global--spacer--xs)]">
                <span className="ocs-update-details-panel__log-ts shrink-0 tabular-nums">{entry.ts}</span>
                <span className="ocs-update-details-panel__log-level shrink-0 font-semibold">{entry.level.toUpperCase()}</span>
                <span className="min-w-0 break-words">{entry.msg}</span>
              </div>
            ))}
            {visibleCount < streamEndVisible ? (
              <div
                className="ocs-update-details-panel__agent-status mt-[var(--pf-t--global--spacer--sm)] pt-[var(--pf-t--global--spacer--sm)]"
                aria-live="polite"
                aria-busy="true"
              >
                <span className="ocs-update-details-panel__agent-status-text">
                  {useHoldLayout && !releaseCompletionLogLines ? "Live cluster activity…" : "Streaming cluster activity…"}
                </span>
                <span className="ocs-update-details-panel__agent-dots" aria-hidden>
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            ) : null}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
