import { ToggleGroup, ToggleGroupItem } from "@patternfly/react-core";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import ProjectDiagramIcon from "@patternfly/react-icons/dist/esm/icons/project-diagram-icon";
import type { NodeNetworkViewMode } from "./nodeNetworkViewMode";

type TopologyViewToggleProps = {
  currentView: NodeNetworkViewMode;
  onChange: (mode: NodeNetworkViewMode) => void;
};

export default function TopologyViewToggle({ currentView, onChange }: TopologyViewToggleProps) {
  return (
    <ToggleGroup aria-label="Node network view mode" isCompact className="ocs-net-view-toggle">
      <ToggleGroupItem
        buttonId="node-network-view-topology"
        icon={<ProjectDiagramIcon aria-hidden />}
        aria-label="Topology view"
        isSelected={currentView === "topology"}
        onChange={(_event, selected) => {
          if (selected) onChange("topology");
        }}
      />
      <ToggleGroupItem
        buttonId="node-network-view-table"
        icon={<ListIcon aria-hidden />}
        aria-label="Table list view"
        isSelected={currentView === "table"}
        onChange={(_event, selected) => {
          if (selected) onChange("table");
        }}
      />
    </ToggleGroup>
  );
}
