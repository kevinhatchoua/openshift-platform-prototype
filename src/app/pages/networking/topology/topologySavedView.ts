import { isNode, Point, type Graph, type Node } from "@patternfly/react-topology";
import type { TopologyDataScale } from "../networkTopologyData";
import type { NodeNetworkViewMode } from "../nodeNetworkViewMode";
import type { TopologyQueryState } from "./topologyQueryFilter";
import type { TopologyPerspective, TopologyResourceFilter } from "./topologyPerspective";
import type { TopologyLayoutId } from "./topologyLayouts";

const STORAGE_KEY = "ocs-networking-topology-saved-view";

export type TopologyPoint = { x: number; y: number };

/** Preferred topology layout and display state for the 5.2 prototype. */
export type SavedTopologyView = {
  version: 1;
  perspective: TopologyPerspective;
  layoutId: TopologyLayoutId;
  displayLabels: boolean;
  filterKind: TopologyResourceFilter;
  queryState: TopologyQueryState;
  viewMode: NodeNetworkViewMode;
  topologyScale: TopologyDataScale;
  positions: Record<string, TopologyPoint>;
  graphScale: number;
  graphPan: TopologyPoint;
};

function isPoint(value: unknown): value is TopologyPoint {
  if (!value || typeof value !== "object") return false;
  const point = value as TopologyPoint;
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

export function readSavedTopologyView(): SavedTopologyView | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as SavedTopologyView | null;
    if (!parsed || parsed.version !== 1 || !parsed.positions || !isPoint(parsed.graphPan)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSavedTopologyView(view: SavedTopologyView) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(view));
}

function visitNode(node: Node, positions: Record<string, TopologyPoint>) {
  const point = node.getPosition();
  positions[node.getId()] = { x: point.x, y: point.y };
  node.getChildren().forEach((child) => {
    if (isNode(child)) visitNode(child, positions);
  });
}

export function captureGraphLayout(graph: Graph): Pick<SavedTopologyView, "positions" | "graphScale" | "graphPan"> {
  const positions: Record<string, TopologyPoint> = {};
  graph.getNodes().forEach((node) => visitNode(node, positions));
  const pan = graph.getPosition();
  return {
    positions,
    graphScale: graph.getScale(),
    graphPan: { x: pan.x, y: pan.y },
  };
}

export function applyGraphLayout(
  graph: Graph,
  layout: Pick<SavedTopologyView, "positions" | "graphScale" | "graphPan">
) {
  const applyNode = (node: Node) => {
    const point = layout.positions[node.getId()];
    if (point) node.setPosition(new Point(point.x, point.y));
    node.getChildren().forEach((child) => {
      if (isNode(child)) applyNode(child);
    });
  };
  graph.getNodes().forEach(applyNode);
  graph.setScale(layout.graphScale);
  graph.setPosition(new Point(layout.graphPan.x, layout.graphPan.y));
}
