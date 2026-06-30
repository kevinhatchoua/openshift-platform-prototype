import { useCallback, useRef, useState, type ReactNode } from "react";
import { Split, SplitItem } from "@patternfly/react-core/dist/esm/layouts/Split";
import {
  readTopologySplitWidth,
  TOPOLOGY_SPLIT_MAX_WIDTH_RATIO,
  TOPOLOGY_SPLIT_MIN_WIDTH,
  writeTopologySplitWidth,
} from "./topologyCanvasLayout";

type TopologyResizableSplitProps = {
  isPanelOpen: boolean;
  panel: ReactNode;
  children: ReactNode;
};

export default function TopologyResizableSplit({ isPanelOpen, panel, children }: TopologyResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(readTopologySplitWidth);
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);

  const clampWidth = useCallback((width: number) => {
    const containerWidth = containerRef.current?.clientWidth ?? 1200;
    const maxWidth = Math.max(TOPOLOGY_SPLIT_MIN_WIDTH, containerWidth * TOPOLOGY_SPLIT_MAX_WIDTH_RATIO);
    return Math.min(maxWidth, Math.max(TOPOLOGY_SPLIT_MIN_WIDTH, width));
  }, []);

  const handleSplitterPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    dragState.current = { startX: event.clientX, startWidth: leftWidth };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

    const onPointerMove = (e: PointerEvent) => {
      if (!dragState.current) return;
      const delta = e.clientX - dragState.current.startX;
      setLeftWidth(clampWidth(dragState.current.startWidth + delta));
    };

    const onPointerUp = () => {
      dragState.current = null;
      setLeftWidth((current) => {
        const clamped = clampWidth(current);
        writeTopologySplitWidth(clamped);
        return clamped;
      });
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  return (
    <div
      ref={containerRef}
      className={`ocs-net-topo-split${isPanelOpen ? " ocs-net-topo-split--open" : ""}`}
    >
      <Split className="ocs-net-topo-split__layout" hasGutter={false}>
        {isPanelOpen ? (
          <SplitItem
            className="ocs-net-topo-split__panel"
            style={{ width: leftWidth, minWidth: TOPOLOGY_SPLIT_MIN_WIDTH, maxWidth: "55%" }}
          >
            <div className="ocs-net-topo-split__panel-inner">{panel}</div>
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize configuration panel"
              aria-valuenow={leftWidth}
              tabIndex={0}
              className="ocs-net-topo-split__handle"
              onPointerDown={handleSplitterPointerDown}
            />
          </SplitItem>
        ) : null}
        <SplitItem isFilled className="ocs-net-topo-split__viewport">
          {children}
        </SplitItem>
      </Split>
    </div>
  );
}
