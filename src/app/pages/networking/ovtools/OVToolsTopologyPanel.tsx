import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import cytoscape, { type Core, type NodeSingular } from "cytoscape";
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
  FlexItem,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
  Title,
  ToggleGroup,
  ToggleGroupItem,
} from "@patternfly/react-core";
import ExpandIcon from "@patternfly/react-icons/dist/esm/icons/expand-icon";
import ProjectDiagramIcon from "@patternfly/react-icons/dist/esm/icons/project-diagram-icon";
import RedoIcon from "@patternfly/react-icons/dist/esm/icons/redo-icon";
import SearchPlusIcon from "@patternfly/react-icons/dist/esm/icons/search-plus-icon";
import SearchMinusIcon from "@patternfly/react-icons/dist/esm/icons/search-minus-icon";
import { buildOvtoolsTopologyElements, workerFilterOptions } from "./ovtoolsTopologyData";
import { OVTOOLS_CY_STYLES } from "./ovtoolsTopologyStyles";
import type { OvtoolsNodeKind } from "./ovtoolsTopologyTypes";
import { useOvtoolsTopologyState } from "./useOvtoolsTopologyState";

const KIND_LABELS: Record<OvtoolsNodeKind, string> = {
  node: "Node",
  vm: "Virtual machine",
  nad: "NetworkAttachmentDefinition",
  udn: "UserDefinedNetwork",
  storageclass: "StorageClass",
  pvc: "PersistentVolumeClaim",
};

export default function OVToolsTopologyPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const { mode, setMode, filters, setFilters } = useOvtoolsTopologyState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nodeFilterOpen, setNodeFilterOpen] = useState(false);
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const elements = useMemo(() => buildOvtoolsTopologyElements(mode, filters), [mode, filters]);
  const workerOptions = useMemo(() => workerFilterOptions(), []);

  const selectedData = useMemo(() => {
    if (!selectedId || !cyRef.current) return null;
    const node = cyRef.current.getElementById(selectedId);
    if (!node.nonempty()) return null;
    return node.data() as Record<string, string | undefined>;
  }, [selectedId, elements]);

  const runLayout = useCallback((cy: Core) => {
    const layoutName = mode === "overview" ? "cose" : "cose";
    cy.layout({
      name: layoutName,
      animate: true,
      animationDuration: 420,
      padding: 48,
      nodeRepulsion: () => 9000,
      idealEdgeLength: () => 110,
      gravity: 0.25,
    }).run();
  }, [mode]);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: OVTOOLS_CY_STYLES,
      minZoom: 0.2,
      maxZoom: 2.5,
      wheelSensitivity: 0.2,
      boxSelectionEnabled: false,
    });
    cyRef.current = cy;

    cy.on("tap", "node", (event) => {
      const node = event.target as NodeSingular;
      setSelectedId(node.id());
    });
    cy.on("tap", (event) => {
      if (event.target === cy) setSelectedId(null);
    });
    cy.on("mouseover", "node", (event) => {
      const node = event.target as NodeSingular;
      setHoveredId(node.id());
      highlightNeighborhood(cy, node);
    });
    cy.on("mouseout", "node", () => {
      setHoveredId(null);
      clearHighlight(cy);
    });

    runLayout(cy);

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [elements, runLayout]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;
    runLayout(cy);
  }, [mode, runLayout]);

  const resetView = () => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;
    runLayout(cy);
    cy.fit(undefined, 56);
  };

  const zoomBy = (factor: number) => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;
    cy.zoom({ level: cy.zoom() * factor });
    cy.center();
  };

  const fitView = () => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;
    cy.fit(undefined, 56);
  };

  return (
    <div className="ocs-ovtools-topo">
      <div className="ocs-ovtools-topo__toolbar">
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
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

          <Select
            id="ovtools-topo-vm-status"
            aria-label="Filter by VM status"
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
                {OVTOOLS_VM_STATUS_OPTIONS.find((option) => option.value === filters.vmStatus)?.label ?? "All VM statuses"}
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

          <SearchInput
            className="ocs-ovtools-topo__search"
            placeholder="Search resources..."
            value={filters.search}
            onChange={(_event, value) => setFilters({ search: value })}
            onClear={() => setFilters({ search: "" })}
            aria-label="Search topology"
          />

          <FlexItem flex={{ default: "flex_1" }} />

          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }} className="ocs-ovtools-topo__zoom">
            <Button variant="secondary" icon={<RedoIcon aria-hidden />} onClick={resetView}>
              Reset view
            </Button>
            <Button variant="plain" aria-label="Zoom in" icon={<SearchPlusIcon aria-hidden />} onClick={() => zoomBy(1.15)} />
            <Button variant="plain" aria-label="Zoom out" icon={<SearchMinusIcon aria-hidden />} onClick={() => zoomBy(0.87)} />
            <Button variant="plain" aria-label="Fit to screen" icon={<ExpandIcon aria-hidden />} onClick={fitView} />
          </Flex>
        </Flex>
      </div>

      <Drawer isExpanded={Boolean(selectedData)} isInline position="end">
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
                    <DrawerCloseButton onClose={() => setSelectedId(null)} />
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
              {hoveredId ? (
                <Content component="small" className="ocs-ovtools-topo__hover-hint" aria-live="polite">
                  Highlighting connections for selected resource
                </Content>
              ) : null}
            </div>
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function highlightNeighborhood(cy: Core, node: NodeSingular) {
  cy.elements().addClass("faded");
  node.removeClass("faded");
  node.addClass("highlighted");
  node.neighborhood().removeClass("faded");
}

function clearHighlight(cy: Core) {
  cy.elements().removeClass("faded highlighted hover");
}
