import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Button,
  Content,
  Flex,
  Label,
  MenuToggle,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import CopyIcon from "@patternfly/react-icons/dist/esm/icons/copy-icon";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import ExpandIcon from "@patternfly/react-icons/dist/esm/icons/expand-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import EyeIcon from "@patternfly/react-icons/dist/esm/icons/eye-icon";
import InProgressIcon from "@patternfly/react-icons/dist/esm/icons/in-progress-icon";
import NetworkWiredIcon from "@patternfly/react-icons/dist/esm/icons/network-wired-icon";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import ServerIcon from "@patternfly/react-icons/dist/esm/icons/server-icon";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import TrashIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import UndoIcon from "@patternfly/react-icons/dist/esm/icons/undo-icon";
import ZoomInIcon from "@patternfly/react-icons/dist/esm/icons/search-plus-icon";
import ZoomOutIcon from "@patternfly/react-icons/dist/esm/icons/search-minus-icon";
import { Filter } from "@/lib/pfIcons";
import {
  BASE_X,
  BASE_Y,
  GROUP_GAP,
  GROUP_H,
  GROUP_W,
  RESOURCE_COL_GAP,
  RESOURCE_GRID_ORIGIN_X,
  RESOURCE_GRID_ORIGIN_Y,
  RESOURCE_CELL_H,
  RESOURCE_CELL_W,
  RESOURCE_H,
  RESOURCE_INSTALL_STATUS_COLORS,
  RESOURCE_INSTALL_STATUS_LABELS,
  RESOURCE_KIND_COLORS,
  RESOURCE_KIND_LABELS,
  RESOURCE_ROW_GAP,
  RESOURCE_W,
  WORKER_NODE_GROUPS,
  computeCanvasWidth,
  type NetResource,
  type NetResourceKind,
  type ResourceInstallStatus,
  type StandaloneTopologyResource,
  type TopologyEdge,
  type WorkerNodeGroup,
} from "./networkTopologyData";
import type { TopologyStep } from "./networkTopologyTypes";

export type { TopologyStep };

type SelectedResource =
  | (NetResource & { group: WorkerNodeGroup; placement: "group" })
  | (StandaloneTopologyResource & { placement: "standalone" });

type TopologyHit =
  | { kind: "group"; group: WorkerNodeGroup; resource: NetResource; groupPos: { x: number; y: number } }
  | { kind: "standalone"; standalone: StandaloneTopologyResource };

type LinkDragState = {
  scope: "group" | "standalone";
  groupId?: string;
  resourceId: string;
  start: { x: number; y: number };
  current: { x: number; y: number };
};
type PositionMap = Record<string, { x: number; y: number }>;
type EdgeMap = Record<string, TopologyEdge[]>;

function posKey(groupId: string, resourceId: string) {
  return `${groupId}::${resourceId}`;
}

const GROUP_PAD = 16;
const GROUP_FOOTER_H = 40;
const GROUP_FOOTER_GAP = 14;
const BOTTOM_CANVAS_PAD = 56;
/** Max grid rows used in RESOURCE_SLOT_LAYOUT (includes br-localnet row). */
const RESOURCE_GRID_ROWS = 3;
/** Minimum gap between resource bounding boxes (must match visual spacing). */
const RESOURCE_GAP = 14;

type GroupLayout = {
  minX: number;
  minY: number;
  width: number;
  surfaceHeight: number;
  totalHeight: number;
};

function rectsOverlap(
  a: { x: number; y: number },
  b: { x: number; y: number },
  w: number,
  h: number,
  gap = RESOURCE_GAP
) {
  return a.x < b.x + w + gap && a.x + w + gap > b.x && a.y < b.y + h + gap && a.y + h + gap > b.y;
}

function getPos(positions: PositionMap, groupId: string, resource: NetResource) {
  return positions[posKey(groupId, resource.id)] ?? { x: resource.x, y: resource.y };
}

function groupHasOverlaps(group: WorkerNodeGroup, positions: PositionMap) {
  for (let i = 0; i < group.resources.length; i += 1) {
    for (let j = i + 1; j < group.resources.length; j += 1) {
      const a = group.resources[i];
      const b = group.resources[j];
      const pa = getPos(positions, group.id, a);
      const pb = getPos(positions, group.id, b);
      if (rectsOverlap(pa, pb, RESOURCE_W, RESOURCE_H, 0)) return true;
    }
  }
  return false;
}

/** Iteratively separate every overlapping pair; pinned node stays put when possible. */
function resolveGroupOverlaps(
  group: WorkerNodeGroup,
  positions: PositionMap,
  pinnedId?: string
): PositionMap {
  let next: PositionMap = { ...positions };
  const sepX = RESOURCE_W + RESOURCE_GAP;
  const sepY = RESOURCE_H + RESOURCE_GAP;

  for (let pass = 0; pass < 64; pass += 1) {
    let changed = false;

    for (let i = 0; i < group.resources.length; i += 1) {
      for (let j = i + 1; j < group.resources.length; j += 1) {
        const a = group.resources[i];
        const b = group.resources[j];
        const keyA = posKey(group.id, a.id);
        const keyB = posKey(group.id, b.id);
        let pa = next[keyA] ?? { x: a.x, y: a.y };
        let pb = next[keyB] ?? { x: b.x, y: b.y };

        if (!rectsOverlap(pa, pb, RESOURCE_W, RESOURCE_H, 0)) continue;

        changed = true;
        const dx = pb.x + RESOURCE_W / 2 - (pa.x + RESOURCE_W / 2);
        const dy = pb.y + RESOURCE_H / 2 - (pa.y + RESOURCE_H / 2);
        const overlapX = sepX - Math.abs(dx);
        const overlapY = sepY - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          if (overlapX <= overlapY) {
            if (a.id === pinnedId) {
              pb = { ...pb, x: dx >= 0 ? pa.x + sepX : pa.x - sepX };
            } else if (b.id === pinnedId) {
              pa = { ...pa, x: dx >= 0 ? pb.x - sepX : pb.x + sepX };
            } else {
              const push = overlapX / 2 + 1;
              pa = { ...pa, x: dx >= 0 ? pa.x - push : pa.x + push };
              pb = { ...pb, x: dx >= 0 ? pb.x + push : pb.x - push };
            }
          } else if (a.id === pinnedId) {
            pb = { ...pb, y: dy >= 0 ? pa.y + sepY : pa.y - sepY };
          } else if (b.id === pinnedId) {
            pa = { ...pa, y: dy >= 0 ? pb.y - sepY : pb.y + sepY };
          } else {
            const push = overlapY / 2 + 1;
            pa = { ...pa, y: dy >= 0 ? pa.y - push : pa.y + push };
            pb = { ...pb, y: dy >= 0 ? pb.y + push : pb.y - push };
          }
        }

        pa = { x: Math.max(8, pa.x), y: Math.max(8, pa.y) };
        pb = { x: Math.max(8, pb.x), y: Math.max(8, pb.y) };
        next[keyA] = pa;
        next[keyB] = pb;
      }
    }

    if (!changed) break;
  }

  return next;
}

function dragWithPush(
  group: WorkerNodeGroup,
  movedId: string,
  desired: { x: number; y: number },
  positions: PositionMap
): PositionMap {
  const key = posKey(group.id, movedId);
  const movedPos = { x: Math.max(8, desired.x), y: Math.max(8, desired.y) };
  const sepX = RESOURCE_W + RESOURCE_GAP;
  const sepY = RESOURCE_H + RESOURCE_GAP;

  let next = resolveGroupOverlaps(group, { ...positions, [key]: movedPos }, movedId);

  if (groupHasOverlaps(group, next)) {
    next = { ...positions, [key]: movedPos };
    const mp = next[key];
    for (const other of group.resources) {
      if (other.id === movedId) continue;
      const otherKey = posKey(group.id, other.id);
      let op = next[otherKey] ?? { x: other.x, y: other.y };
      if (!rectsOverlap(mp, op, RESOURCE_W, RESOURCE_H, 0)) continue;

      const dx = op.x + RESOURCE_W / 2 - (mp.x + RESOURCE_W / 2);
      const dy = op.y + RESOURCE_H / 2 - (mp.y + RESOURCE_H / 2);
      if (Math.abs(dx) >= Math.abs(dy)) {
        op = { ...op, x: dx >= 0 ? mp.x + sepX : mp.x - sepX };
      } else {
        op = { ...op, y: dy >= 0 ? mp.y + sepY : mp.y - sepY };
      }
      next[otherKey] = { x: Math.max(8, op.x), y: Math.max(8, op.y) };
    }
    next = resolveGroupOverlaps(group, next, movedId);
  }

  return next;
}

function initializePositions(): PositionMap {
  let init: PositionMap = {};
  WORKER_NODE_GROUPS.forEach((group) => {
    group.resources.forEach((resource) => {
      init[posKey(group.id, resource.id)] = { x: resource.x, y: resource.y };
    });
    init = resolveGroupOverlaps(group, init);
  });
  return init;
}

function computeGroupLayout(
  group: WorkerNodeGroup,
  positions: PositionMap,
  visibleResources: NetResource[]
): GroupLayout {
  const minSurfaceHeight =
    RESOURCE_GRID_ORIGIN_Y +
    RESOURCE_GRID_ROWS * RESOURCE_CELL_H +
    (RESOURCE_GRID_ROWS - 1) * RESOURCE_ROW_GAP +
    GROUP_PAD;
  const minWidth =
    RESOURCE_GRID_ORIGIN_X +
    3 * RESOURCE_CELL_W +
    2 * RESOURCE_COL_GAP +
    RESOURCE_GRID_ORIGIN_X;

  if (visibleResources.length === 0) {
    const surfaceHeight = Math.max(GROUP_H - GROUP_FOOTER_GAP - GROUP_FOOTER_H, minSurfaceHeight);
    return {
      minX: 0,
      minY: 0,
      width: Math.max(GROUP_W, minWidth),
      surfaceHeight,
      totalHeight: surfaceHeight + GROUP_FOOTER_GAP + GROUP_FOOTER_H,
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;

  visibleResources.forEach((resource) => {
    const p = getPos(positions, group.id, resource);
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x + RESOURCE_W);
    maxY = Math.max(maxY, p.y + RESOURCE_H);
  });

  const width = Math.max(GROUP_W, minWidth, maxX - minX + GROUP_PAD * 2);
  const surfaceHeight = Math.max(minSurfaceHeight, maxY - minY + GROUP_PAD * 2);

  return {
    minX,
    minY,
    width,
    surfaceHeight,
    totalHeight: surfaceHeight + GROUP_FOOTER_GAP + GROUP_FOOTER_H,
  };
}

function displayPos(pos: { x: number; y: number }, layout: GroupLayout) {
  return {
    x: pos.x - layout.minX + GROUP_PAD,
    y: pos.y - layout.minY + GROUP_PAD,
  };
}

function canvasResourceRect(
  groupPos: { x: number; y: number },
  layout: GroupLayout,
  pos: { x: number; y: number }
) {
  const d = displayPos(pos, layout);
  return {
    x: groupPos.x + d.x,
    y: groupPos.y + d.y,
    w: RESOURCE_W,
    h: RESOURCE_H,
  };
}

function pointInGroupSurface(
  canvasX: number,
  canvasY: number,
  groupPos: { x: number; y: number },
  layout: GroupLayout
) {
  return (
    canvasX >= groupPos.x &&
    canvasX <= groupPos.x + layout.width &&
    canvasY >= groupPos.y &&
    canvasY <= groupPos.y + layout.surfaceHeight
  );
}

function findResourceAtCanvasPoint(
  groups: WorkerNodeGroup[],
  groupPositions: Record<string, { x: number; y: number }>,
  groupLayouts: Record<string, GroupLayout>,
  positions: PositionMap,
  standalones: StandaloneTopologyResource[],
  canvasX: number,
  canvasY: number,
  exclude?: { scope: "group" | "standalone"; groupId?: string; resourceId: string }
) {
  for (const standalone of standalones) {
    if (exclude?.scope === "standalone" && exclude.resourceId === standalone.id) continue;
    if (
      canvasX >= standalone.canvasX &&
      canvasX <= standalone.canvasX + RESOURCE_W &&
      canvasY >= standalone.canvasY &&
      canvasY <= standalone.canvasY + RESOURCE_H
    ) {
      return { kind: "standalone" as const, standalone };
    }
  }

  for (const group of groups) {
    const groupPos = groupPositions[group.id] ?? { x: group.x, y: group.y };
    const layout = groupLayouts[group.id];
    if (!layout) continue;
    for (const resource of group.resources) {
      if (exclude?.scope === "group" && exclude.groupId === group.id && exclude.resourceId === resource.id) {
        continue;
      }
      const p = getPos(positions, group.id, resource);
      const rect = canvasResourceRect(groupPos, layout, p);
      if (canvasX >= rect.x && canvasX <= rect.x + rect.w && canvasY >= rect.y && canvasY <= rect.y + rect.h) {
        return { kind: "group" as const, group, resource, groupPos };
      }
    }
  }
  return null;
}

function ResourceIcon({ kind }: { kind: NetResourceKind }) {
  return kind === "interface" ? <NetworkWiredIcon aria-hidden /> : <ServerIcon aria-hidden />;
}

function ResourceStatusIcon({ status }: { status: ResourceInstallStatus }) {
  if (status === "configured") {
    return (
      <CheckCircleIcon
        aria-hidden
        className="ocs-net-topo-resource__status-icon ocs-net-topo-resource__status-icon--configured"
      />
    );
  }
  if (status === "failed") {
    return (
      <ExclamationCircleIcon
        aria-hidden
        className="ocs-net-topo-resource__status-icon ocs-net-topo-resource__status-icon--failed"
      />
    );
  }
  if (status === "pending") {
    return <span className="ocs-net-topo-resource__status-icon ocs-net-topo-resource__status-icon--pending" aria-hidden />;
  }
  return (
    <InProgressIcon
      aria-hidden
      className={`ocs-net-topo-resource__status-icon ocs-net-topo-resource__status-icon--${status} ocs-net-topo-spin`}
    />
  );
}

function StatusBadge({ status }: { status: ResourceInstallStatus }) {
  const label = RESOURCE_INSTALL_STATUS_LABELS[status];
  const color = RESOURCE_INSTALL_STATUS_COLORS[status];
  const icon =
    status === "configured" ? (
      <CheckCircleIcon aria-hidden />
    ) : status === "failed" ? (
      <ExclamationCircleIcon aria-hidden />
    ) : status === "pending" ? null : (
      <InProgressIcon aria-hidden className={status === "installing" || status === "creating" ? "ocs-net-topo-spin" : undefined} />
    );

  return (
    <Label color={color} isCompact icon={icon ?? undefined} className={`ocs-net-topo-status ocs-net-topo-status--${status}`}>
      {label}
    </Label>
  );
}

function GroupActionsMenu({
  group,
  isOpen,
  onOpenChange,
  onResetLayout,
  onNotice,
}: {
  group: WorkerNodeGroup;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onResetLayout: () => void;
  onNotice: (notice: { title: string; variant: "success" | "warning" | "info" }) => void;
}) {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      onOpenChange(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onOpenChange]);

  const viewNodeDetails = () => {
    onOpenChange(false);
    navigate(`/compute/nodes/${encodeURIComponent(group.hostname)}`);
  };

  const copyHostname = async () => {
    try {
      await navigator.clipboard.writeText(group.hostname);
      onNotice({
        variant: "success",
        title: `Copied ${group.shortName} hostname to clipboard.`,
      });
    } catch {
      onNotice({
        variant: "warning",
        title: `Could not copy hostname. Copy manually: ${group.hostname}`,
      });
    }
    onOpenChange(false);
  };

  const resetLayout = () => {
    onResetLayout();
    onNotice({
      variant: "info",
      title: `Reset resource layout for ${group.shortName}.`,
    });
    onOpenChange(false);
  };

  const runAction =
    (action: () => void | Promise<void>) => (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.preventDefault();
      void action();
    };

  return (
    <div className="ocs-net-topo-group__actions" ref={menuRef}>
      <MenuToggle
        variant="plain"
        aria-label={`Actions for ${group.shortName}`}
        isExpanded={isOpen}
        onClick={(event) => {
          event.stopPropagation();
          onOpenChange(!isOpen);
        }}
      >
        <EllipsisVIcon aria-hidden />
      </MenuToggle>
      {isOpen ? (
        <div className="ocs-net-topo-group__menu" role="menu" aria-label={`Actions for ${group.shortName}`}>
          <button type="button" role="menuitem" className="ocs-net-topo-group__menu-item" onClick={runAction(viewNodeDetails)}>
            <EyeIcon aria-hidden />
            View node details
          </button>
          <button type="button" role="menuitem" className="ocs-net-topo-group__menu-item" onClick={runAction(copyHostname)}>
            <CopyIcon aria-hidden />
            Copy hostname
          </button>
          <button type="button" role="menuitem" className="ocs-net-topo-group__menu-item" onClick={runAction(resetLayout)}>
            <UndoIcon aria-hidden />
            Reset node layout
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TopologySidePanel({
  resource,
  positions,
  edges,
  standaloneEdges,
  onClose,
  onRemoveEdge,
  onRemoveStandaloneEdge,
}: {
  resource: SelectedResource;
  positions: PositionMap;
  edges: EdgeMap;
  standaloneEdges: TopologyEdge[];
  onClose: () => void;
  onRemoveEdge: (groupId: string, edgeId: string) => void;
  onRemoveStandaloneEdge: (edgeId: string) => void;
}) {
  const [tab, setTab] = useState<string>("details");
  const color = RESOURCE_KIND_COLORS[resource.kind];
  const isStandalone = resource.placement === "standalone";
  const groupEdges = isStandalone ? [] : edges[resource.group.id] ?? [];
  const connected = isStandalone
    ? standaloneEdges.filter((e) => e.from === resource.id || e.to === resource.id)
    : groupEdges.filter((e) => e.from === resource.id || e.to === resource.id);

  const pos = isStandalone
    ? { x: resource.canvasX, y: resource.canvasY }
    : positions[posKey(resource.group.id, resource.id)] ?? { x: resource.x, y: resource.y };

  return (
    <aside className="ocs-net-topo-sidepanel" aria-label={`${resource.label} details`}>
      <div className="ocs-net-topo-sidepanel__head">
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }} flex={{ default: "flex_1" }}>
          <span className="ocs-net-topo-sidepanel__icon" style={{ color, borderColor: color }}>
            <ResourceIcon kind={resource.kind} />
          </span>
          <Flex direction={{ default: "column" }} flex={{ default: "flex_1" }}>
            <Title headingLevel="h3" size="md">
              {resource.label}
            </Title>
            <Content component="small">{RESOURCE_KIND_LABELS[resource.kind]}</Content>
          </Flex>
        </Flex>
        <Button variant="plain" aria-label="Close details" icon={<TimesIcon />} onClick={onClose} />
      </div>

      <Tabs activeKey={tab} onSelect={(_e, key) => setTab(String(key))} aria-label="Resource details">
        <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
        <Tab eventKey="connections" title={<TabTitleText>Connections</TabTitleText>} />
        <Tab eventKey="observe" title={<TabTitleText>Observe</TabTitleText>} />
      </Tabs>

      <div className="ocs-net-topo-sidepanel__body">
        {tab === "details" && (
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            <div>
              <Content component="small" className="ocs-net-topo-sidepanel__label">
                {isStandalone ? "Target node" : "Node"}
              </Content>
              <Content component="p">
                {isStandalone ? (
                  <>
                    {resource.targetNodeLabel} —{" "}
                    <Content component="small" className="ocs-net-topo-sidepanel__hint">
                      Not attached. Drag onto a node group or link to connect.
                    </Content>
                  </>
                ) : (
                  resource.group.hostname
                )}
              </Content>
            </div>
            <div>
              <Content component="small" className="ocs-net-topo-sidepanel__label">
                Installation status
              </Content>
              <StatusBadge status={resource.status} />
            </div>
            <div>
              <Content component="small" className="ocs-net-topo-sidepanel__label">
                Description
              </Content>
              <Content component="p">{resource.detail}</Content>
            </div>
            <div>
              <Content component="small" className="ocs-net-topo-sidepanel__label">
                Position
              </Content>
              <Content component="p">
                x: {Math.round(pos.x)}, y: {Math.round(pos.y)}
              </Content>
            </div>
          </Flex>
        )}
        {tab === "connections" && (
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            <Content component="p" className="ocs-net-topo-sidepanel__hint">
              {isStandalone
                ? "Drag onto a node group to attach, or drag the arrow to link to another resource."
                : "Drag the arrow on a resource to connect it to another resource in the same node."}
            </Content>
            {connected.length === 0 ? (
              <Content component="p">No connections for this resource.</Content>
            ) : (
              connected.map((edge) => {
                const peerId = edge.from === resource.id ? edge.to : edge.from;
                const peerLabel = peerId.split("-").slice(-1)[0] ?? peerId;
                return (
                  <Flex
                    key={edge.id}
                    alignItems={{ default: "alignItemsCenter" }}
                    justifyContent={{ default: "justifyContentSpaceBetween" }}
                    className="ocs-net-topo-connection-row"
                  >
                    <Content component="p">
                      {edge.from === resource.id ? "→" : "←"} {peerLabel}
                    </Content>
                    <Button
                      variant="plain"
                      aria-label={`Remove connection to ${peerLabel}`}
                      icon={<TrashIcon aria-hidden />}
                      onClick={() =>
                        isStandalone
                          ? onRemoveStandaloneEdge(edge.id)
                          : onRemoveEdge(resource.group.id, edge.id)
                      }
                    />
                  </Flex>
                );
              })
            )}
          </Flex>
        )}
        {tab === "observe" && (
          <Content component="p">
            Metrics and events for <strong>{resource.label}</strong> ({RESOURCE_INSTALL_STATUS_LABELS[resource.status]})
            would appear here in a connected cluster.
          </Content>
        )}
      </div>
    </aside>
  );
}

export default function NetworkTopologyPanel({
  groups = WORKER_NODE_GROUPS,
  standaloneResources = [],
  onStandaloneResourcesChange,
  onAttachStandaloneToGroup,
  activeStep,
  physicalNetworkName,
  fitContentToken = 0,
  highlightResourceSuffix,
}: {
  groups?: WorkerNodeGroup[];
  standaloneResources?: StandaloneTopologyResource[];
  onStandaloneResourcesChange?: (resources: StandaloneTopologyResource[]) => void;
  onAttachStandaloneToGroup?: (resourceId: string, groupId: string, connectToResourceId?: string) => void;
  activeStep?: TopologyStep;
  physicalNetworkName?: string;
  fitContentToken?: number;
  highlightResourceSuffix?: string;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.92);
  const [pan, setPan] = useState({ x: 24, y: 48 });
  const [selected, setSelected] = useState<SelectedResource | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKind, setFilterKind] = useState<NetResourceKind | "all">("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [openGroupMenuId, setOpenGroupMenuId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{
    title: string;
    variant: "success" | "warning" | "info";
  } | null>(null);
  const [smoothTransform, setSmoothTransform] = useState(false);
  const smoothTimer = useRef<number | null>(null);

  const [positions, setPositions] = useState<PositionMap>(initializePositions);

  const [edgesByGroup, setEdgesByGroup] = useState<EdgeMap>(() =>
    Object.fromEntries(WORKER_NODE_GROUPS.map((g) => [g.id, [...g.edges]]))
  );
  const [standaloneEdges, setStandaloneEdges] = useState<TopologyEdge[]>([]);

  const [linkDrag, setLinkDrag] = useState<LinkDragState | null>(null);
  const [dragging, setDragging] = useState<{
    groupId: string;
    resourceId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const [draggingStandalone, setDraggingStandalone] = useState<{
    resourceId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  useEffect(() => {
    setEdgesByGroup((prev) => {
      const next: EdgeMap = { ...prev };
      groups.forEach((group) => {
        const merged = [...(next[group.id] ?? [])];
        group.edges.forEach((edge) => {
          if (!merged.some((e) => e.id === edge.id)) merged.push(edge);
        });
        next[group.id] = merged;
      });
      return next;
    });

    setPositions((prev) => {
      let next = { ...prev };
      groups.forEach((group) => {
        group.resources.forEach((resource) => {
          const key = posKey(group.id, resource.id);
          if (!next[key] || resource.status === "creating") {
            next[key] = { x: resource.x, y: resource.y };
          }
        });
        next = resolveGroupOverlaps(group, next);
      });
      return next;
    });
  }, [groups]);

  const isHighlighted = useCallback(
    (resource: NetResource) => (activeStep ? resource.highlightSteps.includes(activeStep) : false),
    [activeStep]
  );

  const resourceVisible = useCallback(
    (resource: NetResource) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        resource.label.toLowerCase().includes(q) ||
        RESOURCE_KIND_LABELS[resource.kind].toLowerCase().includes(q) ||
        RESOURCE_INSTALL_STATUS_LABELS[resource.status].toLowerCase().includes(q);
      const matchesKind = filterKind === "all" || resource.kind === filterKind;
      return matchesSearch && matchesKind;
    },
    [searchTerm, filterKind]
  );

  const standaloneVisible = useCallback(
    (resource: StandaloneTopologyResource) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        resource.label.toLowerCase().includes(q) ||
        resource.targetNodeLabel.toLowerCase().includes(q) ||
        RESOURCE_KIND_LABELS[resource.kind].toLowerCase().includes(q) ||
        RESOURCE_INSTALL_STATUS_LABELS[resource.status].toLowerCase().includes(q);
      const matchesKind = filterKind === "all" || resource.kind === filterKind;
      return matchesSearch && matchesKind;
    },
    [searchTerm, filterKind]
  );

  const visibleGroups = useMemo(
    () => groups.filter((g) => g.resources.some(resourceVisible)),
    [groups, resourceVisible]
  );

  const visibleStandalones = useMemo(
    () => standaloneResources.filter(standaloneVisible),
    [standaloneResources, standaloneVisible]
  );

  const groupLayouts = useMemo(() => {
    const layouts: Record<string, GroupLayout> = {};
    groups.forEach((group) => {
      layouts[group.id] = computeGroupLayout(
        group,
        positions,
        group.resources.filter(resourceVisible)
      );
    });
    return layouts;
  }, [groups, positions, resourceVisible]);

  const groupPositions = useMemo(() => {
    let x = BASE_X;
    const result: Record<string, { x: number; y: number }> = {};
    visibleGroups.forEach((group) => {
      result[group.id] = { x, y: BASE_Y };
      x += (groupLayouts[group.id]?.width ?? GROUP_W) + GROUP_GAP;
    });
    return result;
  }, [visibleGroups, groupLayouts]);

  const canvasWidth = useMemo(() => {
    let width = computeCanvasWidth(visibleGroups.map((group) => groupLayouts[group.id]?.width ?? GROUP_W));
    visibleStandalones.forEach((resource) => {
      width = Math.max(width, resource.canvasX + RESOURCE_W + 48);
    });
    return width;
  }, [visibleGroups, groupLayouts, visibleStandalones]);

  const canvasHeight = useMemo(() => {
    let maxBottom = GROUP_H + 80;
    visibleGroups.forEach((group) => {
      const layout = groupLayouts[group.id];
      const groupY = groupPositions[group.id]?.y ?? BASE_Y;
      maxBottom = Math.max(maxBottom, groupY + (layout?.totalHeight ?? GROUP_H) + 40);
    });
    visibleStandalones.forEach((resource) => {
      maxBottom = Math.max(maxBottom, resource.canvasY + RESOURCE_H + 56);
    });
    return maxBottom + BOTTOM_CANVAS_PAD;
  }, [visibleGroups, groupLayouts, groupPositions, visibleStandalones]);

  const getGroupPos = useCallback(
    (group: WorkerNodeGroup) => groupPositions[group.id] ?? { x: group.x, y: group.y },
    [groupPositions]
  );

  const getResourcePos = useCallback(
    (groupId: string, resource: NetResource) =>
      positions[posKey(groupId, resource.id)] ?? { x: resource.x, y: resource.y },
    [positions]
  );

  const triggerSmoothTransform = useCallback(() => {
    setSmoothTransform(true);
    if (smoothTimer.current) window.clearTimeout(smoothTimer.current);
    smoothTimer.current = window.setTimeout(() => setSmoothTransform(false), 480);
  }, []);

  const fitToContent = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || (visibleGroups.length === 0 && visibleStandalones.length === 0)) return;

    const rect = canvas.getBoundingClientRect();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    visibleGroups.forEach((group) => {
      const groupPos = groupPositions[group.id] ?? { x: BASE_X, y: BASE_Y };
      const layout = groupLayouts[group.id];
      if (!layout) return;

      group.resources.filter(resourceVisible).forEach((resource) => {
        const stored = getResourcePos(group.id, resource);
        const d = displayPos(stored, layout);
        minX = Math.min(minX, groupPos.x + d.x);
        minY = Math.min(minY, groupPos.y + d.y);
        maxX = Math.max(maxX, groupPos.x + d.x + RESOURCE_W);
        maxY = Math.max(maxY, groupPos.y + d.y + RESOURCE_H);
      });
      maxY = Math.max(maxY, groupPos.y + layout.totalHeight);
    });

    visibleStandalones.forEach((resource) => {
      minX = Math.min(minX, resource.canvasX);
      minY = Math.min(minY, resource.canvasY);
      maxX = Math.max(maxX, resource.canvasX + RESOURCE_W);
      maxY = Math.max(maxY, resource.canvasY + RESOURCE_H + 28);
    });

    if (!Number.isFinite(minX)) return;

    const pad = 40;
    const contentW = maxX - minX + pad * 2;
    const contentH = maxY - minY + pad * 2;
    const scaleX = rect.width / contentW;
    const scaleY = rect.height / contentH;
    const nextZoom = Math.min(1, Math.max(0.45, Math.min(scaleX, scaleY)));

    setZoom(nextZoom);
    setPan({ x: pad - minX * nextZoom, y: pad - minY * nextZoom });
    triggerSmoothTransform();
  }, [
    visibleGroups,
    visibleStandalones,
    groupPositions,
    groupLayouts,
    getResourcePos,
    resourceVisible,
    triggerSmoothTransform,
  ]);

  useEffect(() => {
    if (fitContentToken === 0) return undefined;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => fitToContent());
    });
    return () => cancelAnimationFrame(frame);
  }, [fitContentToken, fitToContent]);

  const clientToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      };
    },
    [pan.x, pan.y, zoom]
  );

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (openGroupMenuId) return;
    if ((e.target as HTMLElement).closest(".ocs-net-topo-resource")) return;
    if ((e.target as HTMLElement).closest(".ocs-net-topo-resource__connector")) return;
    if ((e.target as HTMLElement).closest(".ocs-net-topo-edge-hit")) return;
    if ((e.target as HTMLElement).closest(".ocs-net-topo-group__footer")) return;
    setOpenGroupMenuId(null);
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const resetGroupLayout = useCallback((group: WorkerNodeGroup) => {
    const baseline = WORKER_NODE_GROUPS.find((g) => g.id === group.id);
    setPositions((prev) => {
      let next = { ...prev };
      group.resources.forEach((resource) => {
        const baselineResource = baseline?.resources.find((r) => r.id === resource.id);
        next[posKey(group.id, resource.id)] = baselineResource
          ? { x: baselineResource.x, y: baselineResource.y }
          : { x: resource.x, y: resource.y };
      });
      next = resolveGroupOverlaps(group, next);
      return next;
    });
    triggerSmoothTransform();
  }, [triggerSmoothTransform]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingStandalone && onStandaloneResourcesChange) {
      const canvas = clientToCanvas(e.clientX, e.clientY);
      onStandaloneResourcesChange(
        standaloneResources.map((resource) =>
          resource.id === draggingStandalone.resourceId
            ? {
                ...resource,
                canvasX: canvas.x - draggingStandalone.offsetX,
                canvasY: canvas.y - draggingStandalone.offsetY,
              }
            : resource
        )
      );
      return;
    }
    if (dragging && canvasRef.current) {
      const canvas = clientToCanvas(e.clientX, e.clientY);
      const group = groups.find((g) => g.id === dragging.groupId);
      if (!group) return;
      const groupPos = getGroupPos(group);
      const layout = groupLayouts[group.id];
      if (!layout) return;
      const displayX = canvas.x - groupPos.x - dragging.startX;
      const displayY = canvas.y - groupPos.y - dragging.startY;
      const next = {
        x: displayX + layout.minX - GROUP_PAD,
        y: displayY + layout.minY - GROUP_PAD,
      };
      setPositions((prev) => dragWithPush(group, dragging.resourceId, next, prev));
      return;
    }
    if (!isPanning) return;
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    });
  };

  const attachStandalone = useCallback(
    (resourceId: string, groupId: string, connectToResourceId?: string) => {
      setStandaloneEdges((prev) => prev.filter((e) => e.from !== resourceId && e.to !== resourceId));
      onAttachStandaloneToGroup?.(resourceId, groupId, connectToResourceId);
    },
    [onAttachStandaloneToGroup]
  );

  const handleMouseUp = () => {
    if (draggingStandalone) {
      const resource = standaloneResources.find((r) => r.id === draggingStandalone.resourceId);
      if (resource) {
        const centerX = resource.canvasX + RESOURCE_W / 2;
        const centerY = resource.canvasY + RESOURCE_H / 2;
        for (const group of visibleGroups) {
          const groupPos = getGroupPos(group);
          const layout = groupLayouts[group.id];
          if (layout && pointInGroupSurface(centerX, centerY, groupPos, layout)) {
            attachStandalone(resource.id, group.id);
            break;
          }
        }
      }
      triggerSmoothTransform();
      setDraggingStandalone(null);
    }
    if (dragging) {
      const group = groups.find((g) => g.id === dragging.groupId);
      if (group) {
        setPositions((prev) => resolveGroupOverlaps(group, prev));
      }
      triggerSmoothTransform();
    }
    setIsPanning(false);
    setDragging(null);
  };

  const addEdge = (groupId: string, from: string, to: string) => {
    if (from === to) return;
    const id = `${from}__${to}`;
    setEdgesByGroup((prev) => {
      const list = prev[groupId] ?? [];
      if (list.some((e) => e.id === id || (e.from === from && e.to === to))) return prev;
      return { ...prev, [groupId]: [...list, { id, from, to }] };
    });
  };

  const removeEdge = (groupId: string, edgeId: string) => {
    setEdgesByGroup((prev) => ({
      ...prev,
      [groupId]: (prev[groupId] ?? []).filter((e) => e.id !== edgeId),
    }));
  };

  const addStandaloneEdge = (from: string, to: string) => {
    if (from === to) return;
    const id = `${from}__${to}`;
    setStandaloneEdges((prev) => {
      if (prev.some((e) => e.id === id || (e.from === from && e.to === to))) return prev;
      return [...prev, { id, from, to }];
    });
  };

  const removeStandaloneEdge = (edgeId: string) => {
    setStandaloneEdges((prev) => prev.filter((e) => e.id !== edgeId));
  };

  useEffect(() => {
    if (!linkDrag) return;

    const onPointerMove = (e: PointerEvent) => {
      setLinkDrag((prev) =>
        prev ? { ...prev, current: clientToCanvas(e.clientX, e.clientY) } : null
      );
    };

    const onPointerUp = (e: PointerEvent) => {
      const canvas = clientToCanvas(e.clientX, e.clientY);
      const target = findResourceAtCanvasPoint(
        groups,
        groupPositions,
        groupLayouts,
        positions,
        standaloneResources,
        canvas.x,
        canvas.y,
        { scope: linkDrag.scope, groupId: linkDrag.groupId, resourceId: linkDrag.resourceId }
      );

      if (linkDrag.scope === "standalone") {
        if (target?.kind === "group") {
          attachStandalone(linkDrag.resourceId, target.group.id, target.resource.id);
        } else if (target?.kind === "standalone") {
          addStandaloneEdge(linkDrag.resourceId, target.standalone.id);
        }
      } else if (linkDrag.scope === "group" && linkDrag.groupId) {
        if (target?.kind === "standalone") {
          attachStandalone(target.standalone.id, linkDrag.groupId, linkDrag.resourceId);
        } else if (target?.kind === "group" && target.group.id === linkDrag.groupId) {
          addEdge(linkDrag.groupId, linkDrag.resourceId, target.resource.id);
        }
      }

      setLinkDrag(null);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [
    linkDrag,
    groups,
    groupPositions,
    groupLayouts,
    positions,
    standaloneResources,
    clientToCanvas,
    attachStandalone,
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLinkDrag(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleResourcePointerDown = (
    e: React.PointerEvent,
    group: WorkerNodeGroup,
    resource: NetResource
  ) => {
    e.stopPropagation();
    const pos = getResourcePos(group.id, resource);
    const groupPos = getGroupPos(group);
    const layout = groupLayouts[group.id];
    const display = layout ? displayPos(pos, layout) : pos;
    const canvas = clientToCanvas(e.clientX, e.clientY);
    setDragging({
      groupId: group.id,
      resourceId: resource.id,
      startX: canvas.x - groupPos.x - display.x,
      startY: canvas.y - groupPos.y - display.y,
      origX: pos.x,
      origY: pos.y,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleConnectorPointerDown = (
    e: React.PointerEvent,
    group: WorkerNodeGroup,
    resource: NetResource
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const pos = getResourcePos(group.id, resource);
    const groupPos = getGroupPos(group);
    const layout = groupLayouts[group.id];
    const display = layout ? displayPos(pos, layout) : pos;
    const center = {
      x: groupPos.x + display.x + RESOURCE_W / 2,
      y: groupPos.y + display.y + RESOURCE_H / 2,
    };
    setLinkDrag({
      scope: "group",
      groupId: group.id,
      resourceId: resource.id,
      start: center,
      current: center,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleStandalonePointerDown = (e: React.PointerEvent, resource: StandaloneTopologyResource) => {
    e.stopPropagation();
    const canvas = clientToCanvas(e.clientX, e.clientY);
    setDraggingStandalone({
      resourceId: resource.id,
      offsetX: canvas.x - resource.canvasX,
      offsetY: canvas.y - resource.canvasY,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleStandaloneConnectorPointerDown = (e: React.PointerEvent, resource: StandaloneTopologyResource) => {
    e.stopPropagation();
    e.preventDefault();
    const center = {
      x: resource.canvasX + RESOURCE_W / 2,
      y: resource.canvasY + RESOURCE_H / 2,
    };
    setLinkDrag({
      scope: "standalone",
      resourceId: resource.id,
      start: center,
      current: center,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResourceClick = (group: WorkerNodeGroup, resource: NetResource) => {
    setSelected({ ...resource, group, placement: "group" });
  };

  const handleStandaloneClick = (resource: StandaloneTopologyResource) => {
    setSelected({ ...resource, placement: "standalone" });
  };

  const renderEdgeLine = (
    group: WorkerNodeGroup,
    groupPos: { x: number; y: number },
    layout: GroupLayout,
    edge: TopologyEdge,
    from: NetResource,
    to: NetResource
  ) => {
    const fromPos = getResourcePos(group.id, from);
    const toPos = getResourcePos(group.id, to);
    const fromDisplay = displayPos(fromPos, layout);
    const toDisplay = displayPos(toPos, layout);
    const c1 = {
      x: groupPos.x + fromDisplay.x + RESOURCE_W / 2,
      y: groupPos.y + fromDisplay.y + RESOURCE_H / 2,
    };
    const c2 = {
      x: groupPos.x + toDisplay.x + RESOURCE_W / 2,
      y: groupPos.y + toDisplay.y + RESOURCE_H / 2,
    };
    const active = isHighlighted(from) && isHighlighted(to);
    const midX = (c1.x + c2.x) / 2;

    return (
      <g key={edge.id} className="ocs-net-topo-edge">
        <path
          d={`M ${c1.x} ${c1.y} C ${midX} ${c1.y}, ${midX} ${c2.y}, ${c2.x} ${c2.y}`}
          fill="none"
          stroke="transparent"
          strokeWidth={14}
          className="ocs-net-topo-edge-hit"
          onClick={(e) => {
            e.stopPropagation();
            removeEdge(group.id, edge.id);
          }}
        />
        <path
          d={`M ${c1.x} ${c1.y} C ${midX} ${c1.y}, ${midX} ${c2.y}, ${c2.x} ${c2.y}`}
          fill="none"
          stroke={active ? "var(--pf-t--global--color--brand--default)" : "var(--ocs-net-topo-edge-stroke)"}
          strokeWidth={active ? 2.5 : 2}
          strokeOpacity={active ? 1 : 0.65}
          markerEnd="url(#net-topo-arrow)"
          className="ocs-net-topo-edge__line"
          pointerEvents="none"
        />
      </g>
    );
  };

  return (
    <div className="ocs-net-topo-panel">
      {actionNotice ? (
        <Alert
          variant={actionNotice.variant}
          title={actionNotice.title}
          isInline
          className="ocs-net-topo-panel__notice"
          onTimeout={() => setActionNotice(null)}
          timeout={5000}
        />
      ) : null}
      <div className="ocs-net-topo-panel__toolbar">
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
          <div className="ocs-net-topo-panel__search">
            <SearchIcon aria-hidden className="ocs-net-topo-panel__search-icon" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Find by name..."
              aria-label="Find by name"
            />
          </div>

          <div className="ocs-net-topo-panel__filter-wrap">
            <MenuToggle
              className="ocs-net-topo-panel__filter-toggle"
              variant={filterKind !== "all" ? "primary" : "default"}
              onClick={() => setShowFilterMenu((o) => !o)}
              isExpanded={showFilterMenu}
              icon={<Filter aria-hidden />}
            >
              {filterKind === "all" ? "Filter by resource" : RESOURCE_KIND_LABELS[filterKind]}
            </MenuToggle>
            {showFilterMenu && (
              <div className="ocs-net-topo-panel__filter-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => { setFilterKind("all"); setShowFilterMenu(false); }}>
                  All types
                </button>
                {(Object.keys(RESOURCE_KIND_LABELS) as NetResourceKind[]).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setFilterKind(kind);
                      setShowFilterMenu(false);
                    }}
                  >
                    {RESOURCE_KIND_LABELS[kind]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {physicalNetworkName ? (
            <Label color="blue" isCompact>
              Physical network: {physicalNetworkName}
            </Label>
          ) : null}
        </Flex>
      </div>

      <div className="ocs-net-topo-panel__stage">
        <div
          ref={canvasRef}
          className={`ocs-net-topo-panel__canvas${openGroupMenuId ? " ocs-net-topo-panel__canvas--menu-open" : ""}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={() => {
            if (!linkDrag) setSelected(null);
          }}
          role="application"
          aria-label="Node network topology. Drag resources to reposition. Drag the arrow on a resource to connect."
        >
          <div
            className="ocs-net-topo-panel__grid"
            style={{
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
            }}
          />

          <div
            className={`ocs-net-topo-panel__transform${smoothTransform ? " ocs-net-topo-panel__transform--smooth" : ""}`}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              width: canvasWidth,
              minHeight: canvasHeight,
            }}
          >
            <svg
              className="ocs-net-topo-panel__edges"
              width={canvasWidth}
              height={canvasHeight}
              aria-hidden
            >
              <defs>
                <marker id="net-topo-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="currentColor" opacity="0.7" />
                </marker>
                <marker id="net-topo-link-preview-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="var(--pf-t--global--icon--color--regular)" opacity="0.75" />
                </marker>
              </defs>
              {standaloneEdges.map((edge) => {
                const from = visibleStandalones.find((r) => r.id === edge.from);
                const to = visibleStandalones.find((r) => r.id === edge.to);
                if (!from || !to) return null;
                const c1 = { x: from.canvasX + RESOURCE_W / 2, y: from.canvasY + RESOURCE_H / 2 };
                const c2 = { x: to.canvasX + RESOURCE_W / 2, y: to.canvasY + RESOURCE_H / 2 };
                const midX = (c1.x + c2.x) / 2;
                return (
                  <g key={edge.id} className="ocs-net-topo-edge">
                    <path
                      d={`M ${c1.x} ${c1.y} C ${midX} ${c1.y}, ${midX} ${c2.y}, ${c2.x} ${c2.y}`}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={14}
                      className="ocs-net-topo-edge-hit"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeStandaloneEdge(edge.id);
                      }}
                    />
                    <path
                      d={`M ${c1.x} ${c1.y} C ${midX} ${c1.y}, ${midX} ${c2.y}, ${c2.x} ${c2.y}`}
                      fill="none"
                      stroke="var(--ocs-net-topo-edge-stroke)"
                      strokeWidth={2}
                      strokeOpacity={0.65}
                      markerEnd="url(#net-topo-arrow)"
                      className="ocs-net-topo-edge__line"
                      pointerEvents="none"
                    />
                  </g>
                );
              })}
              {visibleGroups.flatMap((group) => {
                const edges = edgesByGroup[group.id] ?? [];
                const groupPos = getGroupPos(group);
                const layout = groupLayouts[group.id];
                if (!layout) return [];
                return edges
                  .map((edge) => {
                    const from = group.resources.find((r) => r.id === edge.from);
                    const to = group.resources.find((r) => r.id === edge.to);
                    if (!from || !to || !resourceVisible(from) || !resourceVisible(to)) return null;
                    return renderEdgeLine(group, groupPos, layout, edge, from, to);
                  })
                  .filter(Boolean);
              })}
              {linkDrag ? (
                <line
                  x1={linkDrag.start.x}
                  y1={linkDrag.start.y}
                  x2={linkDrag.current.x}
                  y2={linkDrag.current.y}
                  className="ocs-net-topo-link-preview"
                  markerEnd="url(#net-topo-link-preview-arrow)"
                />
              ) : null}
            </svg>

            {visibleGroups.map((group) => {
              const layout = groupLayouts[group.id] ?? {
                minX: 0,
                minY: 0,
                width: group.width,
                surfaceHeight: GROUP_H - GROUP_FOOTER_GAP - GROUP_FOOTER_H,
                totalHeight: GROUP_H,
              };
              const groupPos = getGroupPos(group);
              return (
              <div
                key={group.id}
                className="ocs-net-topo-group"
                style={{ left: groupPos.x, top: groupPos.y, width: layout.width, height: layout.totalHeight }}
                role="group"
                aria-label={`Node ${group.shortName}`}
              >
                <div
                  className="ocs-net-topo-group__surface"
                  style={{ height: layout.surfaceHeight }}
                  aria-hidden
                />
                {group.resources.filter(resourceVisible).map((resource) => {
                  const highlighted =
                    isHighlighted(resource) ||
                    (highlightResourceSuffix !== undefined && resource.id.endsWith(highlightResourceSuffix));
                  const isSelected =
                    selected?.placement === "group" &&
                    selected.id === resource.id &&
                    selected.group.id === group.id;
                  const isLinkSource =
                    linkDrag?.scope === "group" &&
                    linkDrag.groupId === group.id &&
                    linkDrag.resourceId === resource.id;
                  const storedPos = getResourcePos(group.id, resource);
                  const pos = displayPos(storedPos, layout);
                  const kindColor = RESOURCE_KIND_COLORS[resource.kind];
                  const statusLabel = RESOURCE_INSTALL_STATUS_LABELS[resource.status];
                  const isDraggingThis = dragging?.resourceId === resource.id;

                  return (
                    <div
                      key={resource.id}
                      role="button"
                      tabIndex={0}
                      className={`ocs-net-topo-resource ocs-net-topo-resource--${resource.status}${
                        highlighted ? " ocs-net-topo-resource--highlight" : ""
                      }${isSelected ? " ocs-net-topo-resource--selected" : ""}${
                        isLinkSource ? " ocs-net-topo-resource--link-source" : ""
                      }${isDraggingThis ? " ocs-net-topo-resource--dragging" : ""}${
                        !isDraggingThis ? " ocs-net-topo-resource--animated" : ""
                      }`}
                      style={{ left: pos.x, top: pos.y, borderColor: kindColor }}
                      onPointerDown={(e) => {
                        if ((e.target as HTMLElement).closest(".ocs-net-topo-resource__connector")) return;
                        handleResourcePointerDown(e, group, resource);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResourceClick(group, resource);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleResourceClick(group, resource);
                        }
                      }}
                      aria-pressed={isSelected}
                      aria-label={`${resource.label}, ${RESOURCE_KIND_LABELS[resource.kind]}, ${statusLabel}. Drag to move.`}
                    >
                      <span className="ocs-net-topo-resource__icon" style={{ color: kindColor }}>
                        <ResourceIcon kind={resource.kind} />
                      </span>
                      <span className="ocs-net-topo-resource__label">{resource.label}</span>
                      <span className="ocs-net-topo-resource__status-row">
                        <ResourceStatusIcon status={resource.status} />
                        <span className="ocs-net-topo-resource__status">{statusLabel}</span>
                      </span>
                      <button
                        type="button"
                        className="ocs-net-topo-resource__connector"
                        aria-label={`Connect ${resource.label} to another resource`}
                        onPointerDown={(e) => handleConnectorPointerDown(e, group, resource)}
                      >
                        <span aria-hidden>›</span>
                      </button>
                    </div>
                  );
                })}
                <div
                  className="ocs-net-topo-group__footer"
                  style={{ top: layout.surfaceHeight + GROUP_FOOTER_GAP }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Label color="blue" isCompact className="ocs-resource-label">
                    N
                  </Label>
                  <span className="ocs-net-topo-group__hostname" title={group.hostname}>
                    {group.hostname}
                  </span>
                  <GroupActionsMenu
                    group={group}
                    isOpen={openGroupMenuId === group.id}
                    onOpenChange={(open) => setOpenGroupMenuId(open ? group.id : null)}
                    onResetLayout={() => resetGroupLayout(group)}
                    onNotice={setActionNotice}
                  />
                </div>
              </div>
            );
            })}

            {visibleStandalones.map((resource) => {
              const highlighted =
                isHighlighted(resource) ||
                (highlightResourceSuffix !== undefined && resource.id.endsWith(highlightResourceSuffix));
              const isSelected = selected?.placement === "standalone" && selected.id === resource.id;
              const isLinkSource = linkDrag?.scope === "standalone" && linkDrag.resourceId === resource.id;
              const kindColor = RESOURCE_KIND_COLORS[resource.kind];
              const statusLabel = RESOURCE_INSTALL_STATUS_LABELS[resource.status];
              const isDraggingThis = draggingStandalone?.resourceId === resource.id;

              return (
                <div
                  key={resource.id}
                  className="ocs-net-topo-standalone"
                  style={{ left: resource.canvasX, top: resource.canvasY }}
                >
                  <div className="ocs-net-topo-standalone__halo" aria-hidden />
                  <div
                    role="button"
                    tabIndex={0}
                    className={`ocs-net-topo-resource ocs-net-topo-resource--${resource.status} ocs-net-topo-resource--standalone${
                      highlighted ? " ocs-net-topo-resource--highlight" : ""
                    }${isSelected ? " ocs-net-topo-resource--selected" : ""}${
                      isLinkSource ? " ocs-net-topo-resource--link-source" : ""
                    }${isDraggingThis ? " ocs-net-topo-resource--dragging" : ""}${
                      !isDraggingThis ? " ocs-net-topo-resource--animated" : ""
                    }`}
                    style={{ borderColor: kindColor }}
                    onPointerDown={(e) => {
                      if ((e.target as HTMLElement).closest(".ocs-net-topo-resource__connector")) return;
                      handleStandalonePointerDown(e, resource);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStandaloneClick(resource);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleStandaloneClick(resource);
                      }
                    }}
                    aria-pressed={isSelected}
                    aria-label={`${resource.label} for ${resource.targetNodeLabel}, ${RESOURCE_KIND_LABELS[resource.kind]}, ${statusLabel}. Drag onto a node group to attach.`}
                  >
                    <span className="ocs-net-topo-resource__icon" style={{ color: kindColor }}>
                      <ResourceIcon kind={resource.kind} />
                    </span>
                    <span className="ocs-net-topo-resource__label">{resource.label}</span>
                    <span className="ocs-net-topo-resource__status-row">
                      <ResourceStatusIcon status={resource.status} />
                      <span className="ocs-net-topo-resource__status">{statusLabel}</span>
                    </span>
                    <button
                      type="button"
                      className="ocs-net-topo-resource__connector"
                      aria-label={`Connect ${resource.label} to another resource`}
                      onPointerDown={(e) => handleStandaloneConnectorPointerDown(e, resource)}
                    >
                      <span aria-hidden>›</span>
                    </button>
                  </div>
                  <span className="ocs-net-topo-standalone__target">{resource.targetNodeLabel}</span>
                </div>
              );
            })}
          </div>

          <div className="ocs-net-topo-panel__controls app-glass-panel">
            <Button variant="plain" aria-label="Zoom in" icon={<ZoomInIcon />} onClick={() => setZoom((z) => Math.min(z + 0.12, 2))} />
            <Button variant="plain" aria-label="Zoom out" icon={<ZoomOutIcon />} onClick={() => setZoom((z) => Math.max(z - 0.12, 0.35))} />
            <Button variant="plain" aria-label="Fit to screen" icon={<ExpandIcon />} onClick={fitToContent} />
            <Button variant="plain" aria-expanded={showLegend} onClick={() => setShowLegend((l) => !l)}>
              Legend
            </Button>
          </div>

          {showLegend && (
            <div className="ocs-net-topo-panel__legend app-glass-panel" role="region" aria-label="Topology legend">
              <Content component="p" className="ocs-net-topo-panel__legend-title">
                Resource types
              </Content>
              {(Object.keys(RESOURCE_KIND_LABELS) as NetResourceKind[]).map((kind) => (
                <Flex key={kind} alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                  <span className="ocs-net-topo-panel__legend-swatch" style={{ background: RESOURCE_KIND_COLORS[kind] }} />
                  <Content component="small">{RESOURCE_KIND_LABELS[kind]}</Content>
                </Flex>
              ))}
              <Content component="p" className="ocs-net-topo-panel__legend-title pf-v6-u-mt-md">
                Installation status
              </Content>
              {(Object.keys(RESOURCE_INSTALL_STATUS_LABELS) as ResourceInstallStatus[]).map((st) => (
                <Flex key={st} alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                  <StatusBadge status={st} />
                </Flex>
              ))}
              <Content component="small" className="ocs-net-topo-panel__legend-hint pf-v6-u-mt-sm">
                New resources appear on their own below the node groups. Drag them onto a group or link them to attach.
                Drag resources inside groups to reposition — nearby resources shift aside. Click a connection line to remove it.
              </Content>
            </div>
          )}
        </div>

        {selected ? (
          <TopologySidePanel
            resource={selected}
            positions={positions}
            edges={edgesByGroup}
            standaloneEdges={standaloneEdges}
            onClose={() => setSelected(null)}
            onRemoveEdge={removeEdge}
            onRemoveStandaloneEdge={removeStandaloneEdge}
          />
        ) : null}
      </div>
    </div>
  );
}
