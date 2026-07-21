import { useCallback, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  Icon,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Pagination,
  PaginationVariant,
  Title,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
} from "@patternfly/react-data-view";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import PlusCircleIcon from "@patternfly/react-icons/dist/esm/icons/plus-circle-icon";
import { Tbody, Td, Th, Thead, Tr, InnerScrollContainer, Table } from "@patternfly/react-table";
import { Columns2 } from "@/lib/pfIcons";
import { IoDataViewFiltersWithMidActions } from "../dataView/IoDataViewFiltersWithMidActions";
import {
  OCS_PROTOTYPE_DATAVIEW_CLASS,
  OCS_PROTOTYPE_TOOLBAR_CLASS,
  OcsPrototypeListTable,
  PlainTableHeader,
  SortableTableHeader,
  compareStrings,
  useListPagination,
  useTableSort,
  type SortDirection,
} from "../dataView/OcsPrototypeListTable";
import {
  attachVmToNetwork,
  detachVmFromNetwork,
  getAllVirtualMachines,
  getAttachedVmsForNetwork,
  getAvailableVmsForNetwork,
  getVirtualMachine,
  networkDisplayName,
  type AttachedVmRow,
  type NetworkResourceRef,
  type VirtualMachineRecord,
  vmDetailPath,
} from "../../pages/networking/networkingMockData";

const MAX_VISIBLE_COLUMNS = 10;

type VmDataColumnId =
  | "name"
  | "status"
  | "conditions"
  | "node"
  | "ipAddress"
  | "namespace"
  | "created"
  | "memory"
  | "cpu"
  | "network"
  | "deletionProtection"
  | "storageClass";

type VmColumnDef = {
  id: VmDataColumnId;
  label: string;
  isDefault?: boolean;
  isMandatory?: boolean;
  isAdditional?: boolean;
  isNamespaceOnly?: boolean;
  sortable?: boolean;
};

const VM_TABLE_COLUMNS: VmColumnDef[] = [
  { id: "name", label: "Name", isDefault: true, isMandatory: true, sortable: true },
  { id: "status", label: "Status", isDefault: true, sortable: true },
  { id: "conditions", label: "Conditions", isDefault: true },
  { id: "node", label: "Node", isDefault: true, sortable: true },
  { id: "ipAddress", label: "IP address", isDefault: true },
  { id: "created", label: "Created", isAdditional: true },
  { id: "memory", label: "Memory", isAdditional: true },
  { id: "cpu", label: "CPU", isAdditional: true },
  { id: "network", label: "Network", isAdditional: true },
  { id: "deletionProtection", label: "Deletion protection", isAdditional: true },
  { id: "storageClass", label: "Storage class", isAdditional: true },
  { id: "namespace", label: "Namespace", isAdditional: true, isNamespaceOnly: true, sortable: true },
];

const DEFAULT_MANAGE_COLUMNS = VM_TABLE_COLUMNS.filter((c) => c.isDefault && !c.isMandatory);
const ADDITIONAL_MANAGE_COLUMNS = VM_TABLE_COLUMNS.filter((c) => c.isAdditional && !c.isNamespaceOnly);

const RESTORE_DEFAULT_VISIBLE: Record<VmDataColumnId, boolean> = {
  name: true,
  status: true,
  conditions: true,
  node: true,
  ipAddress: true,
  namespace: false,
  created: false,
  memory: false,
  cpu: false,
  network: false,
  deletionProtection: false,
  storageClass: false,
};

const manageColRowStyle = (withDivider: boolean): CSSProperties => ({
  paddingBlock: "var(--pf-t--global--spacer--sm)",
  ...(withDivider ? { borderBottom: "1px solid var(--pf-t--global--border--color--default)" } : {}),
});

type VmFilters = { name: string };
type AddVmFilters = { name: string };
type SortColumn = "name" | "namespace" | "status" | "node";
type AddVmSortColumn = "name" | "namespace" | "status";

function vmKey(vm: { name: string; namespace: string }) {
  return `${vm.namespace}/${vm.name}`;
}

function rowMatches(row: AttachedVmRow, filters: VmFilters): boolean {
  const q = (filters.name ?? "").trim().toLowerCase();
  return !q || row.vmName.toLowerCase().includes(q);
}

function countVisibleColumns(
  visible: Record<VmDataColumnId, boolean>,
  showNamespaceColumn: boolean
): number {
  return VM_TABLE_COLUMNS.filter((col) => {
    if (col.isNamespaceOnly && !showNamespaceColumn) return false;
    return visible[col.id];
  }).length;
}

function sortRows(rows: AttachedVmRow[], column: SortColumn, direction: SortDirection): AttachedVmRow[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.vmName, b.vmName, direction);
      case "namespace":
        return compareStrings(a.vmNamespace, b.vmNamespace, direction);
      case "status":
        return compareStrings(a.status, b.status, direction);
      case "node": {
        const nodeA = getVirtualMachine(a.vmNamespace, a.vmName)?.node ?? "";
        const nodeB = getVirtualMachine(b.vmNamespace, b.vmName)?.node ?? "";
        return compareStrings(nodeA, nodeB, direction);
      }
      default:
        return 0;
    }
  });
}

function VmStatusCell({ status }: { status: string }) {
  const isError = status.toLowerCase().includes("error");
  return (
    <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
      <Icon status={isError ? "warning" : "custom"} aria-hidden>
        <ExclamationCircleIcon />
      </Icon>
      <Button variant="link" isInline className="ocs-vm-status-link">
        {status}
      </Button>
    </Flex>
  );
}

function VmConditionsCell({ conditions }: { conditions: VirtualMachineRecord["conditions"] }) {
  if (!conditions?.length) return <>—</>;
  return (
    <Flex gap={{ default: "gapXs" }} flexWrap={{ default: "wrap" }}>
      {conditions.map((c) => (
        <Label key={`${c.type}-${c.status}`} color="grey" isCompact>
          {`${c.type}=${c.status}`}
        </Label>
      ))}
    </Flex>
  );
}

export function NetworkVirtualMachinesTab({
  networkRef,
  networkName,
  onAttachmentsChange,
  showNamespaceColumn = false,
}: {
  networkRef: NetworkResourceRef;
  networkName: string;
  onAttachmentsChange?: () => void;
  /** When true (All projects), namespace column is eligible for display. */
  showNamespaceColumn?: boolean;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AttachedVmRow | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isManageColumnsModalOpen, setIsManageColumnsModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<VmDataColumnId, boolean>>(
    () => ({ ...RESTORE_DEFAULT_VISIBLE })
  );
  const [columnModalDraft, setColumnModalDraft] = useState<Record<VmDataColumnId, boolean>>(
    () => ({ ...RESTORE_DEFAULT_VISIBLE })
  );

  const attached = useMemo(
    () => getAttachedVmsForNetwork(networkRef),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [networkRef, refreshKey]
  );

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<VmFilters>({ filters: { name: "" } });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");

  const filtered = useMemo(() => attached.filter((r) => rowMatches(r, filters)), [attached, filters]);
  const sorted = useMemo(() => sortRows(filtered, sortColumn, sortDirection), [filtered, sortColumn, sortDirection]);
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sorted, [filters], 20);

  const visibleOrderedColumns = useMemo(
    () =>
      VM_TABLE_COLUMNS.filter((col) => {
        if (col.isNamespaceOnly && !showNamespaceColumn) return false;
        return visibleColumns[col.id];
      }),
    [visibleColumns, showNamespaceColumn]
  );

  const renderColumnHeader = (col: VmColumnDef) => {
    if (col.sortable && col.id !== "namespace") {
      return (
        <SortableTableHeader
          label={col.label}
          column={col.id as SortColumn}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={toggleSort}
        />
      );
    }
    if (col.id === "namespace" && col.sortable) {
      return (
        <SortableTableHeader
          label={col.label}
          column="namespace"
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={toggleSort}
        />
      );
    }
    return <PlainTableHeader label={col.label} />;
  };

  const available = useMemo(
    () => getAvailableVmsForNetwork(networkRef),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [networkRef, refreshKey]
  );

  const renderColumnCell = (colId: VmDataColumnId, row: AttachedVmRow, vm: VirtualMachineRecord | undefined): ReactNode => {
    switch (colId) {
      case "name":
        return (
          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
            <Label color="blue" isCompact className="ocs-resource-label">
              VM
            </Label>
            <Button variant="link" isInline component={Link} to={vmDetailPath(row.vmNamespace, row.vmName)}>
              {row.vmName}
            </Button>
          </Flex>
        );
      case "status":
        return <VmStatusCell status={row.status} />;
      case "conditions":
        return <VmConditionsCell conditions={vm?.conditions} />;
      case "node":
        return vm?.node ?? "—";
      case "ipAddress":
        return vm?.ipAddress ?? "—";
      case "namespace":
        return row.vmNamespace;
      case "created":
        return vm?.createdAt ?? "—";
      case "memory":
        return vm?.memory ?? "—";
      case "cpu":
        return vm?.cpu ?? "—";
      case "network":
        return row.interfaceName || (vm ? networkDisplayName(vm.interfaces[0]?.network) : "—");
      case "deletionProtection":
        return vm?.deletionProtection ? "Enabled" : "Disabled";
      case "storageClass":
        return vm?.storageClass ?? "—";
      default:
        return "—";
    }
  };

  const pageKeys = paginated.map((row) => vmKey({ name: row.vmName, namespace: row.vmNamespace }));
  const allPageSelected = pageKeys.length > 0 && pageKeys.every((k) => selectedRows.has(k));
  const somePageSelected = pageKeys.some((k) => selectedRows.has(k));

  const bump = () => {
    setRefreshKey((k) => k + 1);
    onAttachmentsChange?.();
  };

  const confirmRemove = () => {
    if (!removeTarget) return;
    detachVmFromNetwork(networkRef, removeTarget.vmName, removeTarget.vmNamespace);
    setRemoveTarget(null);
    bump();
  };

  const confirmAdd = () => {
    selectedToAdd.forEach((key) => {
      const vm = getAllVirtualMachines().find((v) => vmKey(v) === key);
      if (vm) attachVmToNetwork(networkRef, vm.name, vm.namespace);
    });
    setSelectedToAdd(new Set());
    setAddOpen(false);
    bump();
  };

  const togglePageSelection = (checked: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      pageKeys.forEach((key) => (checked ? next.add(key) : next.delete(key)));
      return next;
    });
  };

  const toggleRowSelection = (key: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const draftVisibleCount = useMemo(
    () => countVisibleColumns(columnModalDraft, showNamespaceColumn),
    [columnModalDraft, showNamespaceColumn]
  );

  const toggleDraftColumn = useCallback(
    (colId: VmDataColumnId, checked: boolean) => {
      const col = VM_TABLE_COLUMNS.find((c) => c.id === colId);
      if (col?.isMandatory) return;
      if (checked && draftVisibleCount >= MAX_VISIBLE_COLUMNS) return;
      setColumnModalDraft((d) => ({ ...d, [colId]: checked }));
    },
    [draftVisibleCount]
  );

  if (attached.length === 0) {
    return (
      <>
        <div className="ocs-nodes-list__table-wrap app-glass-panel ocs-networking-empty">
          <Flex
            direction={{ default: "column" }}
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentCenter" }}
            gap={{ default: "gapMd" }}
            className="pf-v6-u-py-3xl"
          >
            <PlusCircleIcon aria-hidden className="ocs-networking-empty__icon" />
            <Content component="h2" className="pf-v6-u-font-weight-bold pf-v6-u-text-align-center">
              No VMs connected
            </Content>
            <Content component="p" className="pf-v6-u-text-align-center ocs-networking-empty__desc">
              Click <strong>Add virtual machines</strong> to connect a virtual machine to this network.
            </Content>
            <Button variant="primary" onClick={() => setAddOpen(true)}>
              Add virtual machines
            </Button>
          </Flex>
        </div>
        <AddVirtualMachinesModal
          isOpen={addOpen}
          onClose={() => {
            setAddOpen(false);
            setSelectedToAdd(new Set());
          }}
          vms={available}
          selected={selectedToAdd}
          onToggle={(key) => {
            setSelectedToAdd((prev) => {
              const next = new Set(prev);
              if (next.has(key)) next.delete(key);
              else next.add(key);
              return next;
            });
          }}
          onAdd={confirmAdd}
        />
      </>
    );
  }

  return (
    <>
      <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
        <div>
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            Add virtual machines
          </Button>
        </div>
        <div className="ocs-pods-list__panel app-glass-panel">
          <DataView ouiaId="net-vms-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
            <DataViewToolbar
              ouiaId="net-vms-dv-toolbar"
              id="net-vms-dv-toolbar"
              className={OCS_PROTOTYPE_TOOLBAR_CLASS}
              clearAllFilters={clearAllFilters}
              collapseListedFiltersBreakpoint="xl"
              filters={
                <IoDataViewFiltersWithMidActions<VmFilters>
                  values={filters}
                  onChange={(_id, partial) => onSetFilters(partial)}
                  breakpoint="xl"
                  midContent={
                    <ToolbarGroup variant="action-group" gap={{ default: "gapSm" }}>
                      <ToolbarItem>
                        <Button
                          variant="plain"
                          title="Manage columns"
                          aria-label="Manage columns"
                          onClick={() => {
                            setColumnModalDraft({ ...visibleColumns });
                            setIsManageColumnsModalOpen(true);
                          }}
                          icon={<Columns2 aria-hidden />}
                        />
                      </ToolbarItem>
                    </ToolbarGroup>
                  }
                >
                  <DataViewTextFilter
                    title="Name"
                    filterId="name"
                    placeholder="Search by name..."
                    style={{ minWidth: "16rem", maxWidth: "100%" }}
                  />
                </IoDataViewFiltersWithMidActions>
              }
              pagination={
                <Pagination
                  perPageOptions={[
                    { title: "10", value: 10 },
                    { title: "20", value: 20 },
                  ]}
                  itemCount={itemCount}
                  page={page}
                  perPage={perPage}
                  onSetPage={(_e, p) => setPage(p)}
                  onPerPageSelect={(_e, pp) => {
                    setPerPage(pp);
                    setPage(1);
                  }}
                  variant={PaginationVariant.top}
                  isCompact
                  ouiaId="net-vms-pagination"
                  widgetId="net-vms-pagination"
                  titles={{ items: "virtual machines" }}
                  paginationAriaLabel="Attached virtual machines pagination"
                />
              }
            />
            <OcsPrototypeListTable ariaLabel="Virtual Machines table">
              <Thead>
                <Tr>
                  <Th modifier="fitContent" dataLabel="Select row">
                    <Checkbox
                      id="net-vms-select-page"
                      aria-label="Select all virtual machines on this page"
                      isChecked={allPageSelected ? true : somePageSelected ? null : false}
                      onChange={(_e, checked) => togglePageSelection(Boolean(checked))}
                    />
                  </Th>
                  {visibleOrderedColumns.map((col) => (
                    <Th key={col.id} dataLabel={col.label}>
                      {renderColumnHeader(col)}
                    </Th>
                  ))}
                  <Th modifier="fitContent" dataLabel="Actions">
                    <PlainTableHeader label="Actions" />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginated.map((row) => {
                  const key = vmKey({ name: row.vmName, namespace: row.vmNamespace });
                  const vm = getVirtualMachine(row.vmNamespace, row.vmName);
                  return (
                    <Tr key={key}>
                      <Td dataLabel="Select row">
                        <Checkbox
                          id={`net-vm-select-${key}`}
                          aria-label={`Select ${row.vmName}`}
                          isChecked={selectedRows.has(key)}
                          onChange={() => toggleRowSelection(key)}
                        />
                      </Td>
                      {visibleOrderedColumns.map((col) => (
                        <Td key={col.id} dataLabel={col.label}>
                          {renderColumnCell(col.id, row, vm)}
                        </Td>
                      ))}
                      <Td dataLabel="Actions" isActionCell hasAction>
                        <Dropdown
                          isOpen={menuOpenFor === row.vmName}
                          onOpenChange={(open) => setMenuOpenFor(open ? row.vmName : null)}
                          onSelect={() => {
                            setMenuOpenFor(null);
                            setRemoveTarget(row);
                          }}
                          popperProps={{ position: "right" }}
                          toggle={(toggleRef) => (
                            <MenuToggle
                              ref={toggleRef}
                              variant="plain"
                              aria-label={`Actions for ${row.vmName}`}
                              onClick={() => setMenuOpenFor((cur) => (cur === row.vmName ? null : row.vmName))}
                            >
                              <EllipsisVIcon />
                            </MenuToggle>
                          )}
                        >
                          <DropdownList>
                            <DropdownItem itemId="remove">Remove from network</DropdownItem>
                          </DropdownList>
                        </Dropdown>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </OcsPrototypeListTable>
          </DataView>
        </div>
      </Flex>

      <Modal
        variant="medium"
        isOpen={isManageColumnsModalOpen}
        onClose={() => setIsManageColumnsModalOpen(false)}
        aria-labelledby="net-vms-manage-cols-title"
        aria-describedby="net-vms-manage-cols-body"
      >
        <ModalHeader
          labelId="net-vms-manage-cols-title"
          descriptorId="net-vms-manage-cols-body"
          title="Manage columns"
          description="Selected columns will appear in the table."
        />
        <ModalBody id="net-vms-manage-cols-body">
          <Alert variant="info" isInline title="You can select up to 10 columns" className="pf-v6-u-mb-lg">
            The namespace column is only shown when in &apos;All projects&apos;.
          </Alert>
          <Flex
            direction={{ default: "column", md: "row" }}
            gap={{ default: "gap2xl" }}
            alignItems={{ default: "alignItemsStretch" }}
          >
            <FlexItem grow={{ default: "grow" }} style={{ minWidth: 0, flex: 1 }}>
              <Title headingLevel="h3" size="md" className="pf-v6-u-mb-md">
                Default columns
              </Title>
              <div style={manageColRowStyle(true)}>
                <Checkbox id="net-vm-col-name" label="Name" isChecked isDisabled onChange={() => {}} />
              </div>
              {DEFAULT_MANAGE_COLUMNS.map((col, i) => {
                const isLast = i === DEFAULT_MANAGE_COLUMNS.length - 1;
                const atMax = !columnModalDraft[col.id] && draftVisibleCount >= MAX_VISIBLE_COLUMNS;
                return (
                  <div key={col.id} style={manageColRowStyle(!isLast)}>
                    <Checkbox
                      id={`net-vm-col-draft-${col.id}`}
                      label={col.label}
                      isChecked={columnModalDraft[col.id]}
                      isDisabled={atMax}
                      onChange={(_e, checked) => toggleDraftColumn(col.id, Boolean(checked))}
                    />
                  </div>
                );
              })}
            </FlexItem>
            <FlexItem grow={{ default: "grow" }} style={{ minWidth: 0, flex: 1 }}>
              <Title headingLevel="h3" size="md" className="pf-v6-u-mb-md">
                Additional columns
              </Title>
              {ADDITIONAL_MANAGE_COLUMNS.map((col, i) => {
                const isLast = i === ADDITIONAL_MANAGE_COLUMNS.length - 1;
                const atMax = !columnModalDraft[col.id] && draftVisibleCount >= MAX_VISIBLE_COLUMNS;
                return (
                  <div key={col.id} style={manageColRowStyle(!isLast)}>
                    <Checkbox
                      id={`net-vm-col-draft-${col.id}`}
                      label={col.label}
                      isChecked={columnModalDraft[col.id]}
                      isDisabled={atMax}
                      onChange={(_e, checked) => toggleDraftColumn(col.id, Boolean(checked))}
                    />
                  </div>
                );
              })}
            </FlexItem>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Flex
            flexWrap={{ default: "flexWrapWrap" }}
            alignItems={{ default: "alignItemsCenter" }}
            gap={{ default: "gapMd" }}
            justifyContent={{ default: "justifyContentFlexStart" }}
          >
            <Button
              variant="primary"
              onClick={() => {
                setVisibleColumns({ ...columnModalDraft });
                setIsManageColumnsModalOpen(false);
              }}
            >
              Save
            </Button>
            <Button variant="secondary" onClick={() => setColumnModalDraft({ ...RESTORE_DEFAULT_VISIBLE })}>
              Restore default columns
            </Button>
            <Button variant="link" onClick={() => setIsManageColumnsModalOpen(false)}>
              Cancel
            </Button>
          </Flex>
        </ModalFooter>
      </Modal>

      <Modal
        variant="small"
        isOpen={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        aria-labelledby="remove-vm-net-title"
      >
        <ModalHeader
          title={
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
              <ExclamationCircleIcon className="ocs-net-remove-modal__warn" aria-hidden />
              Remove virtual machine from network?
            </Flex>
          }
          labelId="remove-vm-net-title"
        />
        <ModalBody>
          {removeTarget ? (
            <Content component="p">
              Are you sure you want to remove{" "}
              <Flex
                display={{ default: "inlineFlex" }}
                alignItems={{ default: "alignItemsCenter" }}
                gap={{ default: "gapSm" }}
              >
                <Label color="blue" isCompact className="ocs-resource-label">
                  VM
                </Label>
                <Button
                  variant="link"
                  isInline
                  component={Link}
                  to={vmDetailPath(removeTarget.vmNamespace, removeTarget.vmName)}
                >
                  {removeTarget.vmName}
                </Button>
              </Flex>{" "}
              from <strong>{networkName}</strong>?
            </Content>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button variant="danger" onClick={confirmRemove}>
            Remove
          </Button>
          <Button variant="link" onClick={() => setRemoveTarget(null)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      <AddVirtualMachinesModal
        isOpen={addOpen}
        onClose={() => {
          setAddOpen(false);
          setSelectedToAdd(new Set());
        }}
        vms={available}
        selected={selectedToAdd}
        onToggle={(key) => {
          setSelectedToAdd((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
          });
        }}
        onAdd={confirmAdd}
      />
    </>
  );
}

function sortAddVmRows(
  rows: VirtualMachineRecord[],
  column: AddVmSortColumn,
  direction: SortDirection
): VirtualMachineRecord[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "namespace":
        return compareStrings(a.namespace, b.namespace, direction);
      case "status":
        return compareStrings(a.status, b.status, direction);
      default:
        return 0;
    }
  });
}

function AddVirtualMachinesModal({
  isOpen,
  onClose,
  vms,
  selected,
  onToggle,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  vms: VirtualMachineRecord[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onAdd: () => void;
}) {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<AddVmFilters>({ filters: { name: "" } });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<AddVmSortColumn>("name");

  const filtered = useMemo(() => {
    const q = (filters.name ?? "").trim().toLowerCase();
    return q
      ? vms.filter(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            v.namespace.toLowerCase().includes(q) ||
            v.status.toLowerCase().includes(q)
        )
      : vms;
  }, [vms, filters]);

  const sorted = useMemo(
    () => sortAddVmRows(filtered, sortColumn, sortDirection),
    [filtered, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sorted, [filters], 10);

  const pageKeys = paginated.map((vm) => vmKey(vm));
  const allPageSelected = pageKeys.length > 0 && pageKeys.every((k) => selected.has(k));
  const somePageSelected = pageKeys.some((k) => selected.has(k));

  const togglePage = (checked: boolean) => {
    pageKeys.forEach((key) => {
      if (checked && !selected.has(key)) onToggle(key);
      if (!checked && selected.has(key)) onToggle(key);
    });
  };

  return (
    <Modal variant="medium" isOpen={isOpen} onClose={onClose} aria-labelledby="add-vms-title">
      <ModalHeader
        title="Add virtual machines"
        description="Select virtual machines to connect to this network."
        labelId="add-vms-title"
      />
      <ModalBody className="ocs-add-vms-modal__body">
        <DataView ouiaId="add-vms-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
          <DataViewToolbar
            ouiaId="add-vms-dv-toolbar"
            id="add-vms-dv-toolbar"
            className={OCS_PROTOTYPE_TOOLBAR_CLASS}
            clearAllFilters={clearAllFilters}
            collapseListedFiltersBreakpoint="xl"
            filters={
              <IoDataViewFiltersWithMidActions<AddVmFilters>
                values={filters}
                onChange={(_id, partial) => onSetFilters(partial)}
                breakpoint="xl"
              >
                <DataViewTextFilter
                  title="Name"
                  filterId="name"
                  placeholder="Search by name..."
                  style={{ minWidth: "16rem", maxWidth: "100%" }}
                />
              </IoDataViewFiltersWithMidActions>
            }
            pagination={
              <Pagination
                perPageOptions={[
                  { title: "10", value: 10 },
                  { title: "20", value: 20 },
                ]}
                itemCount={itemCount}
                page={page}
                perPage={perPage}
                onSetPage={(_e, p) => setPage(p)}
                onPerPageSelect={(_e, pp) => {
                  setPerPage(pp);
                  setPage(1);
                }}
                variant={PaginationVariant.top}
                isCompact
                ouiaId="add-vms-pagination"
                widgetId="add-vms-pagination"
                titles={{ items: "virtual machines" }}
                paginationAriaLabel="Available virtual machines pagination"
              />
            }
          />
          <PageSection aria-label="Available virtual machines" padding={{ default: "noPadding" }}>
            <InnerScrollContainer>
              <Table
                aria-label="Available virtual machines"
                borders
                variant="compact"
                className="ocs-io-operator-table"
              >
                <Thead>
                  <Tr>
                    <Th modifier="fitContent" dataLabel="Select">
                      <Checkbox
                        id="add-vms-select-page"
                        aria-label="Select all virtual machines on this page"
                        isChecked={allPageSelected ? true : somePageSelected ? null : false}
                        onChange={(_e, checked) => togglePage(Boolean(checked))}
                      />
                    </Th>
                    <Th dataLabel="Name">
                      <SortableTableHeader
                        label="Name"
                        column="name"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="Namespace">
                      <SortableTableHeader
                        label="Namespace"
                        column="namespace"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                    <Th dataLabel="Status">
                      <SortableTableHeader
                        label="Status"
                        column="status"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={toggleSort}
                      />
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginated.length === 0 ? (
                    <Tr>
                      <Td colSpan={4} dataLabel="Empty state">
                        <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-md">
                          No virtual machines match your search.
                        </Content>
                      </Td>
                    </Tr>
                  ) : (
                    paginated.map((vm) => {
                      const key = vmKey(vm);
                      return (
                        <Tr key={key}>
                          <Td dataLabel="Select">
                            <Checkbox
                              id={`add-vm-${key}`}
                              aria-label={`Select ${vm.name}`}
                              isChecked={selected.has(key)}
                              onChange={() => onToggle(key)}
                            />
                          </Td>
                          <Td dataLabel="Name">
                            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <Label color="blue" isCompact className="ocs-resource-label">
                                VM
                              </Label>
                              <Button
                                variant="link"
                                isInline
                                component={Link}
                                to={vmDetailPath(vm.namespace, vm.name)}
                              >
                                {vm.name}
                              </Button>
                            </Flex>
                          </Td>
                          <Td dataLabel="Namespace">
                            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <Label color="green" isCompact className="ocs-resource-label">
                                NS
                              </Label>
                              {vm.namespace}
                            </Flex>
                          </Td>
                          <Td dataLabel="Status">
                            <Label color="orange" isCompact>
                              {vm.status}
                            </Label>
                          </Td>
                        </Tr>
                      );
                    })
                  )}
                </Tbody>
              </Table>
            </InnerScrollContainer>
          </PageSection>
        </DataView>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" isDisabled={selected.size === 0} onClick={onAdd}>
          Add
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export function ConnectedVmTabBadge({ count }: { count: number }) {
  return (
    <Badge isRead className="ocs-net-vm-tab-badge">
      {count}
    </Badge>
  );
}

/** @deprecated Use ConnectedVmTabBadge */
export const NetworkVmTabBadge = ConnectedVmTabBadge;
