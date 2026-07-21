import { useEffect, useMemo, useRef } from "react";
import type { StandaloneTopologyResource, TopologyCrossEdge, WorkerNodeGroup } from "../networkTopologyData";
import { createCytoscapeEngine } from "../ovtools/ovtoolsCytoscapeEngine";
import { OVTOOLS_CY_STYLES } from "../ovtools/ovtoolsTopologyStyles";
import {
  buildNetworkTopologyCytoscapeElements,
} from "./networkTopologyCytoscapeAdapter";

type NetworkTopologyCytoscapeViewProps = {
  groups: WorkerNodeGroup[];
  standalones: StandaloneTopologyResource[];
  crossEdges: TopologyCrossEdge[];
  selectedResourceId: string | null;
  scaleRevision?: string;
  canvasReflowKey?: boolean;
  onSelectResourceId: (resourceId: string | null) => void;
  onNodeHover?: (resourceId: string | null, position?: { x: number; y: number }) => void;
};

export function NetworkTopologyCytoscapeView({
  groups,
  standalones,
  crossEdges,
  selectedResourceId,
  scaleRevision,
  canvasReflowKey,
  onSelectResourceId,
  onNodeHover,
}: NetworkTopologyCytoscapeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ReturnType<typeof createCytoscapeEngine> | null>(null);

  const elements = useMemo(
    () => buildNetworkTopologyCytoscapeElements(groups, standalones, crossEdges),
    [groups, standalones, crossEdges, scaleRevision]
  );

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const engine = createCytoscapeEngine({
      container: containerRef.current,
      elements,
      styles: OVTOOLS_CY_STYLES,
      layoutProfile: "network",
      handlers: {
        onNodeTap: (nodeId) => onSelectResourceId(nodeId),
        onCanvasTap: () => onSelectResourceId(null),
        onNodeHover: (nodeId, position) => onNodeHover?.(nodeId, position),
      },
    });
    engineRef.current = engine;
    engine.runLayout();
    engine.fit();
    engine.collapseAllClusters();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [elements, onNodeHover, onSelectResourceId]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || engine.cy.destroyed()) return;
    engine.cy.nodes().removeClass("selected");
    if (selectedResourceId) {
      engine.cy.getElementById(selectedResourceId).addClass("selected");
    }
  }, [selectedResourceId]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || engine.cy.destroyed()) return;
    const timer = window.setTimeout(() => engine.relayoutAfterResize(), 320);
    return () => window.clearTimeout(timer);
  }, [canvasReflowKey]);

  return (
    <div className="ocs-net-topo-panel__cytoscape-wrap">
      <div
        ref={containerRef}
        className="ocs-net-topo-panel__cytoscape-canvas"
        role="application"
        aria-label="Node network topology graph view"
      />
    </div>
  );
}
