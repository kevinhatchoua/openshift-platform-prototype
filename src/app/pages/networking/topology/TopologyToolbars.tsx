import { useState } from "react";
import {
  Button,
  Divider,
  Dropdown,
  Label,
  MenuToggle,
  Radio,
  Select,
  SelectList,
  SelectOption,
  Switch,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
} from "@patternfly/react-core";
import BookOpenIcon from "@patternfly/react-icons/dist/esm/icons/book-open-icon";
import FilterIcon from "@patternfly/react-icons/dist/esm/icons/filter-icon";
import QuestionCircleIcon from "@patternfly/react-icons/dist/esm/icons/question-circle-icon";
import { type NncProfile } from "../networkTopologyData";
import TopologyViewToggle from "../TopologyViewToggle";
import { NetworkResourceCreateDropdown, type NetworkCreateResource } from "../networkingCreateModals";
import type { NodeNetworkViewMode } from "../nodeNetworkViewMode";
import { filterOptionsForPerspective, TOPOLOGY_PERSPECTIVES, type TopologyPerspective, type TopologyResourceFilter } from "./topologyPerspective";
import { TOPOLOGY_LAYOUTS, type TopologyLayoutId } from "./topologyLayouts";
import TopologySearchFilter from "./TopologySearchFilter";
import type { TopologyQueryState } from "./topologyQueryFilter";


type UnifiedToolbarProps = {
  perspective: TopologyPerspective;
  onPerspectiveChange: (perspective: TopologyPerspective) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  queryState: TopologyQueryState;
  onQueryStateChange: (state: TopologyQueryState) => void;
  filterKind: TopologyResourceFilter;
  onFilterKindChange: (kind: TopologyResourceFilter) => void;
  filterCounts?: Partial<Record<TopologyResourceFilter, number>>;
  displayLabels: boolean;
  onDisplayLabelsChange: (value: boolean) => void;
  hideManagementPorts?: boolean;
  onHideManagementPortsChange?: (value: boolean) => void;
  pipesOnly?: boolean;
  onPipesOnlyChange?: (value: boolean) => void;
  topologyScale?: "compact" | "scale";
  onTopologyScaleChange?: (scale: "compact" | "scale") => void;
  layoutId: TopologyLayoutId;
  onLayoutIdChange: (layout: TopologyLayoutId) => void;
  onResetLayout?: () => void;
  viewMode: NodeNetworkViewMode;
  onViewModeChange?: (mode: NodeNetworkViewMode) => void;
  onShowShortcuts: () => void;
  showCreateActions?: boolean;
  isCreateEnabled: boolean;
  onCreateSelect: (resource: NetworkCreateResource) => void;
  showNncSwitcher: boolean;
  physicalNetworkName?: string;
  nncProfiles: NncProfile[];
  onPhysicalNetworkChange?: (name: string) => void;
  /** When true, skip wrapping Toolbar — PatternFly TopologyView already provides one. */
  embedded?: boolean;
  /** Split OCP Topology chrome: filters = context header, actions = view toolbar. */
  slot?: "filters" | "actions" | "all";
};

/**
 * Single OCP-style topology toolbar:
 * Left: Host | Workloads | Cluster · Filter by resource · Search
 * Right: Display options · View shortcuts · Topology/Table · Create
 */
export function TopologyUnifiedToolbar({
  perspective,
  onPerspectiveChange,
  searchTerm,
  onSearchTermChange,
  queryState,
  onQueryStateChange,
  filterKind,
  onFilterKindChange,
  filterCounts,
  displayLabels,
  onDisplayLabelsChange,
  hideManagementPorts = false,
  onHideManagementPortsChange,
  pipesOnly = false,
  onPipesOnlyChange,
  topologyScale,
  onTopologyScaleChange,
  layoutId,
  onLayoutIdChange,
  onResetLayout,
  viewMode,
  onViewModeChange,
  onShowShortcuts,
  isCreateEnabled,
  onCreateSelect,
  showCreateActions = true,
  showNncSwitcher,
  physicalNetworkName,
  nncProfiles,
  onPhysicalNetworkChange,
  embedded = false,
  slot = "all",
}: UnifiedToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const perspectiveMeta = TOPOLOGY_PERSPECTIVES.find((p) => p.id === perspective);
  const filterOptions = filterOptionsForPerspective(perspective);
  const selectedFilterLabel = filterOptions.find((option) => option.id === filterKind)?.label;
  const selectedFilterCount = filterKind !== "all" ? filterCounts?.[filterKind] : undefined;

  const renderFilterOption = (option: { id: TopologyResourceFilter; label: string }) => {
    const count = filterCounts?.[option.id] ?? 0;
    const isUnhealthy = option.id === "unhealthy";
    return (
      <span className="ocs-pf-topo-filter-option">
        <span>{option.label}</span>
        {count > 0 ? (
          <Label isCompact color={isUnhealthy ? "orange" : undefined} className="ocs-pf-topo-filter-option__count">
            {count}
          </Label>
        ) : null}
      </span>
    );
  };

  const filterGroup = (
      <ToolbarGroup variant="filter-group" className="ocs-pf-topo-toolbar-group ocs-pf-topo-view-toolbar__filters">
        <ToolbarItem>
          <Tooltip content={perspectiveMeta?.description ?? "Topology grouping level"}>
            <span>
              <Select
                isOpen={viewOpen}
                selected={perspective}
                onSelect={(_e, value) => {
                  onPerspectiveChange(value as TopologyPerspective);
                  setViewOpen(false);
                }}
                onOpenChange={setViewOpen}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setViewOpen((open) => !open)}
                    isExpanded={viewOpen}
                    aria-label={`View: ${perspectiveMeta?.label ?? perspective}`}
                  >
                    View: {perspectiveMeta?.label ?? perspective}
                  </MenuToggle>
                )}
              >
                <SelectList>
                  {TOPOLOGY_PERSPECTIVES.map((entry) => (
                    <SelectOption key={entry.id} value={entry.id} description={entry.description}>
                      {entry.label}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </span>
          </Tooltip>
        </ToolbarItem>
        <ToolbarItem>
          <Tooltip content="Filter resources shown in the current view">
            <span>
              <Select
                isOpen={filterOpen}
                selected={filterKind}
                onSelect={(_e, value) => {
                  onFilterKindChange(value as TopologyResourceFilter);
                  setFilterOpen(false);
                }}
                onOpenChange={setFilterOpen}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    icon={<FilterIcon />}
                    variant={filterKind !== "all" ? "primary" : "default"}
                    onClick={() => setFilterOpen((o) => !o)}
                    isExpanded={filterOpen}
                    aria-label={filterKind === "all" ? "Filter by..." : `Filter: ${selectedFilterLabel}`}
                  >
                    {filterKind === "all"
                      ? "Filter by..."
                      : selectedFilterCount && selectedFilterCount > 0
                        ? `${selectedFilterLabel} (${selectedFilterCount})`
                        : selectedFilterLabel}
                  </MenuToggle>
                )}
              >
                <SelectList>
                  <SelectOption value="all">All types</SelectOption>
                  {filterOptions.map((option) => (
                    <SelectOption key={option.id} value={option.id}>
                      {renderFilterOption(option)}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </span>
          </Tooltip>
        </ToolbarItem>
        <ToolbarItem className="ocs-pf-topo-search-filter-wrap">
          <TopologySearchFilter
            searchTerm={searchTerm}
            onSearchTermChange={onSearchTermChange}
            queryState={queryState}
            onQueryStateChange={onQueryStateChange}
          />
        </ToolbarItem>
        {showNncSwitcher && physicalNetworkName && onPhysicalNetworkChange ? (
          <ToolbarItem>
            <Select
              isOpen={profileOpen}
              selected={physicalNetworkName}
              onSelect={(_e, value) => {
                onPhysicalNetworkChange(String(value));
                setProfileOpen(false);
              }}
              onOpenChange={setProfileOpen}
              toggle={(toggleRef) => (
                <MenuToggle ref={toggleRef} onClick={() => setProfileOpen((o) => !o)} isExpanded={profileOpen}>
                  NNC: {physicalNetworkName}
                </MenuToggle>
              )}
            >
              <SelectList>
                {nncProfiles.map((profile) => (
                  <SelectOption key={profile.id} value={profile.physicalNetworkName}>
                    {profile.label}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </ToolbarItem>
        ) : null}
      </ToolbarGroup>
  );

  const viewActionGroup = (
      <ToolbarGroup className="ocs-pf-topo-toolbar-group ocs-pf-topo-view-toolbar__view-actions">
        <ToolbarItem>
          <Tooltip content="Configure layout, labels, and display settings">
            <span>
              <Dropdown
                isOpen={displayOpen}
                onOpenChange={setDisplayOpen}
                className="ocs-pf-topo-display-dropdown"
                popperProps={{ appendTo: () => document.body, position: "right" }}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    icon={<BookOpenIcon />}
                    onClick={() => setDisplayOpen((o) => !o)}
                    isExpanded={displayOpen}
                    className="ocs-pf-topo-display-toggle"
                  >
                    Display options
                  </MenuToggle>
                )}
              >
                <div className="ocs-pf-topo-display-menu" role="group" aria-label="Display options">
                  <Switch
                    id="topo-display-labels"
                    label="Show labels"
                    isChecked={displayLabels}
                    onChange={(_e, checked) => onDisplayLabelsChange(checked)}
                  />
                  {onHideManagementPortsChange ? (
                    <Switch
                      id="topo-display-hide-mgmt-ports"
                      label="Hide management ports"
                      description="Hide OVN management ports and Geneve tunnels"
                      isChecked={hideManagementPorts}
                      onChange={(_e, checked) => onHideManagementPortsChange(checked)}
                    />
                  ) : null}
                  {onPipesOnlyChange ? (
                    <Switch
                      id="topo-display-pipes-only"
                      label="Hide workloads"
                      description="Show network infrastructure only — hide Pods and VMs"
                      isChecked={pipesOnly}
                      onChange={(_e, checked) => onPipesOnlyChange(checked)}
                    />
                  ) : null}
                  {onTopologyScaleChange ? (
                    <Switch
                      id="topo-display-compact-scale"
                      label="Compact view"
                      aria-label="Compact view — fewer workers and networks for demos"
                      description={
                        topologyScale === "compact"
                          ? "Showing ~5 workers and ~4 logical networks"
                          : "Showing full-scale cluster (48 workers)"
                      }
                      isChecked={topologyScale === "compact"}
                      onChange={(_e, checked) => onTopologyScaleChange(checked ? "compact" : "scale")}
                    />
                  ) : null}
                  <Divider />
                  <div className="ocs-pf-topo-display-menu__section" id="topo-layout-heading">
                    Layout
                  </div>
                  {perspective !== "node" ? (
                    <p className="ocs-pf-topo-display-menu__hint">
                      Layout applies to the current {perspectiveMeta?.label ?? perspective} view.
                    </p>
                  ) : null}
                  <div className="ocs-pf-topo-display-menu__layouts" role="radiogroup" aria-labelledby="topo-layout-heading">
                    {TOPOLOGY_LAYOUTS.map((layout) => (
                      <Radio
                        key={layout.id}
                        id={`topo-layout-${layout.id}`}
                        name="topology-layout"
                        label={layout.label}
                        description={layout.description}
                        isChecked={layoutId === layout.id}
                        onChange={() => onLayoutIdChange(layout.id)}
                      />
                    ))}
                  </div>
                  {onResetLayout ? (
                    <>
                      <Divider />
                      <Button
                        variant="secondary"
                        isBlock
                        onClick={() => {
                          onResetLayout();
                          setDisplayOpen(false);
                        }}
                      >
                        Reset
                      </Button>
                    </>
                  ) : null}
                </div>
              </Dropdown>
            </span>
          </Tooltip>
        </ToolbarItem>
        <ToolbarItem>
          <Tooltip content="Keyboard shortcuts for topology navigation">
            <Button variant="link" icon={<QuestionCircleIcon />} onClick={onShowShortcuts}>
              View shortcuts
            </Button>
          </Tooltip>
        </ToolbarItem>
        {onViewModeChange ? (
          <ToolbarItem>
            <Tooltip content="Switch between topology graph and table list view">
              <span>
                <TopologyViewToggle currentView={viewMode} onChange={onViewModeChange} />
              </span>
            </Tooltip>
          </ToolbarItem>
        ) : null}
      </ToolbarGroup>
  );

  const createActionGroup = showCreateActions ? (
    <ToolbarGroup className="ocs-pf-topo-toolbar-group ocs-pf-topo-view-toolbar__create">
      <ToolbarItem>
        <Tooltip content="Create a networking resource">
          <span>
            <NetworkResourceCreateDropdown
              isDisabled={!isCreateEnabled}
              onSelect={onCreateSelect}
            />
          </span>
        </Tooltip>
      </ToolbarItem>
    </ToolbarGroup>
  ) : null;

  const items = slot === "filters" ? filterGroup : slot === "actions" ? (
    <>
      {viewActionGroup}
      {createActionGroup}
    </>
  ) : (
    <>
      {filterGroup}
      {viewActionGroup}
      {createActionGroup}
    </>
  );

  if (embedded) return items;
  return (
    <Toolbar className="ocs-pf-topo-unified-toolbar" aria-label="Topology">
      <ToolbarContent className="ocs-pf-topo-unified-toolbar__filters">{filterGroup}</ToolbarContent>
      <ToolbarContent className="ocs-pf-topo-unified-toolbar__actions">
        {viewActionGroup}
        {createActionGroup}
      </ToolbarContent>
    </Toolbar>
  );
}

/** @deprecated Use TopologyUnifiedToolbar — kept for any external imports during migration. */
export function TopologyContextToolbar(
  props: Partial<UnifiedToolbarProps> & {
    project?: string;
    onProjectChange?: (p: string) => void;
    networkScope?: string;
    onNetworkScopeChange?: (s: string) => void;
  }
) {
  void props;
  return null;
}

/** @deprecated Use TopologyUnifiedToolbar */
export function TopologyFilterToolbar(props: UnifiedToolbarProps) {
  return <TopologyUnifiedToolbar {...props} />;
}
