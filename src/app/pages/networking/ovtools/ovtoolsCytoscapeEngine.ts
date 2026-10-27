import cytoscape, { type Core, type ElementDefinition, type LayoutOptions, type NodeSingular, type StylesheetStyle } from "cytoscape";
import fcose from "cytoscape-fcose";

cytoscape.use(fcose);

export type CytoscapeEngineHandlers = {
  onNodeTap?: (nodeId: string, nodeData?: Record<string, unknown>) => void;
  onCanvasTap?: () => void;
  onNodeHover?: (nodeId: string | null, position?: { x: number; y: number }) => void;
};

export type CytoscapeEngineConfig = {
  container: HTMLElement;
  elements: ElementDefinition[];
  styles: StylesheetStyle[];
  handlers?: CytoscapeEngineHandlers;
  layoutProfile?: "overview" | "network" | "storage";
};

/** Mandatory anti-overlap spec — cytoscape.js fcose only. */
export const ANTI_OVERLAP_LAYOUT = {
  name: "fcose" as const,
  quality: "proof" as const,
  nodeDimensionsIncludeLabels: true,
  nodeRepulsion: 9500,
  idealEdgeLength: 160,
  nodeSpacing: 120,
  padding: 80,
  tile: true,
  tilingPaddingVertical: 90,
  tilingPaddingHorizontal: 90,
  nestingFactor: 1.2,
} as const;

const GRAVITY_BY_PROFILE = {
  overview: 0.22,
  network: 0.18,
  storage: 0.24,
} as const;

const LABEL_ZOOM_THRESHOLD = 0.38;
const HEAVY_GRAPH_NODE_COUNT = 100;

function buildFcoseLayout(profile: keyof typeof GRAVITY_BY_PROFILE, heavy: boolean): LayoutOptions {
  const {
    nodeRepulsion,
    idealEdgeLength,
    nodeSpacing,
    padding,
    tilingPaddingVertical,
    tilingPaddingHorizontal,
    nestingFactor,
    quality,
    nodeDimensionsIncludeLabels,
    tile,
  } = ANTI_OVERLAP_LAYOUT;

  return {
    name: "fcose",
    quality,
    animate: !heavy,
    animationDuration: heavy ? 0 : 520,
    randomize: false,
    fit: false,
    padding,
    nodeDimensionsIncludeLabels,
    packComponents: true,
    tile,
    tilingPaddingVertical,
    tilingPaddingHorizontal,
    nodeRepulsion: () => nodeRepulsion,
    idealEdgeLength: () => idealEdgeLength,
    nodeSeparation: nodeSpacing,
    nestingFactor,
    gravity: GRAVITY_BY_PROFILE[profile],
    numIter: heavy ? 1600 : 3200,
  };
}

export function createCytoscapeEngine(config: CytoscapeEngineConfig) {
  const cy = cytoscape({
    container: config.container,
    elements: config.elements,
    style: config.styles,
    minZoom: 0.08,
    maxZoom: 2.5,
    wheelSensitivity: 0.2,
    boxSelectionEnabled: false,
    hideEdgesOnViewport: true,
    textureOnViewport: true,
    motionBlur: false,
  });

  cy.on("tap", "node", (event) => {
    const node = event.target as NodeSingular;
    if (node.hasClass("cluster-collapsed")) {
      expandCluster(cy, node.id(), config.layoutProfile ?? "overview");
      return;
    }
    config.handlers?.onNodeTap?.(node.id(), node.data() as Record<string, unknown>);
  });

  cy.on("dbltap", "node", (event) => {
    const node = event.target as NodeSingular;
    if (!node.isParent()) return;
    if (node.hasClass("cluster-collapsed")) {
      expandCluster(cy, node.id(), config.layoutProfile ?? "overview");
    } else {
      collapseCluster(cy, node.id());
    }
  });

  cy.on("tap", (event) => {
    if (event.target === cy) config.handlers?.onCanvasTap?.();
  });

  cy.on("mouseover", "node", (event) => {
    const node = event.target as NodeSingular;
    config.handlers?.onNodeHover?.(node.id(), node.renderedPosition());
    highlightNeighborhood(cy, node);
  });

  cy.on("mouseout", "node", () => {
    config.handlers?.onNodeHover?.(null);
    clearHighlight(cy);
  });

  cy.on("zoom pan", () => syncLabelVisibility(cy));

  const profile = config.layoutProfile ?? "overview";

  return {
    cy,
    runLayout: () => runLayout(cy, profile),
    relayoutAfterResize: () => relayoutAfterResize(cy, profile),
    destroy: () => cy.destroy(),
    fit: (pad = ANTI_OVERLAP_LAYOUT.padding) => cy.fit(undefined, pad),
    zoomBy: (factor: number) => {
      cy.zoom({ level: cy.zoom() * factor });
      cy.center();
    },
    collapseCluster: (clusterId: string) => collapseCluster(cy, clusterId),
    expandCluster: (clusterId: string) => expandCluster(cy, clusterId, profile),
    collapseAllClusters: () => {
      cy.nodes('[kind = "cluster"]').forEach((node) => collapseCluster(cy, node.id()));
      syncLabelVisibility(cy);
    },
  };
}

export function runLayout(cy: Core, profile: keyof typeof GRAVITY_BY_PROFILE = "overview") {
  const heavy = cy.nodes().length >= HEAVY_GRAPH_NODE_COUNT;
  cy.layout(buildFcoseLayout(profile, heavy)).run();
  syncLabelVisibility(cy);
}

export function relayoutAfterResize(cy: Core, profile: keyof typeof GRAVITY_BY_PROFILE = "overview") {
  if (cy.destroyed()) return;
  cy.resize();
  runLayout(cy, profile);
  cy.fit(undefined, ANTI_OVERLAP_LAYOUT.padding);
}

function syncLabelVisibility(cy: Core) {
  cy.nodes().toggleClass("label-hidden", cy.zoom() < LABEL_ZOOM_THRESHOLD);
}

function highlightNeighborhood(cy: Core, node: NodeSingular) {
  cy.elements().addClass("faded");
  node.removeClass("faded").addClass("highlighted");
  node.neighborhood().removeClass("faded");
}

function clearHighlight(cy: Core) {
  cy.elements().removeClass("faded highlighted hover");
}

function collapseCluster(cy: Core, clusterId: string) {
  const cluster = cy.getElementById(clusterId);
  if (!cluster.nonempty() || !cluster.isParent()) return;
  cluster.children().addClass("cluster-hidden");
  cluster.addClass("cluster-collapsed");
}

function expandCluster(cy: Core, clusterId: string, profile: keyof typeof GRAVITY_BY_PROFILE) {
  const cluster = cy.getElementById(clusterId);
  if (!cluster.nonempty()) return;
  cluster.children().removeClass("cluster-hidden");
  cluster.removeClass("cluster-collapsed");
  runLayout(cy, profile);
}
