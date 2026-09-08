import { Tooltip } from "@patternfly/react-core";
import { TOPOLOGY_PERSPECTIVES, type TopologyPerspective } from "./topologyPerspective";

type TopologyPerspectiveRailProps = {
  perspective: TopologyPerspective;
  onPerspectiveChange: (perspective: TopologyPerspective) => void;
};

export default function TopologyPerspectiveRail({
  perspective,
  onPerspectiveChange,
}: TopologyPerspectiveRailProps) {
  return (
    <nav className="ocs-pf-topo-perspective-rail" aria-label="Topology perspective">
      <ol className="ocs-pf-topo-perspective-rail__list">
        {TOPOLOGY_PERSPECTIVES.map((entry, index) => {
          const selected = perspective === entry.id;
          return (
            <li key={entry.id} className="ocs-pf-topo-perspective-rail__item">
              {index > 0 ? <span className="ocs-pf-topo-perspective-rail__connector" aria-hidden /> : null}
              <Tooltip content={entry.description}>
                <button
                  type="button"
                  className={`ocs-pf-topo-perspective-rail__button${selected ? " ocs-pf-topo-perspective-rail__button--selected" : ""}`}
                  aria-current={selected ? "step" : undefined}
                  onClick={() => onPerspectiveChange(entry.id)}
                >
                  <span className="ocs-pf-topo-perspective-rail__marker" aria-hidden />
                  <span className="ocs-pf-topo-perspective-rail__label">{entry.label}</span>
                </button>
              </Tooltip>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
