import { ToggleGroup, ToggleGroupItem } from "@patternfly/react-core";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import ProjectDiagramIcon from "@patternfly/react-icons/dist/esm/icons/project-diagram-icon";
import type { NodeNetworkViewMode } from "./nodeNetworkViewMode";

type NetworkViewToggleProps = {
  active: NodeNetworkViewMode;
  onChange: (mode: NodeNetworkViewMode) => void;
};

export default function NetworkViewToggle({ active, onChange }: NetworkViewToggleProps) {
  return (
    <ToggleGroup aria-label="Node network view mode" isCompact className="ocs-net-view-toggle">
      <ToggleGroupItem
        buttonId="node-network-view-topology"
        icon={<ProjectDiagramIcon aria-hidden />}
        aria-label="Topology view"
        isSelected={active === "topology"}
        onChange={(_event, selected) => {
          if (selected) onChange("topology");
        }}
      />
      <ToggleGroupItem
        buttonId="node-network-view-table"
        icon={<ListIcon aria-hidden />}
        aria-label="Table list view"
        isSelected={active === "table"}
        onChange={(_event, selected) => {
          if (selected) onChange("table");
        }}
      />
    </ToggleGroup>
  );
}
