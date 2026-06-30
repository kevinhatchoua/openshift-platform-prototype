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
  groupLayouts: Record<string, GroupLayoutMetrics> = {}
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  if (visibleGroups.length === 0) return positions;

  const slotWidth = Math.max(WORKER_GROUP_CARD_WIDTH, GROUP_W);
  let rowY = workerGroupY;

  for (let rowStart = 0; rowStart < visibleGroups.length; rowStart += WORKER_GROUP_GRID_COLUMNS) {
    const rowGroups = visibleGroups.slice(rowStart, rowStart + WORKER_GROUP_GRID_COLUMNS);
    const rowMaxHeight = Math.max(
      WORKER_GROUP_CARD_HEIGHT,
      GROUP_H,
      ...rowGroups.map((group) => groupLayouts[group.id]?.totalHeight ?? GROUP_H)
    );

    rowGroups.forEach((group, colIndex) => {
      const col = colIndex % WORKER_GROUP_GRID_COLUMNS;
      positions[group.id] = {
        x: BASE_X + col * (slotWidth + WORKER_GROUP_GRID_GAP_X),
        y: rowY,
      };
    });

    rowY += rowMaxHeight + WORKER_GROUP_GRID_GAP_Y;
  }

  return positions;
}

function groupRectsOverlap(
  a: { x: number; y: number },
  aW: number,
  aH: number,
  b: { x: number; y: number },
  bW: number,
  bH: number,
  gap: number
): boolean {
  return (
    a.x < b.x + bW + gap &&
    a.x + aW + gap > b.x &&
    a.y < b.y + bH + gap &&
    a.y + aH + gap > b.y
  );
}

/** Push apart overlapping worker group cards in freeform layout mode. */
export function separateOverlappingWorkerGroups(
  positions: Record<string, { x: number; y: number }>,
  groupIds: string[],
  groupLayouts: Record<string, GroupLayoutMetrics>
): Record<string, { x: number; y: number }> {
  const next: Record<string, { x: number; y: number }> = { ...positions };

  const sizeFor = (id: string) => ({
    width: Math.max(WORKER_GROUP_CARD_WIDTH, GROUP_W, groupLayouts[id]?.width ?? GROUP_W),
    height: Math.max(WORKER_GROUP_CARD_HEIGHT, GROUP_H, groupLayouts[id]?.totalHeight ?? GROUP_H),
  });

  for (let pass = 0; pass < 48; pass += 1) {
    let changed = false;

    for (let i = 0; i < groupIds.length; i += 1) {
      for (let j = i + 1; j < groupIds.length; j += 1) {
        const idA = groupIds[i];
        const idB = groupIds[j];
        const posA = next[idA];
        const posB = next[idB];
        if (!posA || !posB) continue;

        const sizeA = sizeFor(idA);
        const sizeB = sizeFor(idB);
        if (
          !groupRectsOverlap(
            posA,
            sizeA.width,
            sizeA.height,
            posB,
            sizeB.width,
            sizeB.height,
            WORKER_GROUP_GRID_GAP_X
          )
        ) {
          continue;
        }

        changed = true;
        const centerAx = posA.x + sizeA.width / 2;
        const centerAy = posA.y + sizeA.height / 2;
        const centerBx = posB.x + sizeB.width / 2;
        const centerBy = posB.y + sizeB.height / 2;
        const dx = centerBx - centerAx;
        const dy = centerBy - centerAy;
        const dist = Math.hypot(dx, dy) || 1;
        const pushX = ((sizeA.width + sizeB.width) / 2 + WORKER_GROUP_GRID_GAP_X - Math.abs(dx)) / 2 + 1;
        const pushY = ((sizeA.height + sizeB.height) / 2 + WORKER_GROUP_GRID_GAP_Y - Math.abs(dy)) / 2 + 1;

        if (Math.abs(dx) >= Math.abs(dy)) {
          next[idA] = { x: posA.x - (pushX * dx) / dist, y: posA.y };
          next[idB] = { x: posB.x + (pushX * dx) / dist, y: posB.y };
        } else {
          next[idA] = { x: posA.x, y: posA.y - (pushY * dy) / dist };
          next[idB] = { x: posB.x, y: posB.y + (pushY * dy) / dist };
        }
      }
    }

    if (!changed) break;
  }

  return next;
}
