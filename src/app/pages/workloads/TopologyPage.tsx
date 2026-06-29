import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Button,
  Content,
  Pagination,
  PaginationVariant,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import {
  ZoomIn, ZoomOut, Maximize2, List, LayoutGrid, Search, Filter,
  ExternalLink, Globe, Box, Database, ChevronRight, X, MoreVertical,
  ArrowUpRight, RefreshCw, Layers, GitBranch, CheckCircle2, AlertTriangle,
  XCircle, Clock, ChevronDown, ChevronUp, Play, Pause, Trash2, Edit, Copy, Terminal
} from "@/lib/pfIcons";
import { useNavigate } from "react-router";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { IoDataViewFiltersWithMidActions } from "../../components/dataView/IoDataViewFiltersWithMidActions";
import {
  OCS_PROTOTYPE_DATAVIEW_CLASS,
  OCS_PROTOTYPE_TOOLBAR_CLASS,
  OcsPrototypeListTable,
  PlainTableHeader,
  SortableTableHeader,
  compareStrings,
  useListPagination,
  useTableSort,
  type SortDirection,
} from "../../components/dataView/OcsPrototypeListTable";

// ── Data types ──
type PodPhase = "Running" | "Pending" | "Succeeded" | "Failed" | "Terminating";
type WorkloadKind = "Deployment" | "DeploymentConfig" | "StatefulSet" | "DaemonSet" | "Job" | "CronJob";

interface PodStatus {
  phase: PodPhase;
  count: number;
}

interface TopoNode {
  id: string;
  name: string;
  kind: WorkloadKind;
  app: string; // application grouping label
  namespace: string;
  podStatuses: PodStatus[];
  totalPods: number;
  desiredPods: number;
  image: string;
  routeURL?: string;
  buildStatus?: "Complete" | "Running" | "Failed" | "New";
  gitBranch?: string;
  services: string[];
  routes: string[];
  x: number;
  y: number;
}

interface AppGroup {
  name: string;
  nodeIds: string[];
}

// ── Mock Data ──
const NAMESPACES = ["production", "development", "logging", "monitoring", "openshift-operators"];

function createMockData(ns: string): { nodes: TopoNode[]; groups: AppGroup[] } {
  if (ns === "production") {
    return {
      nodes: [
        {
          id: "frontend-deploy", name: "frontend", kind: "Deployment", app: "ecommerce-app",
          namespace: ns, podStatuses: [{ phase: "Running", count: 3 }], totalPods: 3, desiredPods: 3,
          image: "quay.io/acme/frontend:v2.4.1", routeURL: "https://shop.apps.ocp.example.com",
          buildStatus: "Complete", gitBranch: "main", services: ["frontend-svc"], routes: ["frontend-route"],
          x: 180, y: 140,
        },
        {
          id: "api-deploy", name: "api-gateway", kind: "Deployment", app: "ecommerce-app",
          namespace: ns, podStatuses: [{ phase: "Running", count: 2 }, { phase: "Pending", count: 1 }],
          totalPods: 3, desiredPods: 3, image: "quay.io/acme/api:v1.8.0",
          routeURL: "https://api.apps.ocp.example.com", buildStatus: "Running", gitBranch: "develop",
          services: ["api-svc"], routes: ["api-route"], x: 480, y: 120,
        },
        {
          id: "cart-deploy", name: "cart-service", kind: "Deployment", app: "ecommerce-app",
          namespace: ns, podStatuses: [{ phase: "Running", count: 2 }], totalPods: 2, desiredPods: 2,
          image: "quay.io/acme/cart:v1.2.3", services: ["cart-svc"], routes: [],
          x: 480, y: 320,
        },
        {
          id: "postgres-ss", name: "postgres", kind: "StatefulSet", app: "ecommerce-app",
          namespace: ns, podStatuses: [{ phase: "Running", count: 1 }], totalPods: 1, desiredPods: 1,
          image: "registry.redhat.io/rhel9/postgresql-15:latest", services: ["postgres-svc"], routes: [],
          x: 780, y: 200,
        },
        {
          id: "redis-deploy", name: "redis-cache", kind: "Deployment", app: "ecommerce-app",
          namespace: ns, podStatuses: [{ phase: "Running", count: 1 }], totalPods: 1, desiredPods: 1,
          image: "registry.redhat.io/rhel9/redis-7:latest", services: ["redis-svc"], routes: [],
          x: 780, y: 380,
        },
        {
          id: "nginx-deploy", name: "nginx-ingress", kind: "Deployment", app: "infrastructure",
          namespace: ns, podStatuses: [{ phase: "Running", count: 2 }], totalPods: 2, desiredPods: 2,
          image: "quay.io/nginx/nginx-ingress:3.4", routeURL: "https://nginx.apps.ocp.example.com",
          services: ["nginx-svc"], routes: ["nginx-route"], x: 180, y: 480,
        },
        {
          id: "worker-job", name: "data-migration", kind: "Job", app: "infrastructure",
          namespace: ns, podStatuses: [{ phase: "Succeeded", count: 1 }], totalPods: 1, desiredPods: 1,
          image: "quay.io/acme/migrate:v0.3", buildStatus: "Complete", services: [], routes: [],
          x: 480, y: 520,
        },
      ],
      groups: [
        { name: "ecommerce-app", nodeIds: ["frontend-deploy", "api-deploy", "cart-deploy", "postgres-ss", "redis-deploy"] },
        { name: "infrastructure", nodeIds: ["nginx-deploy", "worker-job"] },
      ],
    };
  }
  if (ns === "development") {
    return {
      nodes: [
        {
          id: "dev-frontend", name: "frontend-dev", kind: "Deployment", app: "dev-app",
          namespace: ns, podStatuses: [{ phase: "Running", count: 1 }], totalPods: 1, desiredPods: 1,
          image: "quay.io/acme/frontend:dev", buildStatus: "Running", gitBranch: "feature/checkout",
          services: ["frontend-dev-svc"], routes: ["frontend-dev-route"],
          routeURL: "https://dev.apps.ocp.example.com", x: 280, y: 200,
        },
        {
          id: "dev-api", name: "api-dev", kind: "DeploymentConfig", app: "dev-app",
          namespace: ns, podStatuses: [{ phase: "Running", count: 1 }, { phase: "Failed", count: 1 }],
          totalPods: 2, desiredPods: 2, image: "quay.io/acme/api:dev", buildStatus: "Failed",
          gitBranch: "feature/payments", services: ["api-dev-svc"], routes: [], x: 580, y: 200,
        },
        {
          id: "dev-db", name: "mongo-dev", kind: "StatefulSet", app: "dev-app",
          namespace: ns, podStatuses: [{ phase: "Running", count: 1 }], totalPods: 1, desiredPods: 1,
          image: "mongo:7.0", services: ["mongo-dev-svc"], routes: [], x: 580, y: 400,
        },
      ],
      groups: [{ name: "dev-app", nodeIds: ["dev-frontend", "dev-api", "dev-db"] }],
    };
  }
  if (ns === "monitoring") {
    return {
      nodes: [
        {
          id: "prom-ss", name: "prometheus", kind: "StatefulSet", app: "monitoring-stack",
          namespace: ns, podStatuses: [{ phase: "Running", count: 2 }], totalPods: 2, desiredPods: 2,
          image: "prom/prometheus:v2.51.0", services: ["prometheus-svc"], routes: ["prometheus-route"],
          routeURL: "https://prometheus.apps.ocp.example.com", x: 280, y: 200,
        },
        {
          id: "grafana-deploy", name: "grafana", kind: "Deployment", app: "monitoring-stack",
          namespace: ns, podStatuses: [{ phase: "Running", count: 1 }], totalPods: 1, desiredPods: 1,
          image: "grafana/grafana:10.3.1", routeURL: "https://grafana.apps.ocp.example.com",
          services: ["grafana-svc"], routes: ["grafana-route"], x: 580, y: 200,
        },
        {
          id: "alertmgr-deploy", name: "alertmanager", kind: "Deployment", app: "monitoring-stack",
          namespace: ns, podStatuses: [{ phase: "Running", count: 1 }], totalPods: 1, desiredPods: 1,
          image: "prom/alertmanager:v0.27.0", services: ["alertmanager-svc"], routes: [], x: 430, y: 380,
        },
      ],
      groups: [{ name: "monitoring-stack", nodeIds: ["prom-ss", "grafana-deploy", "alertmgr-deploy"] }],
    };
  }
  // logging & others
  return {
    nodes: [
      {
        id: "es-ss", name: "elasticsearch", kind: "StatefulSet", app: "logging-stack",
        namespace: ns, podStatuses: [{ phase: "Running", count: 3 }], totalPods: 3, desiredPods: 3,
        image: "docker.elastic.co/elasticsearch/elasticsearch:8.12.0",
        services: ["elasticsearch-svc"], routes: [], x: 300, y: 200,
      },
      {
        id: "kibana-deploy", name: "kibana", kind: "Deployment", app: "logging-stack",
        namespace: ns, podStatuses: [{ phase: "Running", count: 1 }], totalPods: 1, desiredPods: 1,
        image: "docker.elastic.co/kibana/kibana:8.12.0", routeURL: "https://kibana.apps.ocp.example.com",
        services: ["kibana-svc"], routes: ["kibana-route"], x: 600, y: 200,
      },
      {
        id: "fluentd-ds", name: "fluentd", kind: "DaemonSet", app: "logging-stack",
        namespace: ns, podStatuses: [{ phase: "Running", count: 6 }], totalPods: 6, desiredPods: 6,
        image: "fluent/fluentd:v1.16", services: [], routes: [], x: 450, y: 380,
      },
    ],
    groups: [{ name: "logging-stack", nodeIds: ["es-ss", "kibana-deploy", "fluentd-ds"] }],
  };
}

// ── Connections between nodes based on their app grouping ──
function getConnections(nodes: TopoNode[]): { from: string; to: string }[] {
  const conns: { from: string; to: string }[] = [];
  // Create connections based on app grouping relationships
  const byApp: Record<string, TopoNode[]> = {};
  nodes.forEach((n) => {
    (byApp[n.app] ??= []).push(n);
  });
  Object.values(byApp).forEach((group) => {
    // Connect nodes that have services to downstream nodes
    for (let i = 0; i < group.length - 1; i++) {
      conns.push({ from: group[i].id, to: group[i + 1].id });
    }
  });
  return conns;
}

// ── Donut Chart Component ──
function PodDonut({ statuses, total, size = 52 }: { statuses: PodStatus[]; total: number; size?: number }) {
  const r = (size - 6) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const phaseColor: Record<PodPhase, string> = {
    Running: "#3e8635",
    Pending: "#f0ab00",
    Succeeded: "#0066cc",
    Failed: "#c9190b",
    Terminating: "#6a6e73",
  };

  let offset = 0;
  const segments = statuses.map((s) => {
    const pct = total > 0 ? s.count / total : 0;
    const dashArray = `${pct * circumference} ${circumference}`;
    const dashOffset = -offset * circumference;
    offset += pct;
    return { ...s, dashArray, dashOffset, color: phaseColor[s.phase] };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={5} />
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={5}
          strokeDasharray={seg.dashArray}
          strokeDashoffset={seg.dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        className="fill-[#151515] dark:fill-white" style={{ fontSize: 13, fontWeight: 600 }}>
        {total}
      </text>
    </svg>
  );
}

// ── Kind icon mapping ──
function KindIcon({ kind, size = 16 }: { kind: WorkloadKind; size?: number }) {
  const cls = `size-[${size}px]`;
  switch (kind) {
    case "Deployment":
    case "DeploymentConfig":
      return <Box className={cls} />;
    case "StatefulSet":
      return <Database className={cls} />;
    case "DaemonSet":
      return <Layers className={cls} />;
    case "Job":
    case "CronJob":
      return <Clock className={cls} />;
  }
}

const kindColors: Record<WorkloadKind, string> = {
  Deployment: "#0066cc",
  DeploymentConfig: "#6753ac",
  StatefulSet: "#009596",
  DaemonSet: "#8f4700",
  Job: "#5752d1",
  CronJob: "#5752d1",
};

// ── Side Panel ──
function SidePanel({ node, onClose }: { node: TopoNode; onClose: () => void }) {
  const [tab, setTab] = useState<"details" | "resources" | "observe">("details");
  const borderColor = kindColors[node.kind];

  const buildStatusColor: Record<string, string> = {
    Complete: "text-[#3e8635] bg-[#e8f5e9]",
    Running: "text-[#0066cc] bg-[#e7f1fa]",
    Failed: "text-[#c9190b] bg-[#fce8e8]",
    New: "text-[#6a6e73] bg-[#f0f0f0]",
  };

  return (
    <div className="w-[380px] h-full border-l border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#1a1a1a] flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="px-[16px] py-[14px] border-b border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] flex items-center gap-[12px]">
        <div className="size-[36px] rounded-[8px] flex items-center justify-center" style={{ backgroundColor: `${borderColor}18`, color: borderColor }}>
          <KindIcon kind={node.kind} size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[15px] text-[#151515] dark:text-white truncate">{node.name}</h3>
          <p className="text-[12px] text-[#6a6e73] dark:text-[#a0a0a0]">{node.kind}</p>
        </div>
        <button onClick={onClose} className="p-[6px] hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] rounded-[999px]">
          <X className="size-[16px] text-[#6a6e73]" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
        {(["details", "resources", "observe"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-[10px] text-[13px] capitalize transition-colors ${tab === t
              ? "text-[#0066cc] dark:text-[#4dabf7] border-b-2 border-[#0066cc] dark:border-[#4dabf7]"
              : "text-[#6a6e73] hover:text-[#151515] dark:hover:text-white"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-[16px]">
        {tab === "details" && (
          <div className="flex flex-col gap-[16px]">
            {/* Status */}
            <div>
              <p className="text-[11px] text-[#6a6e73] dark:text-[#a0a0a0] uppercase tracking-wider mb-[6px]">Pod Status</p>
              <div className="flex items-center gap-[12px]">
                <PodDonut statuses={node.podStatuses} total={node.totalPods} size={44} />
                <div className="flex flex-col gap-[2px]">
                  {node.podStatuses.map((s, i) => (
                    <span key={i} className="text-[12px] text-[#151515] dark:text-white">
                      {s.count} {s.phase}
                    </span>
                  ))}
                  <span className="text-[11px] text-[#6a6e73]">Desired: {node.desiredPods}</span>
                </div>
              </div>
            </div>

            {/* Labels */}
            <div>
              <p className="text-[11px] text-[#6a6e73] dark:text-[#a0a0a0] uppercase tracking-wider mb-[6px]">Labels</p>
              <div className="flex flex-wrap gap-[4px]">
                <span className="px-[8px] py-[2px] text-[11px] rounded-[4px] bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.08)] text-[#151515] dark:text-white font-mono">
                  app={node.app}
                </span>
                <span className="px-[8px] py-[2px] text-[11px] rounded-[4px] bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.08)] text-[#151515] dark:text-white font-mono">
                  app.kubernetes.io/name={node.name}
                </span>
                <span className="px-[8px] py-[2px] text-[11px] rounded-[4px] bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.08)] text-[#151515] dark:text-white font-mono">
                  app.kubernetes.io/part-of={node.app}
                </span>
              </div>
            </div>

            {/* Annotations / Info */}
            <div>
              <p className="text-[11px] text-[#6a6e73] dark:text-[#a0a0a0] uppercase tracking-wider mb-[6px]">Details</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-[12px] gap-y-[6px] text-[12px]">
                <span className="text-[#6a6e73] dark:text-[#a0a0a0]">Namespace</span>
                <span className="text-[#151515] dark:text-white font-mono">{node.namespace}</span>
                <span className="text-[#6a6e73] dark:text-[#a0a0a0]">Image</span>
                <span className="text-[#151515] dark:text-white font-mono text-[11px] break-all">{node.image}</span>
                {node.gitBranch && <>
                  <span className="text-[#6a6e73] dark:text-[#a0a0a0]">Git Branch</span>
                  <span className="text-[#151515] dark:text-white flex items-center gap-[4px]">
                    <GitBranch className="size-[12px]" /> {node.gitBranch}
                  </span>
                </>}
                {node.buildStatus && <>
                  <span className="text-[#6a6e73] dark:text-[#a0a0a0]">Build</span>
                  <span className={`px-[6px] py-[1px] rounded-[4px] text-[11px] font-semibold w-fit ${buildStatusColor[node.buildStatus]}`}>
                    {node.buildStatus}
                  </span>
                </>}
              </div>
            </div>

            {node.routeURL && (
              <div>
                <p className="text-[11px] text-[#6a6e73] dark:text-[#a0a0a0] uppercase tracking-wider mb-[6px]">Route</p>
                <a href="#" className="text-[12px] text-[#0066cc] dark:text-[#4dabf7] flex items-center gap-[4px] hover:underline font-mono break-all" onClick={(e) => e.preventDefault()}>
                  <ExternalLink className="size-[12px] shrink-0" /> {node.routeURL}
                </a>
              </div>
            )}
          </div>
        )}

        {tab === "resources" && (
          <div className="flex flex-col gap-[16px]">
            {/* Pods */}
            <div>
              <p className="text-[11px] text-[#6a6e73] dark:text-[#a0a0a0] uppercase tracking-wider mb-[8px]">Pods</p>
              <div className="flex flex-col gap-[4px]">
                {node.podStatuses.flatMap((s) =>
                  Array.from({ length: s.count }, (_, i) => (
                    <div key={`${s.phase}-${i}`}
                      className="flex items-center gap-[8px] px-[10px] py-[8px] rounded-[999px] bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(0,0,0,0.04)] dark:hover:bg-[rgba(255,255,255,0.06)] cursor-pointer">
                      <div className={`size-[8px] rounded-full ${s.phase === "Running" ? "bg-[#3e8635]" : s.phase === "Pending" ? "bg-[#f0ab00]" : s.phase === "Failed" ? "bg-[#c9190b]" : "bg-[#0066cc]"}`} />
                      <span className="text-[12px] font-mono text-[#151515] dark:text-white flex-1">
                        {node.name}-{Math.random().toString(36).slice(2, 7)}-{Math.random().toString(36).slice(2, 7)}
                      </span>
                      <span className={`text-[11px] ${s.phase === "Running" ? "text-[#3e8635]" : s.phase === "Pending" ? "text-[#f0ab00]" : s.phase === "Failed" ? "text-[#c9190b]" : "text-[#0066cc]"}`}>{s.phase}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Services */}
            {node.services.length > 0 && (
              <div>
                <p className="text-[11px] text-[#6a6e73] dark:text-[#a0a0a0] uppercase tracking-wider mb-[8px]">Services</p>
                {node.services.map((svc) => (
                  <div key={svc} className="flex items-center gap-[8px] px-[10px] py-[8px] rounded-[999px] bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.03)]">
                    <Globe className="size-[14px] text-[#0066cc] dark:text-[#4dabf7]" />
                    <span className="text-[12px] font-mono text-[#151515] dark:text-white">{svc}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Routes */}
            {node.routes.length > 0 && (
              <div>
                <p className="text-[11px] text-[#6a6e73] dark:text-[#a0a0a0] uppercase tracking-wider mb-[8px]">Routes</p>
                {node.routes.map((rt) => (
                  <div key={rt} className="flex items-center gap-[8px] px-[10px] py-[8px] rounded-[999px] bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.03)]">
                    <ExternalLink className="size-[14px] text-[#3e8635] dark:text-[#81c784]" />
                    <span className="text-[12px] font-mono text-[#151515] dark:text-white">{rt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "observe" && (
          <div className="flex flex-col gap-[16px]">
            {/* Mini metrics */}
            <div>
              <p className="text-[11px] text-[#6a6e73] dark:text-[#a0a0a0] uppercase tracking-wider mb-[8px]">CPU Usage</p>
              <div className="h-[60px] bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] flex items-end px-[8px] pb-[4px] gap-[2px]">
                {Array.from({ length: 20 }, (_, i) => {
                  const h = 10 + Math.random() * 40;
                  return <div key={i} className="flex-1 bg-[#0066cc] dark:bg-[#4dabf7] rounded-t-[2px] opacity-70" style={{ height: `${h}px` }} />;
                })}
              </div>
              <p className="text-[11px] text-[#6a6e73] mt-[4px]">Avg: {(Math.random() * 200 + 50).toFixed(0)}m cores</p>
            </div>
            <div>
              <p className="text-[11px] text-[#6a6e73] dark:text-[#a0a0a0] uppercase tracking-wider mb-[8px]">Memory Usage</p>
              <div className="h-[60px] bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.03)] rounded-[8px] flex items-end px-[8px] pb-[4px] gap-[2px]">
                {Array.from({ length: 20 }, (_, i) => {
                  const h = 15 + Math.random() * 35;
                  return <div key={i} className="flex-1 bg-[#009596] dark:bg-[#73c5c5] rounded-t-[2px] opacity-70" style={{ height: `${h}px` }} />;
                })}
              </div>
              <p className="text-[11px] text-[#6a6e73] mt-[4px]">Avg: {(Math.random() * 256 + 64).toFixed(0)}Mi</p>
            </div>
            <div>
              <p className="text-[11px] text-[#6a6e73] dark:text-[#a0a0a0] uppercase tracking-wider mb-[8px]">Events</p>
              <div className="flex flex-col gap-[4px]">
                <div className="flex items-start gap-[8px] text-[11px]">
                  <CheckCircle2 className="size-[14px] text-[#3e8635] mt-[1px] shrink-0" />
                  <div>
                    <span className="text-[#151515] dark:text-white">Successfully pulled image</span>
                    <span className="text-[#6a6e73] block">2m ago</span>
                  </div>
                </div>
                <div className="flex items-start gap-[8px] text-[11px]">
                  <CheckCircle2 className="size-[14px] text-[#3e8635] mt-[1px] shrink-0" />
                  <div>
                    <span className="text-[#151515] dark:text-white">Started container</span>
                    <span className="text-[#6a6e73] block">2m ago</span>
                  </div>
                </div>
                <div className="flex items-start gap-[8px] text-[11px]">
                  <AlertTriangle className="size-[14px] text-[#f0ab00] mt-[1px] shrink-0" />
                  <div>
                    <span className="text-[#151515] dark:text-white">Readiness probe warning</span>
                    <span className="text-[#6a6e73] block">15m ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div className="px-[16px] py-[12px] border-t border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] flex gap-[8px]">
        <button className="flex-1 flex items-center justify-center gap-[6px] px-[12px] py-[8px] bg-[#0066cc] hover:bg-[#004080] dark:bg-[#4dabf7] dark:hover:bg-[#339af0] text-white rounded-[999px] text-[12px] font-semibold transition-colors">
          <Edit className="size-[12px]" /> Edit {node.kind}
        </button>
        <button className="p-[8px] border border-[rgba(0,0,0,0.15)] dark:border-[rgba(255,255,255,0.15)] rounded-[999px] hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] transition-colors" title="Open Terminal">
          <Terminal className="size-[14px] text-[#151515] dark:text-white" />
        </button>
        <button className="p-[8px] border border-[rgba(0,0,0,0.15)] dark:border-[rgba(255,255,255,0.15)] rounded-[999px] hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] transition-colors" title="Delete">
          <Trash2 className="size-[14px] text-[#c9190b]" />
        </button>
      </div>
    </div>
  );
}

// ── Context Menu ──
function ContextMenu({ x, y, node, onClose, onViewPods }: { x: number; y: number; node: TopoNode; onClose: () => void; onViewPods: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [onClose]);

  const items = [
    { label: "Edit " + node.kind, icon: <Edit className="size-[14px]" /> },
    { label: "View Pods", icon: <Box className="size-[14px]" />, action: onViewPods },
    { label: "View Logs", icon: <Terminal className="size-[14px]" /> },
    { label: "Scale", icon: <Layers className="size-[14px]" /> },
    { label: "Delete " + node.kind, icon: <Trash2 className="size-[14px] text-[#c9190b]" />, danger: true },
  ];

  return (
    <div ref={menuRef} className="fixed z-50 bg-white dark:bg-[#252525] rounded-[8px] shadow-xl border border-[rgba(0,0,0,0.15)] dark:border-[rgba(255,255,255,0.15)] py-[4px] min-w-[180px]"
      style={{ left: x, top: y }} onClick={(e) => e.stopPropagation()}>
      <div className="px-[12px] py-[6px] border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)]">
        <p className="text-[12px] font-semibold text-[#151515] dark:text-white truncate">{node.name}</p>
        <p className="text-[11px] text-[#6a6e73]">{node.kind}</p>
      </div>
      {items.map((item, i) => (
        <button key={i} onClick={() => { item.action?.(); onClose(); }}
          className={`w-full flex items-center gap-[8px] px-[12px] py-[8px] text-[13px] hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] transition-colors ${item.danger ? "text-[#c9190b]" : "text-[#151515] dark:text-white"}`}>
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ── List View Row ──
function ListViewRow({ node, onSelect }: { node: TopoNode; onSelect: () => void }) {
  const borderColor = kindColors[node.kind];
  const allRunning = node.podStatuses.every(s => s.phase === "Running" || s.phase === "Succeeded");
  const hasFailed = node.podStatuses.some(s => s.phase === "Failed");

  return (
    <Tr onClick={onSelect} style={{ cursor: "pointer" }}>
      <Td dataLabel="Name">
        <div className="flex items-center gap-[10px]">
          <div className="size-[28px] rounded-[999px] flex items-center justify-center" style={{ backgroundColor: `${borderColor}18`, color: borderColor }}>
            <KindIcon kind={node.kind} size={14} />
          </div>
          <div>
            <Content component="small">{node.name}</Content>
            <Content component="small" className="text-[#6a6e73]">{node.kind}</Content>
          </div>
        </div>
      </Td>
      <Td dataLabel="Application">
        <Content component="small">{node.app}</Content>
      </Td>
      <Td dataLabel="Status">
        <div className="flex items-center gap-[6px]">
          {hasFailed ? <XCircle className="size-[14px] text-[#c9190b]" /> : allRunning ? <CheckCircle2 className="size-[14px] text-[#3e8635]" /> : <AlertTriangle className="size-[14px] text-[#f0ab00]" />}
          <Content component="small">{node.totalPods}/{node.desiredPods} pods</Content>
        </div>
      </Td>
      <Td dataLabel="Pods">
        <PodDonut statuses={node.podStatuses} total={node.totalPods} size={32} />
      </Td>
      <Td dataLabel="Route">
        {node.routeURL ? (
          <Button
            variant="link"
            isInline
            icon={<ExternalLink className="size-[12px]" />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            Route
          </Button>
        ) : (
          <Content component="small">—</Content>
        )}
      </Td>
      <Td dataLabel="Actions" isActionCell hasAction>
        <Button
          variant="plain"
          aria-label={`Actions for ${node.name}`}
          icon={<MoreVertical className="size-[14px] text-[#6a6e73]" />}
          onClick={(e) => e.stopPropagation()}
        />
      </Td>
    </Tr>
  );
}

// ═══════════════════════════════════════
// ── Main Component ──
// ═══════════════════════════════════════
export default function TopologyPage() {
  const navigate = useNavigate();
  const [selectedNamespace, setSelectedNamespace] = useState("production");
  const [viewMode, setViewMode] = useState<"graph" | "list">("graph");
  const [selectedNode, setSelectedNode] = useState<TopoNode | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: TopoNode } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKind, setFilterKind] = useState<string>("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  const { nodes: rawNodes, groups } = useMemo(() => createMockData(selectedNamespace), [selectedNamespace]);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  // Reset positions when namespace changes
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    rawNodes.forEach((n) => { positions[n.id] = { x: n.x, y: n.y }; });
    setNodePositions(positions);
    setSelectedNode(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [selectedNamespace]);

  const nodes = useMemo(() => rawNodes.map((n) => ({
    ...n,
    x: nodePositions[n.id]?.x ?? n.x,
    y: nodePositions[n.id]?.y ?? n.y,
  })), [rawNodes, nodePositions]);

  const connections = useMemo(() => getConnections(nodes), [nodes]);

  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchesSearch = !searchTerm || n.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesKind = filterKind === "all" || n.kind === filterKind;
      return matchesSearch && matchesKind;
    });
  }, [nodes, searchTerm, filterKind]);

  type TopologyListFilters = { name: string };
  type TopologySortColumn = "name" | "app" | "status";

  const { clearAllFilters: clearListFilters } = useDataViewFilters<TopologyListFilters>({
    filters: { name: searchTerm },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<TopologySortColumn>("name");

  const sortedListNodes = useMemo(() => {
    return [...filteredNodes].sort((a, b) => {
      switch (sortColumn) {
        case "name":
          return compareStrings(a.name, b.name, sortDirection);
        case "app":
          return compareStrings(a.app, b.app, sortDirection);
        case "status":
          return compareStrings(`${a.totalPods}/${a.desiredPods}`, `${b.totalPods}/${b.desiredPods}`, sortDirection);
        default:
          return 0;
      }
    });
  }, [filteredNodes, sortColumn, sortDirection]);

  const { page, setPage, perPage, setPerPage, paginated: paginatedListNodes, itemCount: listItemCount } = useListPagination(
    sortedListNodes,
    [searchTerm, filterKind, sortColumn, sortDirection],
    20
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterKind, perPage, sortColumn, sortDirection, setPage]);

  const listColSpan = 6;

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

  // Drag handling
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const pos = nodePositions[nodeId];
    if (!pos) return;
    setDragging(nodeId);
    setDragOffset({ x: e.clientX / zoom - pos.x, y: e.clientY / zoom - pos.y });
  }, [nodePositions, zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      setNodePositions((prev) => ({
        ...prev,
        [dragging]: {
          x: e.clientX / zoom - dragOffset.x,
          y: e.clientY / zoom - dragOffset.y,
        },
      }));
    } else if (isPanning) {
      setPan((prev) => ({
        x: prev.x + e.clientX - panStart.x,
        y: prev.y + e.clientY - panStart.y,
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [dragging, dragOffset, zoom, isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setIsPanning(false);
  }, []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && e.target === canvasRef.current?.querySelector(".canvas-bg")) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setSelectedNode(null);
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, node: TopoNode) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  }, []);

  const handleFitToScreen = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Group bounding boxes
  const groupBounds = useMemo(() => {
    return groups.map((g) => {
      const gNodes = nodes.filter((n) => g.nodeIds.includes(n.id));
      if (gNodes.length === 0) return null;
      const pad = 60;
      const minX = Math.min(...gNodes.map((n) => n.x)) - pad;
      const minY = Math.min(...gNodes.map((n) => n.y)) - pad;
      const maxX = Math.max(...gNodes.map((n) => n.x)) + pad + 100;
      const maxY = Math.max(...gNodes.map((n) => n.y)) + pad + 80;
      return { ...g, x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }).filter(Boolean) as (AppGroup & { x: number; y: number; w: number; h: number })[];
  }, [groups, nodes]);

  const kindOptions: WorkloadKind[] = ["Deployment", "DeploymentConfig", "StatefulSet", "DaemonSet", "Job", "CronJob"];

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="ocs-app-page-outer ocs-app-page-outer--pb-0">
        <Breadcrumbs
          items={[
            { label: "Home", path: "/" },
            { label: "Workloads", path: "/workloads" },
            { label: "Topology", path: "/workloads/topology" },
          ]}
        >
        <div className="flex items-center justify-between mb-[16px]">
          <div>
            <h1 className="font-['Red_Hat_Display_VF:Medium',sans-serif] font-medium leading-[36.4px] text-[#151515] dark:text-white text-[28px]">
              Topology
            </h1>
          </div>
          <FavoriteButton name="Topology" path="/workloads/topology" />
        </div>
        </Breadcrumbs>
      </div>

      {/* Toolbar */}
      <div className="px-[24px] mb-[8px]">
        <div className="bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] rounded-[10px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] px-[12px] py-[8px] flex items-center gap-[8px]">
          {/* Namespace selector */}
          <select value={selectedNamespace} onChange={(e) => setSelectedNamespace(e.target.value)}
            className="px-[12px] py-[7px] bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.15)] dark:border-[rgba(255,255,255,0.15)] rounded-[999px] text-[13px] text-[#151515] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066cc] dark:focus:ring-[#4dabf7] cursor-pointer">
            {NAMESPACES.map((ns) => <option key={ns} value={ns}>{ns}</option>)}
          </select>

          <div className="w-px h-[24px] bg-[rgba(0,0,0,0.1)] dark:bg-[rgba(255,255,255,0.1)]" />

          {/* View toggle */}
          <div className="flex bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.05)] rounded-[999px] p-[2px]">
            <button onClick={() => setViewMode("graph")}
              className={`p-[6px] rounded-[4px] transition-colors ${viewMode === "graph" ? "bg-white dark:bg-[#2a2a2a] shadow-sm" : ""}`}
              title="Graph View">
              <LayoutGrid className="size-[16px] text-[#151515] dark:text-white" />
            </button>
            <button onClick={() => setViewMode("list")}
              className={`p-[6px] rounded-[4px] transition-colors ${viewMode === "list" ? "bg-white dark:bg-[#2a2a2a] shadow-sm" : ""}`}
              title="List View">
              <List className="size-[16px] text-[#151515] dark:text-white" />
            </button>
          </div>

          <div className="w-px h-[24px] bg-[rgba(0,0,0,0.1)] dark:bg-[rgba(255,255,255,0.1)]" />

          {/* Search */}
          <div className="relative flex-1 max-w-[240px]">
            <Search className="absolute left-[8px] top-1/2 -translate-y-1/2 size-[14px] text-[#6a6e73]" />
            <input type="text" placeholder="Find by name..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-[28px] pr-[8px] py-[7px] bg-white dark:bg-[#1a1a1a] border border-[rgba(0,0,0,0.15)] dark:border-[rgba(255,255,255,0.15)] rounded-[999px] text-[13px] text-[#151515] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066cc]" />
          </div>

          {/* Filter */}
          <div className="relative">
            <button onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex items-center gap-[4px] px-[10px] py-[7px] border rounded-[999px] text-[13px] transition-colors ${filterKind !== "all"
                ? "bg-[#e7f1fa] dark:bg-[rgba(79,171,247,0.15)] border-[#0066cc] dark:border-[#4dabf7] text-[#0066cc] dark:text-[#4dabf7]"
                : "bg-white dark:bg-[#1a1a1a] border-[rgba(0,0,0,0.15)] dark:border-[rgba(255,255,255,0.15)] text-[#151515] dark:text-white"
                }`}>
              <Filter className="size-[14px]" />
              {filterKind === "all" ? "Filter" : filterKind}
              {showFilterDropdown ? <ChevronUp className="size-[12px]" /> : <ChevronDown className="size-[12px]" />}
            </button>
            {showFilterDropdown && (
              <div className="absolute top-full mt-[4px] right-0 bg-white dark:bg-[#252525] rounded-[8px] shadow-xl border border-[rgba(0,0,0,0.15)] dark:border-[rgba(255,255,255,0.15)] py-[4px] min-w-[160px] z-20">
                <button onClick={() => { setFilterKind("all"); setShowFilterDropdown(false); }}
                  className={`w-full text-left px-[12px] py-[6px] text-[13px] hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] ${filterKind === "all" ? "text-[#0066cc] dark:text-[#4dabf7]" : "text-[#151515] dark:text-white"}`}>
                  All Types
                </button>
                {kindOptions.map((k) => (
                  <button key={k} onClick={() => { setFilterKind(k); setShowFilterDropdown(false); }}
                    className={`w-full text-left px-[12px] py-[6px] text-[13px] hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] ${filterKind === k ? "text-[#0066cc] dark:text-[#4dabf7]" : "text-[#151515] dark:text-white"}`}>
                    {k}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Zoom controls (graph only) */}
          {viewMode === "graph" && (
            <div className="flex items-center gap-[2px]">
              <button onClick={() => setZoom((z) => Math.min(z + 0.15, 2))} className="p-[6px] hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] rounded-[4px]" title="Zoom In">
                <ZoomIn className="size-[16px] text-[#151515] dark:text-white" />
              </button>
              <button onClick={() => setZoom((z) => Math.max(z - 0.15, 0.3))} className="p-[6px] hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] rounded-[4px]" title="Zoom Out">
                <ZoomOut className="size-[16px] text-[#151515] dark:text-white" />
              </button>
              <span className="text-[11px] text-[#6a6e73] min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={handleFitToScreen} className="p-[6px] hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)] rounded-[4px]" title="Fit to Screen">
                <Maximize2 className="size-[16px] text-[#151515] dark:text-white" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden mx-[24px] mb-[24px]">
        {/* Canvas / List */}
        <div className="flex-1 overflow-hidden rounded-[12px] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-[#f8f8f8] dark:bg-[#111]">
          {viewMode === "graph" ? (
            <div ref={canvasRef} className="w-full h-full relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleCanvasMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={() => { if (!dragging) setContextMenu(null); }}>

              {/* Grid bg */}
              <div className="canvas-bg absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)`,
                  backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                  backgroundPosition: `${pan.x}px ${pan.y}px`,
                }} />

              {/* Transform container */}
              <div className="absolute inset-0" style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "0 0",
              }}>
                {/* App group backgrounds */}
                {groupBounds.map((g) => (
                  <div key={g.name} className="absolute rounded-[16px] border-2 border-dashed border-[rgba(0,102,204,0.2)] dark:border-[rgba(79,171,247,0.2)] bg-[rgba(0,102,204,0.03)] dark:bg-[rgba(79,171,247,0.03)]"
                    style={{ left: g.x, top: g.y, width: g.w, height: g.h }}>
                    <span className="absolute top-[-12px] left-[16px] px-[8px] bg-[#f8f8f8] dark:bg-[#111] text-[11px] text-[#0066cc] dark:text-[#4dabf7] font-semibold uppercase tracking-wider">
                      {g.name}
                    </span>
                  </div>
                ))}

                {/* Connection arrows */}
                <svg className="absolute top-0 left-0 pointer-events-none" width="2000" height="2000" style={{ overflow: "visible" }}>
                  <defs>
                    <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                      <polygon points="0 0, 8 3, 0 6" fill="#6a6e73" fillOpacity="0.5" />
                    </marker>
                  </defs>
                  {connections.map((c, i) => {
                    const from = nodes.find((n) => n.id === c.from);
                    const to = nodes.find((n) => n.id === c.to);
                    if (!from || !to) return null;
                    if (!filteredNodeIds.has(from.id) || !filteredNodeIds.has(to.id)) return null;
                    const x1 = from.x + 50;
                    const y1 = from.y + 35;
                    const x2 = to.x + 50;
                    const y2 = to.y + 35;
                    const midX = (x1 + x2) / 2;
                    return (
                      <path key={i} d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                        fill="none" stroke="#6a6e73" strokeWidth="1.5" strokeOpacity="0.4" markerEnd="url(#arrow)" />
                    );
                  })}
                </svg>

                {/* Nodes */}
                {filteredNodes.map((node) => {
                  const borderColor = kindColors[node.kind];
                  const isSelected = selectedNode?.id === node.id;
                  const allRunning = node.podStatuses.every((s) => s.phase === "Running" || s.phase === "Succeeded");
                  const hasFailed = node.podStatuses.some((s) => s.phase === "Failed");

                  return (
                    <div key={node.id} className="absolute group"
                      style={{ left: node.x, top: node.y, zIndex: dragging === node.id ? 100 : isSelected ? 50 : 1 }}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      onClick={(e) => { e.stopPropagation(); setSelectedNode(node); }}
                      onContextMenu={(e) => handleContextMenu(e, node)}>
                      <div className={`relative bg-white dark:bg-[#1e1e1e] rounded-[12px] shadow-md hover:shadow-lg transition-all cursor-pointer border-2 ${isSelected ? "ring-2 ring-[#0066cc] dark:ring-[#4dabf7] ring-offset-2 ring-offset-[#f8f8f8] dark:ring-offset-[#111]" : ""}`}
                        style={{ borderColor, minWidth: 100 }}>
                        {/* Decorators */}
                        <div className="absolute -top-[10px] -right-[10px] flex gap-[4px]">
                          {node.routeURL && (
                            <div className="size-[20px] rounded-full bg-[#3e8635] flex items-center justify-center shadow-sm" title="Has Route">
                              <ArrowUpRight className="size-[11px] text-white" />
                            </div>
                          )}
                          {node.buildStatus === "Running" && (
                            <div className="size-[20px] rounded-full bg-[#0066cc] flex items-center justify-center shadow-sm animate-pulse" title="Build Running">
                              <RefreshCw className="size-[11px] text-white" />
                            </div>
                          )}
                          {node.buildStatus === "Failed" && (
                            <div className="size-[20px] rounded-full bg-[#c9190b] flex items-center justify-center shadow-sm" title="Build Failed">
                              <XCircle className="size-[11px] text-white" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex items-center gap-[10px] px-[12px] py-[10px]">
                          <PodDonut statuses={node.podStatuses} total={node.totalPods} size={42} />
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-[#151515] dark:text-white truncate max-w-[100px]">{node.name}</p>
                            <p className="text-[10px] text-[#6a6e73] flex items-center gap-[3px]">
                              <KindIcon kind={node.kind} size={10} /> {node.kind}
                            </p>
                          </div>
                        </div>

                        {/* Bottom status bar */}
                        <div className={`px-[12px] py-[4px] rounded-b-[10px] text-[10px] flex items-center gap-[4px] ${hasFailed ? "bg-[#fce8e8] dark:bg-[rgba(201,25,11,0.1)] text-[#c9190b]" : allRunning ? "bg-[#e8f5e9] dark:bg-[rgba(62,134,53,0.1)] text-[#3e8635]" : "bg-[#fff4e5] dark:bg-[rgba(240,171,0,0.1)] text-[#f0ab00]"}`}>
                          {hasFailed ? <XCircle className="size-[10px]" /> : allRunning ? <CheckCircle2 className="size-[10px]" /> : <AlertTriangle className="size-[10px]" />}
                          {node.totalPods}/{node.desiredPods} pods
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend overlay */}
              <div className="absolute bottom-[12px] left-[12px] app-glass-panel p-[10px] text-[10px]">
                <p className="font-semibold text-[#151515] dark:text-white mb-[6px]">Resource Types</p>
                <div className="grid grid-cols-2 gap-x-[12px] gap-y-[3px]">
                  {Object.entries(kindColors).map(([kind, color]) => (
                    <div key={kind} className="flex items-center gap-[5px]">
                      <div className="size-[8px] rounded-[2px]" style={{ backgroundColor: color }} />
                      <span className="text-[#6a6e73] dark:text-[#a0a0a0]">{kind}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-[6px] pt-[6px] border-t border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] flex flex-col gap-[3px]">
                  <div className="flex items-center gap-[5px]">
                    <div className="size-[8px] rounded-full bg-[#3e8635]" />
                    <span className="text-[#6a6e73]">Running</span>
                  </div>
                  <div className="flex items-center gap-[5px]">
                    <div className="size-[8px] rounded-full bg-[#f0ab00]" />
                    <span className="text-[#6a6e73]">Pending</span>
                  </div>
                  <div className="flex items-center gap-[5px]">
                    <div className="size-[8px] rounded-full bg-[#c9190b]" />
                    <span className="text-[#6a6e73]">Failed</span>
                  </div>
                </div>
              </div>

              {/* Namespace info */}
              <div className="absolute top-[12px] left-[12px] app-glass-panel px-[12px] py-[6px]">
                <span className="text-[11px] text-[#6a6e73]">Namespace: </span>
                <span className="text-[12px] font-semibold text-[#151515] dark:text-white">{selectedNamespace}</span>
                <span className="text-[11px] text-[#6a6e73] ml-[8px]">{filteredNodes.length} workloads</span>
              </div>
            </div>
          ) : (
            /* List View */
            <div className="w-full h-full overflow-auto">
              <DataView ouiaId="topology-list-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
                <DataViewToolbar
                  ouiaId="topology-list-dv-toolbar"
                  id="topology-list-dv-toolbar"
                  className={OCS_PROTOTYPE_TOOLBAR_CLASS}
                  clearAllFilters={() => {
                    setSearchTerm("");
                    clearListFilters();
                  }}
                  collapseListedFiltersBreakpoint="xl"
                  filters={
                    <IoDataViewFiltersWithMidActions<TopologyListFilters>
                      values={{ name: searchTerm }}
                      onChange={(_filterId, partial) => setSearchTerm(partial.name ?? "")}
                      breakpoint="xl"
                    >
                      <DataViewTextFilter
                        title="Name"
                        filterId="name"
                        placeholder="Filter by name..."
                        style={{ minWidth: "16rem", maxWidth: "100%" }}
                      />
                    </IoDataViewFiltersWithMidActions>
                  }
                  pagination={
                    <Pagination
                      perPageOptions={[
                        { title: "10", value: 10 },
                        { title: "20", value: 20 },
                        { title: "50", value: 50 },
                      ]}
                      itemCount={listItemCount}
                      page={page}
                      perPage={perPage}
                      onSetPage={(_e, p) => setPage(p)}
                      onPerPageSelect={(_e, pp) => {
                        setPerPage(pp);
                        setPage(1);
                      }}
                      variant={PaginationVariant.top}
                      isCompact
                      ouiaId="topology-list-pagination"
                      widgetId="topology-list-pagination"
                      titles={{ items: "workloads" }}
                      paginationAriaLabel="Topology list pagination"
                    />
                  }
                />

                <OcsPrototypeListTable ariaLabel="Topology workloads">
                  <Thead>
                    <Tr>
                      <Th dataLabel="Name">
                        <SortableTableHeader label="Name" column="name" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                      </Th>
                      <Th dataLabel="Application">
                        <SortableTableHeader label="Application" column="app" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                      </Th>
                      <Th dataLabel="Status">
                        <SortableTableHeader label="Status" column="status" sortColumn={sortColumn} sortDirection={sortDirection} onSort={toggleSort} />
                      </Th>
                      <Th dataLabel="Pods">
                        <PlainTableHeader label="Pods" />
                      </Th>
                      <Th dataLabel="Route">
                        <PlainTableHeader label="Route" />
                      </Th>
                      <Th modifier="fitContent" dataLabel="Actions">
                        <PlainTableHeader label="Actions" />
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {paginatedListNodes.length === 0 ? (
                      <Tr>
                        <Td colSpan={listColSpan} dataLabel="Empty state">
                          <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-lg">
                            <Box className="size-[40px] mb-[12px] inline-block" />
                            <br />
                            No workloads found
                          </Content>
                        </Td>
                      </Tr>
                    ) : (
                      paginatedListNodes.map((node) => (
                        <ListViewRow key={node.id} node={node} onSelect={() => setSelectedNode(node)} />
                      ))
                    )}
                  </Tbody>
                </OcsPrototypeListTable>
              </DataView>
            </div>
          )}
        </div>

        {/* Side Panel */}
        {selectedNode && <SidePanel node={selectedNode} onClose={() => setSelectedNode(null)} />}

        {/* Context Menu */}
        {contextMenu && (
          <ContextMenu x={contextMenu.x} y={contextMenu.y} node={contextMenu.node}
            onClose={() => setContextMenu(null)}
            onViewPods={() => { setSelectedNode(contextMenu.node); setContextMenu(null); }} />
        )}
      </div>
    </div>
  );
}
