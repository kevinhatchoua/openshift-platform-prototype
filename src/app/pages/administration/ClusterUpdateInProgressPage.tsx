import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useChat } from "../../contexts/ChatContext";
import { CLASSIC_TO_EXTENSION_APPROVALS } from "../../lib/operatorClusterUpdateHandoff";
import {
  Alert,
  Button,
  Content,
  Flex,
  Icon,
  Title,
} from "@patternfly/react-core";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OcsNamedResourceDataView, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import { CheckCircle, Loader2, Clock, Sparkles } from "@/lib/pfIcons";
import Breadcrumbs from "../../components/Breadcrumbs";
import AgentExecutionLogsPanel, {
  PLATFORM_CLUSTER_OPERATORS,
} from "../../components/cluster-update/AgentExecutionLogsPanel";

type TabKey = "update-plan" | "active-update-plans" | "update-history";

type RowStatus = "Updating" | "Updated" | "Pending";

type OperatorKind = "Cluster operator" | "Classic operator" | "Cluster extension";

interface CatalogOperatorModel {
  name: string;
  version: string;
  kind: OperatorKind;
  /** Moves from Classic operator to Cluster extension after the in-update approval. */
  migratesToExtension?: boolean;
}

interface WorkerPoolModel {
  pool: string;
  baseVersion: string;
  compatibility: "compatible" | "incompatible";
}

function poolName(pool: { pool: string }) {
  return pool.pool;
}

function namedRow(row: { name: string }) {
  return row.name;
}

const CATALOG_OPERATORS: CatalogOperatorModel[] = [
  { name: "Abot Operator", version: "3.2.5", kind: "Cluster extension" },
  { name: "Airflow Helm Operator", version: "3.5", kind: "Classic operator" },
  { name: "Ansible Automation Platform", version: "3.25", kind: "Classic operator" },
  { name: "Bare Metal Event Relay", version: "1.2.0", kind: "Classic operator" },
  { name: "Camel K Operator", version: "2.1.0", kind: "Classic operator" },
  { name: "Cert Manager", version: "1.14.0", kind: "Classic operator", migratesToExtension: true },
  { name: "Kiali Operator", version: "1.73.0", kind: "Classic operator", migratesToExtension: true },
];

const WORKER_POOLS_BASE: WorkerPoolModel[] = [
  { pool: "worker-east", baseVersion: "5.0.0", compatibility: "compatible" },
  { pool: "worker-west", baseVersion: "5.0.0", compatibility: "compatible" },
  { pool: "worker-central", baseVersion: "5.0.0", compatibility: "compatible" },
  { pool: "worker-north", baseVersion: "5.0.0", compatibility: "compatible" },
  { pool: "worker-south", baseVersion: "5.0.0", compatibility: "compatible" },
];

/** Maps overall phase % to per-row status so tables stay aligned with progress bars. */
function slotStatus(index: number, rowCount: number, pct: number): RowStatus {
  if (rowCount <= 0 || pct <= 0) return "Pending";
  const seg = 100 / rowCount;
  if (pct >= (index + 1) * seg) return "Updated";
  if (pct > index * seg) return "Updating";
  return "Pending";
}

/** Active progress ticks. With a quick approval, the run finishes in about 35 seconds. */
const PROGRESS_TICK_MS = 250;
const MIGRATION_PAUSE_AT = 48;
const COMPLETION_NAV_DELAY_MS = 2000;

export default function ClusterUpdateInProgressPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setContext, addMessage } = useChat();
  const version = (location.state as any)?.version || "5.1.10";
  const [activeTab, setActiveTab] = useState<TabKey>("update-plan");

  const [progress, setProgress] = useState({ op: 0, cp: 0, wn: 0 });
  const [showLogsPanel, setShowLogsPanel] = useState(true);
  const [migrationApproved, setMigrationApproved] = useState(false);
  const migrationApprovedRef = useRef(false);
  const migrationPauseNotifiedRef = useRef(false);
  const olsPhaseNotifiedRef = useRef({ platform: false, catalog: false, workers: false, complete: false });
  const completionNavTimeoutRef = useRef<number | null>(null);

  const operatorProgress = progress.op;
  const controlProgress = progress.cp;
  const workerProgress = progress.wn;

  useEffect(() => {
    localStorage.setItem("clusterUpdateInProgress", JSON.stringify({ version, startedAt: Date.now() }));
    setContext(`cluster-update-in-progress:${version}`);
  }, [version, setContext]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((s) => {
        if (!migrationApprovedRef.current && s.cp >= MIGRATION_PAUSE_AT) {
          return { ...s, cp: MIGRATION_PAUSE_AT };
        }
        if (s.cp < 100) {
          const step = s.cp < MIGRATION_PAUSE_AT ? 1.6 : 2.6;
          return { ...s, cp: Math.min(100, s.cp + step) };
        }
        if (s.op < 100) {
          return { ...s, op: Math.min(100, s.op + 3.6) };
        }
        if (s.wn < 100) {
          return { ...s, wn: Math.min(100, s.wn + 2) };
        }
        return s;
      });
    }, PROGRESS_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (operatorProgress < 100 || controlProgress < 100 || workerProgress < 100) return;
    if (completionNavTimeoutRef.current != null) return;

    localStorage.removeItem("clusterUpdateInProgress");
    setShowLogsPanel(true);

    completionNavTimeoutRef.current = window.setTimeout(() => {
      completionNavTimeoutRef.current = null;
      navigate("/administration/cluster-update/complete", { state: { version } });
    }, COMPLETION_NAV_DELAY_MS);

    return () => {
      if (completionNavTimeoutRef.current != null) {
        window.clearTimeout(completionNavTimeoutRef.current);
        completionNavTimeoutRef.current = null;
      }
    };
  }, [operatorProgress, controlProgress, workerProgress, navigate, version]);

  const opPct = Math.round(operatorProgress);
  const cpPct = Math.round(controlProgress);
  const wnPct = Math.round(workerProgress);

  const workerRows = WORKER_POOLS_BASE.map((pool, i) => ({
    ...pool,
    status: slotStatus(i, WORKER_POOLS_BASE.length, workerProgress),
  }));

  const operatorRows = [
    ...PLATFORM_CLUSTER_OPERATORS.map((name, i) => ({
      name,
      kind: "Cluster operator" as const,
      version: slotStatus(i, PLATFORM_CLUSTER_OPERATORS.length, controlProgress) === "Updated" ? version : "5.0.0",
      status: slotStatus(i, PLATFORM_CLUSTER_OPERATORS.length, controlProgress),
    })),
    ...CATALOG_OPERATORS.map((op, i) => ({
      name: op.name,
      kind: op.migratesToExtension && migrationApproved ? ("Cluster extension" as const) : op.kind,
      version: op.version,
      status: slotStatus(i, CATALOG_OPERATORS.length, operatorProgress),
      compatibility: "compatible" as const,
      lastUpdated: "—",
    })),
  ];
  const clusterOperatorRows = operatorRows.filter((row) => row.kind === "Cluster operator");
  const installedOperatorRows = operatorRows.filter((row) => row.kind !== "Cluster operator");

  const operatorsPct = Math.round(
    ((controlProgress / 100) * PLATFORM_CLUSTER_OPERATORS.length +
      (operatorProgress / 100) * CATALOG_OPERATORS.length) /
      (PLATFORM_CLUSTER_OPERATORS.length + CATALOG_OPERATORS.length) *
      100,
  );

  const updateFullyComplete = operatorProgress >= 100 && controlProgress >= 100 && workerProgress >= 100;

  useEffect(() => {
    if (controlProgress < MIGRATION_PAUSE_AT || migrationApproved || migrationPauseNotifiedRef.current) return;
    migrationPauseNotifiedRef.current = true;
    addMessage({
      type: "ai",
      content: `Update to **${version}** is paused. Approve moving ${CLASSIC_TO_EXTENSION_APPROVALS.map((op) => op.name).join(" and ")} from Classic operators to Cluster extensions before the update continues.`,
      suggestions: ["What changes for these operators?", "Resume after I approve"],
    });
  }, [controlProgress, migrationApproved, addMessage, version]);

  useEffect(() => {
    const notifyPhase = (
      key: keyof typeof olsPhaseNotifiedRef.current,
      content: string,
    ) => {
      if (olsPhaseNotifiedRef.current[key]) return;
      olsPhaseNotifiedRef.current[key] = true;
      addMessage({
        type: "ai",
        content,
        suggestions: ["Summarize risks so far", "What happens next?"],
      });
    };

    if (controlProgress >= 100) {
      notifyPhase(
        "platform",
        `Cluster operators finished reconciling for the update to **${version}**. Classic operators and cluster extensions are updating next.`,
      );
    }
    if (operatorProgress >= 100 && controlProgress >= 100) {
      notifyPhase(
        "catalog",
        `Classic operators and cluster extensions are updated for **${version}**. Worker node rollout is next.`,
      );
    }
    if (workerProgress >= 100 && operatorProgress >= 100 && controlProgress >= 100) {
      notifyPhase(
        "workers",
        `All worker pools report **Updated** for **${version}**. Running post-update validation.`,
      );
    }
    if (updateFullyComplete) {
      notifyPhase(
        "complete",
        `Cluster update to **${version}** completed. Agent logs include the full execution trace if you need change-review evidence.`,
      );
    }
  }, [controlProgress, operatorProgress, workerProgress, version, addMessage, updateFullyComplete]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "update-plan", label: "Update plan" },
    { key: "active-update-plans", label: "Active update plans" },
    { key: "update-history", label: "Update history" },
  ];

  return (
    <div className="ocs-cluster-update-in-progress-shell flex-1 min-w-0 min-h-0">
      <div className="ocs-cluster-update-in-progress-main flex-1 min-w-0 overflow-y-auto overflow-x-hidden ocs-app-page-outer ocs-app-page-outer--end-3xl">
      <Breadcrumbs items={[
        { label: "Administration", path: "/administration/cluster-update" },
        { label: "Cluster Update" },
      ]}>

      <h1 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[#151515] dark:text-white text-[28px] mb-[16px]">
        Cluster Update
      </h1>

      <div className="border-b border-[#d2d2d2] dark:border-[rgba(255,255,255,0.1)] mb-[24px] flex gap-[0px]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === "update-plan") return;
              navigate("/administration/cluster-update", { state: { tab: tab.key } });
            }}
            className={`px-[20px] py-[12px] text-[14px] font-['Red_Hat_Text:Regular',sans-serif] border-0 bg-transparent cursor-pointer transition-colors relative ${
              activeTab === tab.key
                ? "text-[#151515] dark:text-white font-medium"
                : "text-[#4d4d4d] dark:text-[#b0b0b0] hover:text-[#151515] dark:hover:text-white"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0066cc] dark:bg-[#4dabf7] rounded-t-[2px]" />
            )}
          </button>
        ))}
      </div>

      <div className="mb-[var(--pf-t--global--spacer--lg)]">
        <Alert variant="info" isInline title="Estimated update time 2 hours 12 minutes">
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            <Content component="p" style={{ margin: 0 }}>
              This is a rough estimate and will vary based on resource availability and usage. After launch, this update
              runs to completion; pause, resume, and abort are not available.
            </Content>
            <div>
              <Button
                variant="primary"
                icon={<Sparkles aria-hidden className="ocs-ai-sparkle-cta-icon" />}
                onClick={() => setShowLogsPanel(true)}
              >
                View agent logs
              </Button>
            </div>
          </Flex>
        </Alert>
      </div>

      {controlProgress >= MIGRATION_PAUSE_AT && !migrationApproved ? (
        <div className="mb-[var(--pf-t--global--spacer--lg)]">
          <Alert variant="warning" isInline title="Approval required: move Classic operators to Cluster extensions">
            <Content component="p">
              The update is paused. Approve moving these Classic operators to Cluster extensions before the rest of the
              update continues. Operator versions stay the same.
            </Content>
            <ul>
              {CLASSIC_TO_EXTENSION_APPROVALS.map((op) => (
                <li key={op.name}>
                  <strong>{op.name}</strong> {op.version}: {op.from} → {op.to}
                </li>
              ))}
            </ul>
            <Flex gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
              <Button
                variant="primary"
                onClick={() => {
                  migrationApprovedRef.current = true;
                  setMigrationApproved(true);
                  addMessage({
                    type: "ai",
                    content: `Approved moving ${CLASSIC_TO_EXTENSION_APPROVALS.map((op) => op.name).join(" and ")} from Classic operators to Cluster extensions. Resuming the update to **${version}**.`,
                  });
                }}
              >
                Approve and continue
              </Button>
              <Button variant="link" component={(props) => <Link {...props} to="/ecosystem/installed-operators" />}>
                Review on Installed Operators
              </Button>
            </Flex>
          </Alert>
        </div>
      ) : null}

      {/* Cluster ID */}
      <div className="mb-[24px]">
        <p className="text-[#4d4d4d] dark:text-[#b0b0b0] text-[13px] font-['Red_Hat_Text:Regular',sans-serif] mb-[2px]">Cluster ID</p>
        <p className="text-[#151515] dark:text-white text-[14px] font-['Red_Hat_Mono:Regular',sans-serif]">b86leae3-b06c-4ab2-8fa7-54b89a2bf4b2</p>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-3 gap-[24px] mb-[32px]">
        <ProgressSection label="Installed operators" percentage={opPct} />
        <ProgressSection label="Cluster operators" percentage={cpPct} />
        <ProgressSection label="Worker nodes" percentage={wnPct} />
      </div>

      <section className="ocs-pod-details__section">
            <Title headingLevel="h2" size="lg" className="ocs-pod-details__section-title">
              Worker nodes on this cluster
            </Title>

          <OcsNamedResourceDataView
            ouiaId="in-progress-workers-data-view"
            ariaLabel="Worker nodes on this cluster"
            itemsLabel="worker pools"
            items={workerRows}
            getName={poolName}
          >
            {(rows) => (
              <>
                <Thead>
                  <Tr>
                    <Th dataLabel="Pool">
                      <PlainTableHeader label="Pool" />
                    </Th>
                    <Th dataLabel="Status">
                      <PlainTableHeader label="Status" />
                    </Th>
                    <Th dataLabel="Version">
                      <PlainTableHeader label="Version" />
                    </Th>
                    <Th dataLabel="Cluster compatibility">
                      <PlainTableHeader label="Cluster compatibility" />
                    </Th>
                    <Th modifier="fitContent" dataLabel="Actions">
                      <PlainTableHeader label="Actions" />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((pool) => (
                    <Tr key={pool.pool}>
                      <Td dataLabel="Pool">
                        <Content component="span" style={{ fontWeight: 600 }}>
                          {pool.pool}
                        </Content>
                      </Td>
                      <Td dataLabel="Status">
                        {pool.status === "Updating" ? (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <span
                              className="inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-visible"
                              aria-hidden
                            >
                              <span className="inline-flex origin-center scale-[0.2]">
                                <Icon>
                                  <Loader2 className="text-[var(--pf-t--global--palette--blue-50)]" aria-hidden />
                                </Icon>
                              </span>
                            </span>
                            Updating
                          </Flex>
                        ) : pool.status === "Updated" ? (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="success">
                              <CheckCircle aria-hidden />
                            </Icon>
                            Updated
                          </Flex>
                        ) : (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="warning">
                              <Clock aria-hidden />
                            </Icon>
                            Pending
                          </Flex>
                        )}
                      </Td>
                      <Td dataLabel="Version">
                        <Content component="small">
                          <code>{pool.status === "Updated" ? version : pool.baseVersion}</code>
                        </Content>
                      </Td>
                      <Td dataLabel="Cluster compatibility">
                        {pool.compatibility === "compatible" ? (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="success">
                              <CheckCircle aria-hidden />
                            </Icon>
                            Compatible
                          </Flex>
                        ) : (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            Incompatible
                          </Flex>
                        )}
                      </Td>
                      <Td dataLabel="Actions" isActionCell>
                        <Button variant="plain" aria-label={`Actions for pool ${pool.pool}`} icon={<EllipsisVIcon />} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </>
            )}
          </OcsNamedResourceDataView>
      </section>

      <section className="ocs-pod-details__section">
            <Title headingLevel="h2" size="lg" className="ocs-pod-details__section-title">
              Cluster operators
            </Title>

          <OcsNamedResourceDataView
            ouiaId="in-progress-cluster-operators-data-view"
            ariaLabel="Cluster operators"
            itemsLabel="cluster operators"
            items={clusterOperatorRows}
            getName={namedRow}
          >
            {(rows) => (
              <>
                <Thead>
                  <Tr>
                    <Th dataLabel="Name">
                      <PlainTableHeader label="Name" />
                    </Th>
                    <Th dataLabel="Status">
                      <PlainTableHeader label="Status" />
                    </Th>
                    <Th dataLabel="Version">
                      <PlainTableHeader label="Version" />
                    </Th>
                    <Th dataLabel="Cluster compatibility">
                      <PlainTableHeader label="Cluster compatibility" />
                    </Th>
                    <Th modifier="fitContent" dataLabel="Actions">
                      <PlainTableHeader label="Actions" />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((row) => (
                    <Tr key={row.name}>
                      <Td dataLabel="Name">
                        <Content component="span" style={{ fontWeight: 600 }}>
                          {row.name}
                        </Content>
                      </Td>
                      <Td dataLabel="Status">
                        {row.status === "Updating" ? (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <span
                              className="inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-visible"
                              aria-hidden
                            >
                              <span className="inline-flex origin-center scale-[0.2]">
                                <Icon>
                                  <Loader2 className="text-[var(--pf-t--global--palette--blue-50)]" aria-hidden />
                                </Icon>
                              </span>
                            </span>
                            Updating
                          </Flex>
                        ) : row.status === "Updated" ? (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="success">
                              <CheckCircle aria-hidden />
                            </Icon>
                            Updated
                          </Flex>
                        ) : (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="warning">
                              <Clock aria-hidden />
                            </Icon>
                            Pending
                          </Flex>
                        )}
                      </Td>
                      <Td dataLabel="Version">
                        <Content component="small">
                          <code>{row.status === "Updated" ? version : "5.0.0"}</code>
                        </Content>
                      </Td>
                      <Td dataLabel="Cluster compatibility">
                        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                          <Icon status="success">
                            <CheckCircle aria-hidden />
                          </Icon>
                          Compatible
                        </Flex>
                      </Td>
                      <Td dataLabel="Actions" isActionCell>
                        <Button variant="plain" aria-label={`Actions for cluster operator ${row.name}`} icon={<EllipsisVIcon />} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </>
            )}
          </OcsNamedResourceDataView>
      </section>

      <section className="ocs-pod-details__section">
            <Title headingLevel="h2" size="lg" className="ocs-pod-details__section-title">
              Installed operators
            </Title>

          <OcsNamedResourceDataView
            ouiaId="in-progress-installed-operators-data-view"
            ariaLabel="Installed operators"
            itemsLabel="operators"
            items={installedOperatorRows}
            getName={namedRow}
          >
            {(rows) => (
              <>
                <Thead>
                  <Tr>
                    <Th dataLabel="Name">
                      <PlainTableHeader label="Name" />
                    </Th>
                    <Th dataLabel="Status">
                      <PlainTableHeader label="Status" />
                    </Th>
                    <Th dataLabel="Version">
                      <PlainTableHeader label="Version" />
                    </Th>
                    <Th dataLabel="Cluster compatibility">
                      <PlainTableHeader label="Cluster compatibility" />
                    </Th>
                    <Th dataLabel="Last updated">
                      <PlainTableHeader label="Last updated" />
                    </Th>
                    <Th modifier="fitContent" dataLabel="Actions">
                      <PlainTableHeader label="Actions" />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rows.map((op) => (
                    <Tr key={op.name}>
                      <Td dataLabel="Name">
                        <Content component="span" style={{ fontWeight: 600 }}>
                          {op.name}
                        </Content>
                      </Td>
                      <Td dataLabel="Status">
                        {op.status === "Updating" ? (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <span
                              className="inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-visible"
                              aria-hidden
                            >
                              <span className="inline-flex origin-center scale-[0.2]">
                                <Icon>
                                  <Loader2 className="text-[var(--pf-t--global--palette--blue-50)]" aria-hidden />
                                </Icon>
                              </span>
                            </span>
                            Updating
                          </Flex>
                        ) : op.status === "Updated" ? (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="success">
                              <CheckCircle aria-hidden />
                            </Icon>
                            Updated
                          </Flex>
                        ) : (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="warning">
                              <Clock aria-hidden />
                            </Icon>
                            Pending
                          </Flex>
                        )}
                      </Td>
                      <Td dataLabel="Version">
                        <Content component="small">
                          <code>{op.version}</code>
                        </Content>
                      </Td>
                      <Td dataLabel="Cluster compatibility">
                        {op.compatibility === "compatible" ? (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            <Icon status="success">
                              <CheckCircle aria-hidden />
                            </Icon>
                            Compatible
                          </Flex>
                        ) : (
                          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                            Incompatible
                          </Flex>
                        )}
                      </Td>
                      <Td dataLabel="Last updated">{op.lastUpdated}</Td>
                      <Td dataLabel="Actions" isActionCell>
                        <Button variant="plain" aria-label={`Actions for ${op.name}`} icon={<EllipsisVIcon />} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </>
            )}
          </OcsNamedResourceDataView>
      </section>

      </Breadcrumbs>
      </div>

      <AgentExecutionLogsPanel
        presentation="docked"
        isOpen={showLogsPanel}
        version={version}
        onClose={() => setShowLogsPanel(false)}
        releaseCompletionLogLines={updateFullyComplete}
        dashboardProgress={{
          operatorPct: operatorProgress,
          controlPct: controlProgress,
          workerPct: workerProgress,
        }}
      />
    </div>
  );
}

function ProgressSection({ label, percentage }: { label: string; percentage: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-[8px]">
        <span className="text-[#0066cc] dark:text-[#4dabf7] text-[14px] font-['Red_Hat_Text:Regular',sans-serif] font-medium">
          {label}
        </span>
        <span className="text-[#151515] dark:text-white text-[14px] font-['Red_Hat_Text:Regular',sans-serif] font-medium">{percentage}%</span>
      </div>
      <div className="h-[8px] bg-[#e0e0e0] dark:bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#0066cc] rounded-full transition-all duration-500"
          style={{ width: `${Math.max(percentage, percentage > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  );
}

