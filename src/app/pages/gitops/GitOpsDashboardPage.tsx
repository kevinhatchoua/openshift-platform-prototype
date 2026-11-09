import { type ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardTitle,
  Content,
  EmptyState,
  EmptyStateBody,
  Flex,
  Gallery,
  GalleryItem,
  Grid,
  GridItem,
  Label,
  Popover,
  Title,
} from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { useConsoleProject, appMatchesConsoleProject } from "../../contexts/ConsoleProjectContext";
import { OcsPrototypeListTable, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import { usePrototypeDemo } from "../../contexts/PrototypeDemoContext";
import {
  ARGO_INSTANCES,
  buildDashboardMetrics,
  buildGitOpsAppsUrl,
  GITOPS_ALL_INSTANCES,
  GITOPS_APPLICATION_SETS,
  GITOPS_ROLLOUTS,
  applicationsForInstance,
  findApplication,
  gitopsDetailPath,
  recentOperationsForInstance,
} from "./gitopsData";
import { GitOpsEditDeleteMenu, HealthStatus, ResourceName, ViewAgenticRunButton } from "./gitopsShared";
import { useChat } from "../../contexts/ChatContext";
import { RhAiExperienceIcon } from "@/components/icons/RhAiExperienceIcon";
import { createGitOpsAiLaunchers, applicationNeedsAiTroubleshoot } from "../../lib/gitopsAiWorkflow";
import {
  connectivityLabelColor,
  gitOpsHealthChartColor,
  gitOpsSyncChartColor,
  labelColorForTone,
  operationPhaseLabelColor,
  PF_CHART,
  severityLabelColor,
  toneForCount,
} from "../../lib/pfSemanticColors";

type DonutSegment = {
  key: string;
  label: string;
  count: number;
  color: string;
  filterType: "sync" | "health";
  filterValue: string;
};

const SEGMENT_COLORS = {
  synced: gitOpsSyncChartColor("Synced"),
  outOfSync: gitOpsSyncChartColor("OutOfSync"),
  healthy: gitOpsHealthChartColor("Healthy"),
  progressing: gitOpsHealthChartColor("Progressing"),
  degraded: gitOpsHealthChartColor("Degraded"),
  paused: gitOpsHealthChartColor("Paused"),
  aborting: gitOpsHealthChartColor("Aborting"),
};

const AGENTIC_HINT_SEGMENT_KEYS = new Set(["outOfSync", "degraded", "aborting"]);

function MultiSegmentDonut({
  title,
  segments,
  total,
  onSegmentClick,
  onOpenAgenticAttention,
}: {
  title: string;
  segments: DonutSegment[];
  total: number;
  onSegmentClick: (segment: DonutSegment) => void;
  onOpenAgenticAttention?: () => void;
}) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const safeTotal = total || 1;
  let offset = 0;
  const arcSegments = segments.filter((s) => s.count > 0);

  return (
    <Flex direction={{ default: "column" }} alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }}>
      <div style={{ position: "relative", width: 110, height: 110 }}>
        <svg width="110" height="110" viewBox="0 0 110 110" role="img" aria-label={`${title} breakdown`}>
          <circle
            cx="55"
            cy="55"
            r={r}
            fill="none"
            stroke="var(--pf-t--global--border--color--default)"
            strokeWidth="10"
          />
          {arcSegments.length === 0 ? (
            <circle
              cx="55"
              cy="55"
              r={r}
              fill="none"
              stroke={PF_CHART.neutral}
              strokeWidth="10"
              strokeDasharray={`${c} 0`}
              transform="rotate(-90 55 55)"
            />
          ) : (
            arcSegments.map((segment) => {
              const length = (segment.count / safeTotal) * c;
              const dashOffset = -offset;
              offset += length;
              const pct = Math.round((segment.count / safeTotal) * 100);
              return (
                <circle
                  key={segment.key}
                  cx="55"
                  cy="55"
                  r={r}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="10"
                  strokeDasharray={`${length} ${c - length}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                  transform="rotate(-90 55 55)"
                  style={{ cursor: "pointer" }}
                  onClick={() => onSegmentClick(segment)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${segment.label}: ${segment.count} (${pct}%)`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSegmentClick(segment);
                    }
                  }}
                />
              );
            })
          )}
          <text x="55" y="52" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight={600}>
            {total}
          </text>
          <text x="55" y="70" textAnchor="middle" fill="currentColor" fontSize="11">
            {title}
          </text>
        </svg>
      </div>
      <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }} className="ocs-gitops-donut-legend">
        {segments.map((segment) => {
          const pct = Math.round((segment.count / safeTotal) * 100);
          const isEmpty = segment.count === 0;
          const legendControl = (
            <Button
              key={segment.key}
              variant="link"
              isInline
              isDisabled={isEmpty}
              className={`ocs-gitops-donut-legend__item${isEmpty ? " ocs-gitops-donut-legend__item--empty" : ""}`}
              onClick={() => onSegmentClick(segment)}
            >
              <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                <span
                  className="ocs-gitops-donut-legend__swatch"
                  style={{ backgroundColor: isEmpty ? PF_CHART.neutral : segment.color }}
                  aria-hidden
                />
                <Content component="small">
                  {segment.label}: {segment.count} ({pct}%)
                </Content>
              </Flex>
            </Button>
          );

          if (!isEmpty && AGENTIC_HINT_SEGMENT_KEYS.has(segment.key) && onOpenAgenticAttention) {
            return (
              <Popover
                key={segment.key}
                triggerAction="hover"
                headerContent={segment.label}
                bodyContent={(hide) => (
                  <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                    <Content component="p">
                      {segment.count} application{segment.count === 1 ? "" : "s"} in this state. Open an
                      AgenticRun to review evidence and proposed remediation (not Lightspeed chat).
                    </Content>
                    <Flex
                      className="ocs-gitops-popover-actions"
                      gap={{ default: "gapMd" }}
                      alignItems={{ default: "alignItemsCenter" }}
                      flexWrap={{ default: "wrap" }}
                    >
                      <Button
                        variant="link"
                        isInline
                        icon={<RhAiExperienceIcon aria-hidden />}
                        onClick={(e) => {
                          e.stopPropagation();
                          hide();
                          onOpenAgenticAttention();
                        }}
                      >
                        View Agentic Run
                      </Button>
                      <Button
                        variant="link"
                        isInline
                        onClick={(e) => {
                          e.stopPropagation();
                          hide();
                          onSegmentClick(segment);
                        }}
                      >
                        Filter applications
                      </Button>
                    </Flex>
                  </Flex>
                )}
              >
                {legendControl}
              </Popover>
            );
          }

          return legendControl;
        })}
      </Flex>
    </Flex>
  );
}

const RECONCILE_SERIES = [
  { t: "24h ago", v: 8 },
  { t: "18h ago", v: 14 },
  { t: "12h ago", v: 11 },
  { t: "6h ago", v: 18 },
  { t: "3h ago", v: 16 },
  { t: "1h ago", v: 19 },
  { t: "Now", v: 17 },
];

export default function GitOpsDashboardPage() {
  const navigate = useNavigate();
  const { permission } = usePrototypeDemo();
  const { project } = useConsoleProject();
  const [metricsDenied, setMetricsDenied] = useState<string | null>(null);
  const apps = applicationsForInstance(GITOPS_ALL_INSTANCES).filter((a) =>
    appMatchesConsoleProject(a.ns, project),
  );
  const metrics = buildDashboardMetrics(apps);
  const chat = useChat();
  const gitopsAi = useMemo(
    () =>
      createGitOpsAiLaunchers({
        clearMessages: chat.clearMessages,
        setContext: chat.setContext,
        setIsOpen: chat.setIsOpen,
        navigateToAgenticRun: (path) => navigate(path),
      }),
    [chat.clearMessages, chat.setContext, chat.setIsOpen, navigate],
  );

  const launchAppInvestigate = (ns: string, name: string, summary: string) => {
    const app = findApplication(ns, name);
    if (!app) return;
    gitopsAi.launchSyncTroubleshoot({
      name: app.name,
      ns: app.ns,
      sync: app.sync,
      health: app.health,
      errorSummary: summary,
    });
  };
  const appKeys = new Set(apps.map((a) => `${a.ns}/${a.name}`));
  const operations = recentOperationsForInstance(GITOPS_ALL_INSTANCES).filter((op) =>
    appKeys.has(`${op.ns}/${op.name}`),
  );
  const instances = ARGO_INSTANCES;
  const totalApps = apps.length;
  const syncedPct = totalApps === 0 ? 100 : metrics.syncSuccessRate;
  const connected = instances.filter((i) => i.clusterConnectivity.startsWith("1")).length;
  const failedSyncs24h = instances.reduce((sum, inst) => sum + inst.failedSyncs24h, 0);
  const canAccessMetrics = permission === "edit";

  const syncSegments: DonutSegment[] = [
    {
      key: "synced",
      label: "Synced",
      count: metrics.synced,
      color: SEGMENT_COLORS.synced,
      filterType: "sync",
      filterValue: "Synced",
    },
    {
      key: "outOfSync",
      label: "Out of sync",
      count: metrics.outOfSync,
      color: SEGMENT_COLORS.outOfSync,
      filterType: "sync",
      filterValue: "OutOfSync",
    },
  ];

  const healthSegments: DonutSegment[] = [
    {
      key: "healthy",
      label: "Healthy",
      count: metrics.healthy,
      color: SEGMENT_COLORS.healthy,
      filterType: "health",
      filterValue: "Healthy",
    },
    {
      key: "progressing",
      label: "Progressing",
      count: metrics.progressing,
      color: SEGMENT_COLORS.progressing,
      filterType: "health",
      filterValue: "Progressing",
    },
    {
      key: "degraded",
      label: "Degraded",
      count: metrics.degraded,
      color: SEGMENT_COLORS.degraded,
      filterType: "health",
      filterValue: "Degraded",
    },
    {
      key: "paused",
      label: "Paused",
      count: metrics.paused,
      color: SEGMENT_COLORS.paused,
      filterType: "health",
      filterValue: "Paused",
    },
    {
      key: "aborting",
      label: "Aborting",
      count: metrics.aborting,
      color: SEGMENT_COLORS.aborting,
      filterType: "health",
      filterValue: "Aborting",
    },
  ];

  const navigateToFilteredApps = (segment: DonutSegment) => {
    if (segment.count === 0) return;
    const filters =
      segment.filterType === "sync"
        ? { sync: [segment.filterValue] }
        : { health: [segment.filterValue] };
    navigate(buildGitOpsAppsUrl(GITOPS_ALL_INSTANCES, filters));
  };

  const openAgenticAttention = () => {
    navigate("/gitops/applications?attention=1");
  };

  const openMetrics = (metric: "sync" | "reconcile") => {
    if (!canAccessMetrics) {
      setMetricsDenied(
        `Observe | Metrics requires Cluster Admin access. Switch demo permission to Edit to open ${metric === "sync" ? "Sync" : "Reconciliation"} activity metrics.`
      );
      return;
    }
    navigate(`/observe/metrics?query=argocd_app_${metric === "sync" ? "sync" : "reconcile"}_total`);
  };

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/overview" },
          { label: "Overview", path: "/gitops/overview" },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
              <Title headingLevel="h1" size="2xl">
                GitOps Overview
              </Title>
              <FavoriteButton name="GitOps Overview" path="/gitops/overview" />
            </Flex>
          </Flex>

          {metricsDenied ? (
            <Alert
              variant="warning"
              isInline
              title="Metrics access required"
              actionClose={<Button variant="plain" onClick={() => setMetricsDenied(null)}>Dismiss</Button>}
            >
              {metricsDenied}
            </Alert>
          ) : null}

          {totalApps === 0 ? (
            <EmptyState titleText="No GitOps applications in this project">
              <EmptyStateBody>
                Switch <strong>Project</strong> to <strong>All projects</strong> or choose a namespace that
                contains Argo CD Applications. Create an application from the Applications list when you are
                ready.
              </EmptyStateBody>
              <Button variant="primary" onClick={() => navigate("/gitops/applications")}>
                Go to Applications
              </Button>
            </EmptyState>
          ) : (
          <Grid hasGutter>
            <GridItem md={4}>
              <Card isFullHeight>
                <CardTitle>Sync status</CardTitle>
                <CardBody>
                  <MultiSegmentDonut
                    title="Apps"
                    segments={syncSegments}
                    total={totalApps}
                    onSegmentClick={navigateToFilteredApps}
                    onOpenAgenticAttention={openAgenticAttention}
                  />
                </CardBody>
              </Card>
            </GridItem>
            <GridItem md={4}>
              <Card isFullHeight>
                <CardTitle>Health status</CardTitle>
                <CardBody>
                  <MultiSegmentDonut
                    title="Apps"
                    segments={healthSegments}
                    total={totalApps}
                    onSegmentClick={navigateToFilteredApps}
                    onOpenAgenticAttention={openAgenticAttention}
                  />
                </CardBody>
              </Card>
            </GridItem>
            <GridItem md={4}>
              <Card isFullHeight>
                <CardTitle>Operational metrics</CardTitle>
                <CardBody>
                  <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                    <MetricRow
                      label="Sync success rate"
                      value={`${syncedPct}%`}
                      tone={syncedPct >= 90 ? "good" : "warning"}
                      agenticHint={
                        syncedPct < 90 && metrics.needsAttention.length > 0
                          ? {
                              title: "Sync success rate",
                              detail: `${metrics.outOfSync} application(s) out of sync. Use View Agentic Run on those applications or open the attention list.`,
                              onAction: openAgenticAttention,
                            }
                          : undefined
                      }
                    />
                    <MetricRow
                      label="Failed syncs (24h)"
                      value={String(failedSyncs24h)}
                      tone={toneForCount(failedSyncs24h)}
                      agenticHint={
                        failedSyncs24h > 0
                          ? {
                              title: "Failed syncs",
                              detail:
                                "Review failed sync operations and open AgenticRun details for related applications.",
                              onAction: openAgenticAttention,
                            }
                          : undefined
                      }
                    />
                    <MetricRow
                      label="Reconciliations (1h)"
                      value={
                        <Label color={labelColorForTone("info")} isCompact>
                          {Math.max(8, Math.round(metrics.reconciliations24h / 8))}
                        </Label>
                      }
                    />
                    <MetricRow
                      label="Cluster connectivity"
                      value={
                        <Label color={connectivityLabelColor(connected, instances.length)} isCompact>
                          {connected}/{instances.length || 0}
                        </Label>
                      }
                    />
                    <MetricRow label="Repo queue" value="0" tone="good" />
                    <MetricRow
                      label="Git fetch failures (24h)"
                      value={String(metrics.gitFetchFailures)}
                      tone={toneForCount(metrics.gitFetchFailures)}
                      agenticHint={
                        metrics.gitFetchFailures > 0
                          ? {
                              title: "Git fetch failures",
                              detail:
                                "Repository fetch errors can block sync. Investigate affected applications with AgenticRun.",
                              onAction: () => navigate("/gitops/applications?attention=1"),
                            }
                          : undefined
                      }
                    />
                  </Flex>
                </CardBody>
              </Card>
            </GridItem>
            <GridItem md={6}>
              <Card
                isClickable
                isFullHeight
                onClick={() => openMetrics("sync")}
                className="ocs-gitops-activity-card"
              >
                <CardTitle>Sync activity (24h)</CardTitle>
                <CardBody>
                  {metrics.outOfSync === 0 && operations.every((o) => o.phase === "Succeeded") ? (
                    <Content component="p" className="pf-v6-u-color-200">
                      No sync operations in the last 24 hours. Open metrics for historical sync activity.
                    </Content>
                  ) : (
                    <Popover
                      triggerAction="hover"
                      headerContent="Out of sync"
                      bodyContent={(hide) => (
                        <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                          <Content component="p">
                            {metrics.outOfSync} application{metrics.outOfSync === 1 ? "" : "s"} currently out of
                            sync. Open AgenticRun details from the application list or details page.
                          </Content>
                          <Flex
                            className="ocs-gitops-popover-actions"
                            gap={{ default: "gapMd" }}
                            alignItems={{ default: "alignItemsCenter" }}
                            flexWrap={{ default: "wrap" }}
                          >
                            <Button
                              variant="link"
                              isInline
                              icon={<RhAiExperienceIcon aria-hidden />}
                              onClick={(e) => {
                                e.stopPropagation();
                                hide();
                                openAgenticAttention();
                              }}
                            >
                              View Agentic Run
                            </Button>
                          </Flex>
                        </Flex>
                      )}
                    >
                      <Content component="p" tabIndex={0}>
                        {metrics.outOfSync} application{metrics.outOfSync === 1 ? "" : "s"} currently out of sync.
                        Hover for Agentic Run. Click card for Observe | Metrics.
                      </Content>
                    </Popover>
                  )}
                </CardBody>
              </Card>
            </GridItem>
            <GridItem md={6}>
              <Card
                isClickable
                isFullHeight
                onClick={() => openMetrics("reconcile")}
                className="ocs-gitops-activity-card"
              >
                <CardTitle>Reconciliation activity (24h)</CardTitle>
                <CardBody>
                  <div style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={RECONCILE_SERIES}>
                        <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 24]} tick={{ fontSize: 11 }} width={32} />
                        <Tooltip />
                        <Line type="monotone" dataKey="v" stroke={PF_CHART.info} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <Content component="small" className="pf-v6-u-color-200 pf-v6-u-mt-sm">
                    Click chart to open Observe | Metrics.
                  </Content>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
          )}

          {totalApps > 0 && metrics.needsAttention.length > 0 ? (
            <Card>
              <CardTitle>Needs attention</CardTitle>
              <CardBody>
                <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
                  <Content component="small" className="pf-v6-u-color-200">
                    {metrics.needsAttention.length} application{metrics.needsAttention.length !== 1 ? "s" : ""} need
                    attention. Hover problem metrics above or use <strong>View Agentic Run</strong> below.
                  </Content>
                  <OcsPrototypeListTable ariaLabel="Applications needing attention">
                    <Thead>
                      <Tr>
                        <Th dataLabel="Application">
                          <PlainTableHeader label="Application" />
                        </Th>
                        <Th dataLabel="Reason">
                          <PlainTableHeader label="Reason" />
                        </Th>
                        <Th dataLabel="Status">
                          <PlainTableHeader label="Status" />
                        </Th>
                        <Th modifier="fitContent" dataLabel="Actions">
                          <PlainTableHeader label="Actions" />
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {metrics.needsAttention.map((item) => {
                        const app = findApplication(item.ns, item.name);
                        const statusKey = app?.health === "Degraded" || app?.health === "Aborting" ? app.health : app?.sync ?? "OutOfSync";
                        const showRun = app ? applicationNeedsAiTroubleshoot(app) : true;
                        return (
                          <Tr
                            key={`${item.ns}/${item.name}`}
                            onClick={() => navigate(gitopsDetailPath("applications", item.ns, item.name))}
                          >
                            <Td dataLabel="Application">
                              <ResourceName
                                kind="Application"
                                name={item.name}
                                to={gitopsDetailPath("applications", item.ns, item.name)}
                              />
                            </Td>
                            <Td dataLabel="Reason">{item.reason}</Td>
                            <Td dataLabel="Status">
                              {app ? (
                                <HealthStatus
                                  status={statusKey}
                                  showAiRemediation={showRun}
                                  onAiRemediationClick={(event) => {
                                    event.stopPropagation();
                                    launchAppInvestigate(item.ns, item.name, item.reason);
                                  }}
                                />
                              ) : showRun ? (
                                <ViewAgenticRunButton
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    launchAppInvestigate(item.ns, item.name, item.reason);
                                  }}
                                />
                              ) : (
                                <Label color={severityLabelColor(item.severity)} isCompact>
                                  {item.severity}
                                </Label>
                              )}
                            </Td>
                            <Td dataLabel="Actions" isActionCell hasAction>
                              {showRun ? (
                                <GitOpsEditDeleteMenu
                                  kind="Application"
                                  name={item.name}
                                  showResourceActions={false}
                                  extraItems={[
                                    {
                                      id: "open-application",
                                      label: "View application",
                                      prototypeOnly: true,
                                    },
                                  ]}
                                  onItemSelect={(actionId) => {
                                    if (actionId === "open-application") {
                                      navigate(gitopsDetailPath("applications", item.ns, item.name));
                                    }
                                  }}
                                  agenticOnSelect={() => launchAppInvestigate(item.ns, item.name, item.reason)}
                                />
                              ) : (
                                <Content component="span" className="pf-v6-u-color-200">
                                  —
                                </Content>
                              )}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </OcsPrototypeListTable>
                </Flex>
              </CardBody>
            </Card>
          ) : null}

          {totalApps > 0 ? (
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            <Title headingLevel="h2" size="lg">
              Recent operations
            </Title>
            <OcsPrototypeListTable ariaLabel="Recent GitOps operations">
              <Thead>
                <Tr>
                  <Th dataLabel="Name">
                    <PlainTableHeader label="Name" />
                  </Th>
                  <Th dataLabel="Phase">
                    <PlainTableHeader label="Phase" />
                  </Th>
                  <Th dataLabel="Message">
                    <PlainTableHeader label="Message" />
                  </Th>
                  <Th dataLabel="Finished">
                    <PlainTableHeader label="Finished" />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {operations.length === 0 ? (
                  <Tr>
                    <Td colSpan={4}>No recent operations.</Td>
                  </Tr>
                ) : (
                  operations.map((op) => {
                    const opApp = findApplication(op.ns, op.name);
                    const showOpAi = opApp ? applicationNeedsAiTroubleshoot(opApp) : op.phase === "Failed";
                    return (
                    <Tr
                      key={`${op.ns}/${op.name}`}
                      onClick={() => navigate(gitopsDetailPath("applications", op.ns, op.name))}
                    >
                      <Td dataLabel="Name">
                        <ResourceName
                          kind="Application"
                          name={op.name}
                          to={gitopsDetailPath("applications", op.ns, op.name)}
                        />
                      </Td>
                      <Td dataLabel="Phase">
                        <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }} alignItems={{ default: "alignItemsFlexStart" }}>
                          <Label color={operationPhaseLabelColor(op.phase)} isCompact>
                            {op.phase}
                          </Label>
                          {showOpAi && opApp ? (
                            <ViewAgenticRunButton
                              onClick={(event) => {
                                event.stopPropagation();
                                launchAppInvestigate(op.ns, op.name, op.message);
                              }}
                            />
                          ) : null}
                        </Flex>
                      </Td>
                      <Td dataLabel="Message">{op.message}</Td>
                      <Td dataLabel="Finished">{op.finished}</Td>
                    </Tr>
                    );
                  })
                )}
              </Tbody>
            </OcsPrototypeListTable>
          </Flex>
          ) : null}

          <Title headingLevel="h2" size="lg">
            Infrastructure
          </Title>
          <Gallery hasGutter minWidths={{ default: "220px" }}>
            <GalleryItem>
              <Card isClickable onClick={() => navigate("/gitops/settings")}>
                <CardTitle>GitOps Operator</CardTitle>
                <CardBody>
                  <Label color={labelColorForTone("good")} isCompact>
                    Available
                  </Label>
                  <Content component="p" className="pf-v6-u-mt-sm">
                    {ARGO_INSTANCES.length} instances registered. Open Settings.
                  </Content>
                </CardBody>
              </Card>
            </GalleryItem>
            <GalleryItem>
              <Card isClickable onClick={() => navigate("/gitops/rollouts")}>
                <CardTitle>Rollout Managers</CardTitle>
                <CardBody>
                  <Content component="p">{GITOPS_ROLLOUTS.length} rollouts across this cluster.</Content>
                </CardBody>
              </Card>
            </GalleryItem>
            <GalleryItem>
              <Card isClickable onClick={() => navigate("/gitops/applicationsets")}>
                <CardTitle>ApplicationSets</CardTitle>
                <CardBody>
                  <Content component="p">{GITOPS_APPLICATION_SETS.length} generators managing tenant apps.</Content>
                </CardBody>
              </Card>
            </GalleryItem>
          </Gallery>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}

function MetricRow({
  label,
  value,
  tone,
  agenticHint,
}: {
  label: string;
  value: ReactNode;
  tone?: "good" | "info" | "informational" | "warning" | "critical" | "neutral";
  agenticHint?: {
    title: string;
    detail: string;
    onAction: () => void;
  };
}) {
  const iconColor =
    tone === "good"
      ? PF_CHART.good
      : tone === "warning"
        ? PF_CHART.warning
        : tone === "critical"
          ? PF_CHART.critical
          : tone === "informational"
            ? PF_CHART.informational
            : tone === "info"
              ? PF_CHART.info
              : undefined;

  const row = (
    <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} gap={{ default: "gapMd" }}>
      <Content component="small">{label}</Content>
      {typeof value === "string" ? (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapXs" }}>
          {tone === "critical" || tone === "warning" ? (
            <ExclamationCircleIcon color={iconColor} aria-hidden />
          ) : iconColor ? (
            <CheckCircleIcon color={iconColor} aria-hidden />
          ) : null}
          <strong>{value}</strong>
        </Flex>
      ) : (
        value
      )}
    </Flex>
  );

  if (!agenticHint) {
    return row;
  }

  return (
    <Popover
      triggerAction="hover"
      headerContent={agenticHint.title}
      bodyContent={(hide) => (
        <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
          <Content component="p">{agenticHint.detail}</Content>
          <Flex
            className="ocs-gitops-popover-actions"
            gap={{ default: "gapMd" }}
            alignItems={{ default: "alignItemsCenter" }}
            flexWrap={{ default: "wrap" }}
          >
            <Button
              variant="link"
              isInline
              icon={<RhAiExperienceIcon aria-hidden />}
              onClick={(e) => {
                e.stopPropagation();
                hide();
                agenticHint.onAction();
              }}
            >
              View Agentic Run
            </Button>
          </Flex>
        </Flex>
      )}
    >
      <div className="ocs-gitops-metric-hint" tabIndex={0} role="group" aria-label={`${label}, hover for Agentic Run`}>
        {row}
      </div>
    </Popover>
  );
}
