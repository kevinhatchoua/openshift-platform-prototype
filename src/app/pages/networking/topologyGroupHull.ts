export type HullPoint = { x: number; y: number };

/** Radial safety padding outside outermost child bounds (40–60px target). */
export const HULL_RADIAL_PADDING = 48;
export const HULL_CORNER_RADIUS = 20;
export const RESOURCE_VISUAL_BLEED = 3;

export type HullRect = { x: number; y: number; w: number; h: number };

function cross(origin: HullPoint, a: HullPoint, b: HullPoint): number {
  return (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);
}

/** Graham scan convex hull (counter-clockwise). */
export function convexHull(points: HullPoint[]): HullPoint[] {
  if (points.length <= 1) return [...points];

  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const lower: HullPoint[] = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }

  const upper: HullPoint[] = [];
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const point = sorted[index];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

export function boundsFromRects(rects: HullRect[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (rects.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return rects.reduce(
    (bounds, rect) => ({
      minX: Math.min(bounds.minX, rect.x),
      minY: Math.min(bounds.minY, rect.y),
      maxX: Math.max(bounds.maxX, rect.x + rect.w),
      maxY: Math.max(bounds.maxY, rect.y + rect.h),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );
}

export function hullBounds(hull: HullPoint[]): { minX: number; minY: number; maxX: number; maxY: number } {
  if (hull.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return hull.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxX: Math.max(bounds.maxX, point.x),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );
}

function normalize(vector: HullPoint): HullPoint {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / length, y: vector.y / length };
}

function roundedRectPath(x: number, y: number, width: number, height: number, radius: number): string {
  const r = Math.min(radius, width / 2, height / 2);
  return [
    `M ${x + r} ${y}`,
    `H ${x + width - r}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `V ${y + height - r}`,
    `Q ${x + width} ${y + height} ${x + width - r} ${y + height}`,
    `H ${x + r}`,
    `Q ${x} ${y + height} ${x} ${y + height - r}`,
    `V ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    "Z",
  ].join(" ");
}

/** Smooth closed path with quadratic corners around a convex polygon. */
export function roundedPolygonPath(hull: HullPoint[], radius: number): string {
  const count = hull.length;
  if (count === 0) return "";
  if (count === 1) {
    const point = hull[0];
    return `M ${point.x - radius} ${point.y} a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 ${-radius * 2} 0 Z`;
  }
  if (count === 2) {
    const [a, b] = hull;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = (-dy / length) * radius;
    const ny = (dx / length) * radius;
    return `M ${a.x + nx} ${a.y + ny} L ${b.x + nx} ${b.y + ny} L ${b.x - nx} ${b.y - ny} L ${a.x - nx} ${a.y - ny} Z`;
  }

  const commands: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const previous = hull[(index - 1 + count) % count];
    const current = hull[index];
    const next = hull[(index + 1) % count];
    const inVector = normalize({ x: previous.x - current.x, y: previous.y - current.y });
    const outVector = normalize({ x: next.x - current.x, y: next.y - current.y });
    const cornerDistance = Math.min(
      Math.hypot(next.x - current.x, next.y - current.y) / 2,
      Math.hypot(previous.x - current.x, previous.y - current.y) / 2,
      radius
    );
    const start = {
      x: current.x + inVector.x * cornerDistance,
      y: current.y + inVector.y * cornerDistance,
    };
    const end = {
      x: current.x + outVector.x * cornerDistance,
      y: current.y + outVector.y * cornerDistance,
    };

    if (index === 0) commands.push(`M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`);
    else commands.push(`L ${start.x.toFixed(1)} ${start.y.toFixed(1)}`);
    commands.push(
      `Q ${current.x.toFixed(1)} ${current.y.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`
    );
  }
  commands.push("Z");
  return commands.join(" ");
}

export function resourceRectHullPoints(rect: HullRect): HullPoint[] {
  const { x, y, w, h } = rect;
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ];
}

function padBounds(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  padding: number
) {
  return {
    minX: bounds.minX - padding,
    minY: bounds.minY - padding,
    maxX: bounds.maxX + padding,
    maxY: bounds.maxY + padding,
  };
}

/** Bounding-box hull with guaranteed radial clearance around full child card rects. */
export function calculateDynamicHull(
  resourceRects: HullRect[],
  fallbackWidth: number,
  fallbackHeight: number,
  padding = HULL_RADIAL_PADDING,
  cornerRadius = HULL_CORNER_RADIUS
): { path: string; bounds: { minX: number; minY: number; maxX: number; maxY: number } } {
  return computeGroupHullPath(resourceRects, fallbackWidth, fallbackHeight, padding, cornerRadius);
}

/** Maps child card rects to a smoothed convex-hull SVG path. */
export function calculateFlexibleHull(
  resourceRects: HullRect[],
  fallbackWidth: number,
  fallbackHeight: number,
  padding = HULL_RADIAL_PADDING,
  cornerRadius = HULL_CORNER_RADIUS
): string {
  return computeGroupHullPath(resourceRects, fallbackWidth, fallbackHeight, padding, cornerRadius).path;
}

export function computeGroupHullPath(
  resourceRects: HullRect[],
  fallbackWidth: number,
  fallbackHeight: number,
  padding = HULL_RADIAL_PADDING,
  cornerRadius = HULL_CORNER_RADIUS
): { path: string; bounds: { minX: number; minY: number; maxX: number; maxY: number } } {
  if (resourceRects.length === 0) {
    const inset = padding + RESOURCE_VISUAL_BLEED;
    const width = Math.max(96, fallbackWidth - inset * 2);
    const height = Math.max(96, fallbackHeight - inset * 2);
    return {
      path: roundedRectPath(inset, inset, width, height, cornerRadius),
      bounds: { minX: inset, minY: inset, maxX: inset + width, maxY: inset + height },
    };
  }

  const bleed = RESOURCE_VISUAL_BLEED;
  const paddedRects = resourceRects.map((rect) => ({
    x: rect.x - bleed - padding,
    y: rect.y - bleed - padding,
    w: rect.w + (bleed + padding) * 2,
    h: rect.h + (bleed + padding) * 2,
  }));

  const hullPoints = convexHull(paddedRects.flatMap(resourceRectHullPoints));
  if (hullPoints.length === 0) {
    const rawBounds = boundsFromRects(paddedRects);
    const padded = padBounds(rawBounds, 0);
    const width = padded.maxX - padded.minX;
    const height = padded.maxY - padded.minY;
    return {
      path: roundedRectPath(padded.minX, padded.minY, width, height, cornerRadius),
      bounds: padded,
    };
  }

  const bounds = hullBounds(hullPoints);
  return {
    path: roundedPolygonPath(hullPoints, cornerRadius),
    bounds,
  };
}

/** @deprecated Use HULL_RADIAL_PADDING */
export const HULL_PADDING = HULL_RADIAL_PADDING;
