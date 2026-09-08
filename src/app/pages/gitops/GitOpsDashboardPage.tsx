import { type ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardTitle,
  Content,
  Flex,
  Gallery,
  GalleryItem,
  Grid,
  GridItem,
  Label,
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
import { OcsPrototypeListTable, PlainTableHeader } from "../../components/dataView/OcsPrototypeListTable";
import { usePrototypeDemo } from "../../contexts/PrototypeDemoContext";
import {
  ARGO_INSTANCES,
  GITOPS_ALL_INSTANCES,
  GITOPS_APPLICATION_SETS,
  GITOPS_ROLLOUTS,
  applicationSetsForInstance,
  applicationsForInstance,
  appProjectsForInstance,
  dashboardMetricsForInstance,
  gitopsDetailPath,
  recentOperationsForInstance,
} from "./gitopsData";
import GitOpsInstancePicker, { useGitOpsInstance } from "./GitOpsInstancePicker";
import { HealthStatus, ResourceName } from "./gitopsShared";
import {
  connectivityLabelColor,
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
  synced: PF_CHART.good,
  outOfSync: PF_CHART.warning,
  healthy: PF_CHART.good,
  progressing: PF_CHART.informational,
  degraded: PF_CHART.critical,
  paused: PF_CHART.neutral,
};

function MultiSegmentDonut({
  title,
  segments,
  total,
  onSegmentClick,
}: {
  title: string;
  segments: DonutSegment[];
  total: number;
  onSegmentClick: (segment: DonutSegment) => void;
}) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const safeTotal = total || 1;
  let offset = 0;
  const visible = segments.filter((s) => s.count > 0);

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
          {visible.map((segment) => {
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
          })}
          <text x="55" y="52" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight={600}>
            {total}
          </text>
          <text x="55" y="70" textAnchor="middle" fill="currentColor" fontSize="11">
            {title}
          </text>
        </svg>
      </div>
      <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }} className="ocs-gitops-donut-legend">
        {visible.map((segment) => {
          const pct = Math.round((segment.count / safeTotal) * 100);
          return (
            <Button
              key={segment.key}
              variant="link"
              isInline
              className="ocs-gitops-donut-legend__item"
              onClick={() => onSegmentClick(segment)}
            >
              <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                <span
                  className="ocs-gitops-donut-legend__swatch"
                  style={{ backgroundColor: segment.color }}
                  aria-hidden
                />
                <Content component="small">
                  {segment.label}: {segment.count} ({pct}%)
                </Content>
              </Flex>
            </Button>
          );
        })}
      </Flex>
    </Flex>
  );
}

const RECONCILE_SERIES = [
  { t: "0h", v: 8 },
  { t: "4h", v: 14 },
  { t: "8h", v: 11 },
  { t: "12h", v: 18 },
  { t: "16h", v: 16 },
  { t: "20h", v: 19 },
  { t: "24h", v: 17 },
];

export default function GitOpsDashboardPage() {
  const navigate = useNavigate();
  const { permission } = usePrototypeDemo();
  const [metricsDenied, setMetricsDenied] = useState<string | null>(null);
  const { instance, setInstance } = useGitOpsInstance();
  const apps = applicationsForInstance(instance);
  const metrics = dashboardMetricsForInstance(instance);
  const projects = appProjectsForInstance(instance);
  const appSets = applicationSetsForInstance(instance);
  const operations = recentOperationsForInstance(instance);
  const instances =
    instance === GITOPS_ALL_INSTANCES
      ? ARGO_INSTANCES
      : ARGO_INSTANCES.filter((a) => `${a.ns}/${a.name}` === instance);
  const totalApps = apps.length;
  const syncedPct = totalApps === 0 ? 100 : metrics.syncSuccessRate;
  const healthyPct = totalApps === 0 ? 100 : Math.round((metrics.healthy / totalApps) * 100);
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
  ];

  const navigateToFilteredApps = (segment: DonutSegment) => {
    const param = segment.filterType === "sync" ? "sync" : "health";
    navigate(`/gitops/applications?${param}=${encodeURIComponent(segment.filterValue)}`);
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
            <GitOpsInstancePicker instance={instance} setInstance={setInstance} />
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

          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapLg" }}
          >
            <Flex gap={{ default: "gapXl" }} flexWrap={{ default: "wrap" }}>
              <div>
                <Title headingLevel="h2" size="2xl">
                  {totalApps}
                </Title>
                <Content component="small">Applications</Content>
              </div>
              <div>
                <Title headingLevel="h2" size="xl">
                  {syncedPct}% Synced
                </Title>
                <Content component="small">Sync status</Content>
              </div>
              <div>
                <Title headingLevel="h2" size="xl">
                  {healthyPct}% Healthy
                </Title>
                <Content component="small">Health status</Content>
              </div>
              <div>
                <Title headingLevel="h2" size="xl">
                  {metrics.needsAttention.length}
                </Title>
                <Content component="small">Needs attention</Content>
              </div>
            </Flex>
            <Flex gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
              <ButtonLink to="/gitops/applicationsets">{appSets.length} AppSets</ButtonLink>
              <ButtonLink to="/gitops/appprojects">{projects.length} Projects</ButtonLink>
              <ButtonLink to="/gitops/argocd">{instances.length} Instances</ButtonLink>
            </Flex>
          </Flex>

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
                  />
                </CardBody>
              </Card>
            </GridItem>
            <GridItem md={4}>
              <Card isFullHeight>
                <CardTitle>Operational metrics</CardTitle>
                <CardBody>
                  <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                    <MetricRow label="Sync success rate" value={`${syncedPct}%`} tone="good" />
                    <MetricRow
                      label="Failed syncs (24h)"
                      value={String(failedSyncs24h)}
                      tone={toneForCount(failedSyncs24h)}
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
                    <Content component="p">
                      {metrics.outOfSync} application{metrics.outOfSync === 1 ? "" : "s"} currently out of sync.
                      Click to open Observe | Metrics.
                    </Content>
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

          {metrics.needsAttention.length > 0 ? (
            <Card>
              <CardTitle>Needs attention</CardTitle>
              <CardBody>
                <OcsPrototypeListTable ariaLabel="Applications needing attention">
                  <Thead>
                    <Tr>
                      <Th dataLabel="Application">
                        <PlainTableHeader label="Application" />
                      </Th>
                      <Th dataLabel="Reason">
                        <PlainTableHeader label="Reason" />
                      </Th>
                      <Th dataLabel="Severity">
                        <PlainTableHeader label="Severity" />
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {metrics.needsAttention.map((item) => (
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
                        <Td dataLabel="Severity">
                          <Label color={severityLabelColor(item.severity)} isCompact>
                            {item.severity}
                          </Label>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </OcsPrototypeListTable>
              </CardBody>
            </Card>
          ) : null}

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
                  operations.map((op) => (
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
                        <Label color={operationPhaseLabelColor(op.phase)} isCompact>
                          {op.phase}
                        </Label>
                      </Td>
                      <Td dataLabel="Message">{op.message}</Td>
                      <Td dataLabel="Finished">{op.finished}</Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </OcsPrototypeListTable>
          </Flex>

          <Title headingLevel="h2" size="lg">
            Infrastructure
          </Title>
          <Gallery hasGutter minWidths={{ default: "220px" }}>
            <GalleryItem>
              <Card isClickable onClick={() => navigate("/gitops/settings")}>
                <CardTitle>GitOps Operator</CardTitle>
                <CardBody>
                  <Label color="green" isCompact>
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

function ButtonLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="pf-v6-c-button pf-m-link pf-m-inline" onClick={(e) => e.stopPropagation()}>
      {children}
    </Link>
  );
}

function MetricRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: "good" | "info" | "informational" | "warning" | "critical" | "neutral";
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

  return (
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
}
