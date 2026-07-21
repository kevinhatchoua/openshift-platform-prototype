import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Flex,
  Label,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
  Switch,
  Title,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import ExpandIcon from "@patternfly/react-icons/dist/esm/icons/expand-icon";
import ProjectDiagramIcon from "@patternfly/react-icons/dist/esm/icons/project-diagram-icon";
import RedoIcon from "@patternfly/react-icons/dist/esm/icons/redo-icon";
import SearchPlusIcon from "@patternfly/react-icons/dist/esm/icons/search-plus-icon";
import SearchMinusIcon from "@patternfly/react-icons/dist/esm/icons/search-minus-icon";
import { buildOvtoolsTopologyElements, workerFilterOptions } from "./ovtoolsTopologyData";
import { createCytoscapeEngine } from "./ovtoolsCytoscapeEngine";
import { OVTOOLS_CY_STYLES } from "./ovtoolsTopologyStyles";
import {
  OVTOOLS_NAMESPACE_OPTIONS,
  OVTOOLS_RESOURCE_TYPE_OPTIONS,
  OVTOOLS_TOPO_MODES,
  OVTOOLS_VM_STATUS_OPTIONS,
  type OvtoolsNodeKind,
  type OvtoolsTopologyFilters,
} from "./ovtoolsTopologyTypes";
import { useOvtoolsTopologyState } from "./useOvtoolsTopologyState";
import { TopologyMetricTooltip } from "../topology/TopologyMetricTooltip";
import { useTopologyMetrics } from "../topology/topologyMetricsService";
import {
  TOPOLOGY_SCALE_PRESETS,
  useTopologyDeveloperMode,
} from "../topology/topologyDeveloperMode";

const KIND_LABELS: Record<OvtoolsNodeKind, string> = {
  node: "Node",
  vm: "Virtual machine",
  nad: "NetworkAttachmentDefinition",
  udn: "UserDefinedNetwork",
  storageclass: "StorageClass",
  pvc: "PersistentVolumeClaim",
  cluster: "NAD cluster",
};

export default function OVToolsTopologyPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ReturnType<typeof createCytoscapeEngine> | null>(null);
  const { mode, setMode, filters, setFilters } = useOvtoolsTopologyState();
  const { enabled: developerMode, scaleTarget, setEnabled: setDeveloperMode, setScaleTarget } =
    useTopologyDeveloperMode();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nodeFilterOpen, setNodeFilterOpen] = useState(false);
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [namespaceFilterOpen, setNamespaceFilterOpen] = useState(false);
  const [resourceTypeFilterOpen, setResourceTypeFilterOpen] = useState(false);
  const [scaleSelectOpen, setScaleSelectOpen] = useState(false);
  const [hoverTarget, setHoverTarget] = useState<{
    id: string;
    kind: string;
    label: string;
    x: number;
    y: number;
  } | null>(null);

  const elements = useMemo(
    () => buildOvtoolsTopologyElements(mode, filters),
    [mode, filters, developerMode, scaleTarget]
  );
  const workerOptions = useMemo(() => workerFilterOptions(), []);

  const selectedData = useMemo(() => {
    if (!selectedId || !engineRef.current?.cy || engineRef.current.cy.destroyed()) return null;
    const node = engineRef.current.cy.getElementById(selectedId);
    if (!node.nonempty()) return null;
    return node.data() as Record<string, string | undefined>;
  }, [selectedId, elements]);

  const hoverMetrics = useTopologyMetrics(
    hoverTarget?.id ?? null,
    hoverTarget?.kind,
    hoverTarget?.label
  );

  const renderCytoscapeCanvas = useCallback(() => {
    if (!containerRef.current) return;
    engineRef.current?.destroy();
    const engine = createCytoscapeEngine({
      container: containerRef.current,
      elements,
      styles: OVTOOLS_CY_STYLES,
      layoutProfile: mode,
      handlers: {
        onNodeTap: setSelectedId,
        onCanvasTap: () => setSelectedId(null),
        onNodeHover: (nodeId, position) => {
          if (!nodeId || !position) {
            setHoverTarget(null);
            return;
          }
          const node = engineRef.current?.cy.getElementById(nodeId);
          const data = node?.data() as Record<string, string | undefined> | undefined;
          const rect = containerRef.current?.getBoundingClientRect();
          setHoverTarget({
            id: nodeId,
            kind: data?.kind ?? "node",
            label: data?.label ?? nodeId,
            x: (rect?.left ?? 0) + position.x + 12,
            y: (rect?.top ?? 0) + position.y + 12,
          });
        },
      },
    });
    engineRef.current = engine;
    engine.runLayout();
    engine.fit();
    engine.collapseAllClusters();
  }, [elements, mode]);

  useEffect(() => {
    renderCytoscapeCanvas();
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [renderCytoscapeCanvas]);

  useEffect(() => {
    engineRef.current?.runLayout();
  }, [mode]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || engine.cy.destroyed()) return;
    const timer = window.setTimeout(() => engine.relayoutAfterResize(), 320);
    return () => window.clearTimeout(timer);
  }, [selectedId]);

  const scheduleCanvasResize = useCallback(() => {
    window.setTimeout(() => {
      const engine = engineRef.current;
      if (!engine || engine.cy.destroyed()) return;
      engine.relayoutAfterResize();
    }, 250);
  }, []);

  const resetView = () => {
    const engine = engineRef.current;
    if (!engine || engine.cy.destroyed()) return;
    engine.runLayout();
    engine.fit();
  };

  const zoomBy = (factor: number) => engineRef.current?.zoomBy(factor);
  const fitView = () => engineRef.current?.fit();

  const clearFilters = () =>
    setFilters({
      nodeId: "all",
      vmStatus: "all",
      search: "",
      namespace: "all",
      resourceType: "all",
      showProblemsOnly: false,
    } satisfies Partial<OvtoolsTopologyFilters>);

  const nameLabels = filters.search.trim() ? [filters.search.trim()] : [];
  const statusLabels = filters.vmStatus !== "all" ? [filters.vmStatus] : [];
  const namespaceLabels = filters.namespace !== "all" ? [filters.namespace] : [];
  const resourceTypeLabels =
    filters.resourceType !== "all"
      ? [OVTOOLS_RESOURCE_TYPE_OPTIONS.find((o) => o.value === filters.resourceType)?.label ?? filters.resourceType]
      : [];

  return (
    <div className="ocs-ovtools-topo">
      {/* ... existing OCP PageShell and Masthead components ... */}
      <div className="ocs-ovtools-topo__toolbar">
        <Toolbar id="ovtools-topo-toolbar" clearAllFilters={clearFilters}>
          <ToolbarContent>
            <ToolbarItem>
              <Label color="purple" isCompact>
                Phase 2
              </Label>
            </ToolbarItem>
            <ToolbarItem>
              <ToggleGroup aria-label="Topology perspective" isCompact className="ocs-ovtools-topo__modes">
                {OVTOOLS_TOPO_MODES.map((entry) => (
                  <ToggleGroupItem
                    key={entry.id}
                    buttonId={`ovtools-topo-${entry.id}`}
                    isSelected={mode === entry.id}
                    text={entry.label}
                    onChange={(_event, selected) => {
                      if (selected) setMode(entry.id);
                    }}
                  />
                ))}
              </ToggleGroup>
            </ToolbarItem>

            <ToolbarGroup variant="filter-group">
              <ToolbarFilter
                categoryName="Name"
                labels={nameLabels}
                deleteLabel={() => setFilters({ search: "" })}
                deleteLabelGroup={() => setFilters({ search: "" })}
              >
                <SearchInput
                  className="ocs-ovtools-topo__search"
                  placeholder="Filter by name..."
                  value={filters.search}
                  onChange={(_event, value) => setFilters({ search: value })}
                  onClear={() => setFilters({ search: "" })}
                  aria-label="Filter topology by name"
                />
              </ToolbarFilter>

              <ToolbarFilter
                categoryName="Status"
                labels={statusLabels}
                deleteLabel={() => setFilters({ vmStatus: "all" })}
                deleteLabelGroup={() => setFilters({ vmStatus: "all" })}
              >
                <Select
                  id="ovtools-topo-vm-status"
                  aria-label="Filter by status"
                  selected={filters.vmStatus}
                  isOpen={statusFilterOpen}
                  onOpenChange={setStatusFilterOpen}
                  onSelect={(_event, value) => {
                    setFilters({ vmStatus: String(value) });
                    setStatusFilterOpen(false);
                  }}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setStatusFilterOpen((open) => !open)}
                      isExpanded={statusFilterOpen}
                    >
                      {OVTOOLS_VM_STATUS_OPTIONS.find((option) => option.value === filters.vmStatus)?.label ?? "Status"}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {OVTOOLS_VM_STATUS_OPTIONS.map((option) => (
                      <SelectOption key={option.value} value={option.value}>
                        {option.label}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarFilter>

              <ToolbarFilter
                categoryName="Namespace"
                labels={namespaceLabels}
                deleteLabel={() => setFilters({ namespace: "all" })}
                deleteLabelGroup={() => setFilters({ namespace: "all" })}
              >
                <Select
                  id="ovtools-topo-namespace"
                  aria-label="Filter by namespace"
                  selected={filters.namespace}
                  isOpen={namespaceFilterOpen}
                  onOpenChange={setNamespaceFilterOpen}
                  onSelect={(_event, value) => {
                    setFilters({ namespace: String(value) });
                    setNamespaceFilterOpen(false);
                  }}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setNamespaceFilterOpen((open) => !open)}
                      isExpanded={namespaceFilterOpen}
                    >
                      {OVTOOLS_NAMESPACE_OPTIONS.find((option) => option.value === filters.namespace)?.label ??
                        "Namespace"}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {OVTOOLS_NAMESPACE_OPTIONS.map((option) => (
                      <SelectOption key={option.value} value={option.value}>
                        {option.label}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarFilter>

              <ToolbarFilter
                categoryName="Resource type"
                labels={resourceTypeLabels}
                deleteLabel={() => setFilters({ resourceType: "all" })}
                deleteLabelGroup={() => setFilters({ resourceType: "all" })}
              >
                <Select
                  id="ovtools-topo-resource-type"
                  aria-label="Filter by resource type"
                  selected={filters.resourceType}
                  isOpen={resourceTypeFilterOpen}
                  onOpenChange={setResourceTypeFilterOpen}
                  onSelect={(_event, value) => {
                    setFilters({ resourceType: String(value) as OvtoolsTopologyFilters["resourceType"] });
                    setResourceTypeFilterOpen(false);
                  }}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setResourceTypeFilterOpen((open) => !open)}
                      isExpanded={resourceTypeFilterOpen}
                    >
                      {OVTOOLS_RESOURCE_TYPE_OPTIONS.find((option) => option.value === filters.resourceType)?.label ??
                        "Resource type"}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {OVTOOLS_RESOURCE_TYPE_OPTIONS.map((option) => (
                      <SelectOption key={option.value} value={option.value}>
                        {option.label}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarFilter>
            </ToolbarGroup>

            <ToolbarItem>
              <Select
                id="ovtools-topo-node-filter"
                aria-label="Filter by node"
                selected={filters.nodeId}
                isOpen={nodeFilterOpen}
                onOpenChange={setNodeFilterOpen}
                onSelect={(_event, value) => {
                  setFilters({ nodeId: String(value) });
                  setNodeFilterOpen(false);
                }}
                toggle={(toggleRef) => (
                  <MenuToggle ref={toggleRef} onClick={() => setNodeFilterOpen((open) => !open)} isExpanded={nodeFilterOpen}>
                    {workerOptions.find((option) => option.value === filters.nodeId)?.label ?? "All nodes"}
                  </MenuToggle>
                )}
              >
                <SelectList>
                  {workerOptions.map((option) => (
                    <SelectOption key={option.value} value={option.value}>
                      {option.label}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </ToolbarItem>

            <ToolbarItem>
              <Switch
                id="ovtools-topo-problems-only"
                label="Network problems only"
                isChecked={filters.showProblemsOnly}
                onChange={(_event, checked) => setFilters({ showProblemsOnly: checked })}
              />
            </ToolbarItem>

            <ToolbarItem>
              <Switch
                id="ovtools-topo-developer-mode"
                label="Developer mode"
                isChecked={developerMode}
                onChange={(_event, checked) => setDeveloperMode(checked)}
              />
            </ToolbarItem>

            {developerMode ? (
              <ToolbarItem>
                <Select
                  id="ovtools-topo-scale-target"
                  aria-label="Scale mock target"
                  selected={String(scaleTarget)}
                  isOpen={scaleSelectOpen}
                  onOpenChange={setScaleSelectOpen}
                  onSelect={(_event, value) => {
                    setScaleTarget(Number(value));
                    setScaleSelectOpen(false);
                  }}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setScaleSelectOpen((open) => !open)}
                      isExpanded={scaleSelectOpen}
                    >
                      {scaleTarget.toLocaleString()} NADs
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {TOPOLOGY_SCALE_PRESETS.map((preset) => (
                      <SelectOption key={preset} value={String(preset)}>
                        {preset.toLocaleString()} NADs
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarItem>
            ) : null}

            <ToolbarGroup align={{ default: "alignEnd" }}>
              <ToolbarItem>
                <Button variant="secondary" icon={<RedoIcon aria-hidden />} onClick={resetView}>
                  Reset view
                </Button>
              </ToolbarItem>
              <ToolbarItem>
                <Button
                  variant="plain"
                  aria-label="Zoom in"
                  icon={<SearchPlusIcon aria-hidden />}
                  onClick={() => zoomBy(1.15)}
                />
              </ToolbarItem>
              <ToolbarItem>
                <Button
                  variant="plain"
                  aria-label="Zoom out"
                  icon={<SearchMinusIcon aria-hidden />}
                  onClick={() => zoomBy(0.87)}
                />
              </ToolbarItem>
              <ToolbarItem>
                <Button
                  variant="plain"
                  aria-label="Fit to screen"
                  icon={<ExpandIcon aria-hidden />}
                  onClick={fitView}
                />
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
        <Content component="small" className="ocs-ovtools-topo__hover-hint">
          Graph topology (not tree view) · click clusters to expand · double-click to collapse · hover for metrics ·
          keep graphs simple at scale — collapse clusters before enabling Developer mode
        </Content>
      </div>

      <Drawer
        isExpanded={Boolean(selectedData)}
        isInline
        position="end"
        onExpand={scheduleCanvasResize}
      >
        <DrawerContent
          panelContent={
            selectedData ? (
              <DrawerPanelContent widths={{ default: "width_33" }} className="ocs-ovtools-topo__drawer">
                <DrawerHead>
                  <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }}>
                    <ProjectDiagramIcon aria-hidden className="ocs-ovtools-topo__drawer-icon" />
                    <Title headingLevel="h3" size="md">
                      {selectedData.label}
                    </Title>
                  </Flex>
                  <DrawerActions>
                    <DrawerCloseButton
                      onClose={() => {
                        setSelectedId(null);
                        scheduleCanvasResize();
                      }}
                    />
                  </DrawerActions>
                </DrawerHead>
                <DrawerPanelBody>
                  <DescriptionList isCompact>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Type</DescriptionListTerm>
                      <DescriptionListDescription>
                        {KIND_LABELS[(selectedData.kind as OvtoolsNodeKind) ?? "vm"]}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    {selectedData.namespace ? (
                      <DescriptionListGroup>
                        <DescriptionListTerm>Namespace</DescriptionListTerm>
                        <DescriptionListDescription>{selectedData.namespace}</DescriptionListDescription>
                      </DescriptionListGroup>
                    ) : null}
                    {selectedData.hostname ? (
                      <DescriptionListGroup>
                        <DescriptionListTerm>Hostname</DescriptionListTerm>
                        <DescriptionListDescription>{selectedData.hostname}</DescriptionListDescription>
                      </DescriptionListGroup>
                    ) : null}
                    {selectedData.status ? (
                      <DescriptionListGroup>
                        <DescriptionListTerm>Status</DescriptionListTerm>
                        <DescriptionListDescription>{selectedData.status}</DescriptionListDescription>
                      </DescriptionListGroup>
                    ) : null}
                    {selectedData.detail ? (
                      <DescriptionListGroup>
                        <DescriptionListTerm>Detail</DescriptionListTerm>
                        <DescriptionListDescription>{selectedData.detail}</DescriptionListDescription>
                      </DescriptionListGroup>
                    ) : null}
                  </DescriptionList>
                </DrawerPanelBody>
              </DrawerPanelContent>
            ) : undefined
          }
        >
          <DrawerContentBody className="ocs-ovtools-topo__stage-body">
            <div className="ocs-ovtools-topo__canvas-wrap">
              <div ref={containerRef} className="ocs-ovtools-topo__canvas" role="application" aria-label="OVTools topology graph" />
              {elements.length === 0 ? (
                <Content component="p" className="ocs-ovtools-topo__empty">
                  No resources match the current filters.
                </Content>
              ) : null}
            </div>
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>

      {hoverTarget && hoverMetrics ? (
        <TopologyMetricTooltip metrics={hoverMetrics} x={hoverTarget.x} y={hoverTarget.y} />
      ) : null}
      {/* ... remaining dashboard metrics and side drawer panels ... */}
    </div>
  );
}
