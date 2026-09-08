import { useMemo, useState } from "react";
import { Button, Content, Drawer, DrawerContent, DrawerContentBody, Flex } from "@patternfly/react-core";
import type { GitOpsTopoGraph } from "./gitopsTopologyData";
import { graphBounds, layoutTree } from "./gitopsTopologyData";
import GitOpsTopologyDetailPanel from "./GitOpsTopologyDetailPanel";
import { ResourceName } from "./gitopsShared";

const NODE_W = 148;
const NODE_H = 72;

type GitOpsTopologyViewProps = {
  graph: GitOpsTopoGraph;
  ariaLabel: string;
};

export default function GitOpsTopologyView({ graph, ariaLabel }: GitOpsTopologyViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(graph.rootId);
  const positions = useMemo(() => layoutTree(graph), [graph]);
  const bounds = useMemo(() => graphBounds(positions), [positions]);
  const selected = selectedId ? graph.nodes[selectedId] : null;
  const edges = useMemo(() => {
    return Object.values(graph.nodes)
      .filter((n) => n.parentId)
      .map((n) => {
        const parent = graph.nodes[n.parentId!];
        const from = positions.get(parent.id);
        const to = positions.get(n.id);
        if (!from || !to) return null;
        return {
          id: `${parent.id}->${n.id}`,
          x1: from.x + NODE_W / 2,
          y1: from.y + NODE_H,
          x2: to.x + NODE_W / 2,
          y2: to.y,
        };
      })
      .filter(Boolean) as { id: string; x1: number; y1: number; x2: number; y2: number }[];
  }, [graph, positions]);

  return (
    <Drawer isExpanded={Boolean(selected)} isInline>
      <DrawerContent panelContent={selected ? (
        <GitOpsTopologyDetailPanel
          node={selected}
          graph={graph}
          onClose={() => setSelectedId(null)}
          onSelectNode={setSelectedId}
        />
      ) : null}>
        <DrawerContentBody>
          <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
            <Content component="small" className="pf-v6-u-color-200">
              Select a node to open the topology sidebar (HPUX-1942 / GITOPS-9059). Drag is not required for this
              prototype — pan by scrolling the canvas.
            </Content>
            <div className="ocs-gitops-topo-canvas" role="img" aria-label={ariaLabel}>
              <svg
                className="ocs-gitops-topo-edges"
                width={bounds.width}
                height={bounds.height}
                aria-hidden
              >
                {edges.map((e) => (
                  <line
                    key={e.id}
                    x1={e.x1 - bounds.minX + 24}
                    y1={e.y1 - bounds.minY + 24}
                    x2={e.x2 - bounds.minX + 24}
                    y2={e.y2 - bounds.minY + 24}
                  />
                ))}
              </svg>
              <div
                className="ocs-gitops-topo-nodes"
                style={{ width: bounds.width, height: bounds.height }}
              >
                {Object.values(graph.nodes).map((node) => {
                  const pos = positions.get(node.id);
                  if (!pos) return null;
                  const isSelected = selectedId === node.id;
                  return (
                    <Button
                      key={node.id}
                      variant="plain"
                      className={`ocs-gitops-topo-node${isSelected ? " ocs-gitops-topo-node--selected" : ""}${
                        node.grouped ? " ocs-gitops-topo-node--grouped" : ""
                      }`}
                      style={{
                        left: pos.x - bounds.minX + 24,
                        top: pos.y - bounds.minY + 24,
                        width: NODE_W,
                        minHeight: NODE_H,
                      }}
                      onClick={() => setSelectedId(node.id)}
                      aria-pressed={isSelected}
                    >
                      <ResourceName kind={node.kind} name={node.name} />
                      {node.sync ? (
                        <span className="ocs-gitops-topo-node__status">{node.sync}</span>
                      ) : null}
                    </Button>
                  );
                })}
              </div>
            </div>
          </Flex>
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
}
