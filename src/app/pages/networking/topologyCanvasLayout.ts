import {
  BASE_X,
  GROUP_H,
  GROUP_W,
  resourceGridPos,
  slotKeyFromSuffix,
  type NetResource,
  type WorkerNodeGroup,
} from "./networkTopologyData";

export type CanvasLayoutMode = "grid" | "freeform";

/** Visible worker groups per row in grid layout mode. */
export const WORKER_GROUP_GRID_COLUMNS = 3;

/** Fixed bounding box for deterministic worker group grid placement. */
export const WORKER_GROUP_CARD_WIDTH = 280;
export const WORKER_GROUP_CARD_HEIGHT = 360;
export const WORKER_GROUP_GRID_GAP_X = 64;
export const WORKER_GROUP_GRID_GAP_Y = 80;

export const TOPOLOGY_SPLIT_WIDTH_STORAGE_KEY = "ocs-net-topo-split-width";
export const TOPOLOGY_LAYOUT_MODE_STORAGE_KEY = "ocs-net-topo-layout-mode";

export const TOPOLOGY_SPLIT_DEFAULT_WIDTH = 440;
export const TOPOLOGY_SPLIT_MIN_WIDTH = 300;
export const TOPOLOGY_SPLIT_MAX_WIDTH_RATIO = 0.55;

export function readTopologySplitWidth(): number {
  try {
    const raw = sessionStorage.getItem(TOPOLOGY_SPLIT_WIDTH_STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : TOPOLOGY_SPLIT_DEFAULT_WIDTH;
  } catch {
    return TOPOLOGY_SPLIT_DEFAULT_WIDTH;
  }
}

export function writeTopologySplitWidth(width: number): void {
  try {
    sessionStorage.setItem(TOPOLOGY_SPLIT_WIDTH_STORAGE_KEY, String(Math.round(width)));
  } catch {
    /* sessionStorage unavailable */
  }
}

export function readTopologyLayoutMode(): CanvasLayoutMode {
  try {
    const raw = sessionStorage.getItem(TOPOLOGY_LAYOUT_MODE_STORAGE_KEY);
    if (raw === "grid" || raw === "structured") return "grid";
    return "freeform";
  } catch {
    return "freeform";
  }
}

export function writeTopologyLayoutMode(mode: CanvasLayoutMode): void {
  try {
    sessionStorage.setItem(TOPOLOGY_LAYOUT_MODE_STORAGE_KEY, mode);
  } catch {
    /* sessionStorage unavailable */
  }
}

export function resourceSuffixFromId(resourceId: string, groupId: string): string {
  const prefix = `${groupId}-`;
  return resourceId.startsWith(prefix) ? resourceId.slice(prefix.length) : resourceId;
}

export function structuredPositionForResource(resourceId: string, groupId: string): { x: number; y: number } {
  const suffix = resourceSuffixFromId(resourceId, groupId);
  const slot = slotKeyFromSuffix(suffix);
  return resourceGridPos(slot.col, slot.row);
}

export type PositionMap = Record<string, { x: number; y: number }>;

export function posKey(groupId: string, resourceId: string): string {
  return `${groupId}::${resourceId}`;
}

export function applyStructuredGridToGroup(
  group: WorkerNodeGroup,
  positions: PositionMap
): PositionMap {
  const next = { ...positions };
  group.resources.forEach((resource) => {
    next[posKey(group.id, resource.id)] = structuredPositionForResource(resource.id, group.id);
  });
  return next;
}

export function applyStructuredGridToAllGroups(
  groups: WorkerNodeGroup[],
  positions: PositionMap
): PositionMap {
  return groups.reduce((acc, group) => applyStructuredGridToGroup(group, acc), positions);
}

export function structuredPositionForResourceEntity(
  resource: NetResource,
  groupId: string
): { x: number; y: number } {
  return structuredPositionForResource(resource.id, groupId);
}

export type GroupLayoutMetrics = {
  width: number;
  totalHeight: number;
};

/** Index-based absolute grid slot for one worker group card. */
export function workerGroupGridPosition(
  index: number,
  originY: number
): { x: number; y: number } {
  const col = index % WORKER_GROUP_GRID_COLUMNS;
  const row = Math.floor(index / WORKER_GROUP_GRID_COLUMNS);
  const slotWidth = Math.max(WORKER_GROUP_CARD_WIDTH, GROUP_W);
  const slotHeight = Math.max(WORKER_GROUP_CARD_HEIGHT, GROUP_H);
  return {
    x: BASE_X + col * (slotWidth + WORKER_GROUP_GRID_GAP_X),
    y: originY + row * (slotHeight + WORKER_GROUP_GRID_GAP_Y),
  };
}

/** Snap visible worker node groups to a non-overlapping index-based pixel grid. */
export function applyGridLayoutToGroupPositions(
  visibleGroups: WorkerNodeGroup[],
  workerGroupY: number,
  _groupLayouts: Record<string, GroupLayoutMetrics> = {}
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  visibleGroups.forEach((group, index) => {
    positions[group.id] = workerGroupGridPosition(index, workerGroupY);
  });
  return positions;
}
