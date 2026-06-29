import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Form,
  FormGroup,
  FormHelperText,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Pagination,
  PaginationVariant,
  TextArea,
  TextInput,
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
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { IoDataViewFiltersWithMidActions } from "../../components/dataView/IoDataViewFiltersWithMidActions";
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
} from "../../components/dataView/OcsPrototypeListTable";
import { NetworkingPageShell, NetworkingTablePanel } from "./networkingShared";

type UdnFilters = { name: string };

type SortColumn = "name" | "namespace" | "topology" | "mtu" | "condition";

interface UdnRow {
  name: string;
  kind: "CUDN";
  namespace: string;
  topology: string;
  mtu: string;
  condition: string;
}

const UDN_ROWS: UdnRow[] = [
  {
    name: "cluster-udn-lime-giraffe",
    kind: "CUDN",
    namespace: "—",
    topology: "Layer2",
    mtu: "Not available",
    condition: "NetworkCreated=False",
  },
];

function CreateUdnModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal variant="medium" isOpen={isOpen} onClose={onClose} aria-labelledby="create-udn-title">
      <ModalHeader title="Create UserDefinedNetwork" labelId="create-udn-title" />
      <ModalBody>
        <Alert variant="warning" title="No namespace is configured for a primary user-defined network." isInline>
          At creation time the namespace must be configured with{" "}
          <code>k8s.ovn.org/primary-user-defined-network</code> label. Go to{" "}
          <Button variant="link" isInline component="a" href="/administration/namespaces">
            Namespaces
          </Button>{" "}
          to create a new namespace.
        </Alert>
        <Content component="p" className="pf-v6-u-mt-md">
          Define the network used by VirtualMachines and Pods to communicate in the given project. Learn more about{" "}
          <Button variant="link" isInline>
            primary user-defined network
          </Button>
          .
        </Content>
        <Form className="pf-v6-u-mt-md">
          <FormGroup label="Project name" isRequired fieldId="udn-project">
            <TextInput id="udn-project" placeholder="Select a Project" type="text" />
          </FormGroup>
          <FormGroup label="Subnet CIDR" isRequired fieldId="udn-cidr">
            <TextInput id="udn-cidr" type="text" />
            <FormHelperText>
              Dual-stack clusters may set 2 subnets (one for each IP family), otherwise only 1 subnet is allowed.
              The format should match standard CIDR notation (for example, &apos;192.168.123.0/24&apos;).
            </FormHelperText>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" isDisabled>
          Create
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function CreateClusterUdnModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal variant="medium" isOpen={isOpen} onClose={onClose} aria-labelledby="create-cudn-title">
      <ModalHeader title="Create ClusterUserDefinedNetwork" labelId="create-cudn-title" />
      <ModalBody>
        <Content component="p">
          Define the network used by VirtualMachines and Pods to communicate in the given project. Learn more about{" "}
          <Button variant="link" isInline>
            primary user-defined network
          </Button>
          .
        </Content>
        <Form className="pf-v6-u-mt-md">
          <FormGroup label="Name" isRequired fieldId="cudn-name">
            <TextInput id="cudn-name" defaultValue="cluster-udn-black-narwhal" type="text" />
          </FormGroup>
          <FormGroup label="Subnet CIDR" isRequired fieldId="cudn-cidr">
            <TextInput id="cudn-cidr" type="text" />
            <FormHelperText>
              Dual-stack clusters may set 2 subnets (one for each IP family), otherwise only 1 subnet is allowed.
              The format should match standard CIDR notation (for example, &apos;192.168.123.0/24&apos;).
            </FormHelperText>
          </FormGroup>
          <FormGroup label="Namespace(s)" fieldId="cudn-ns">
            <FormGroup label="Match Labels" isRequired fieldId="cudn-labels">
              <TextArea id="cudn-labels" placeholder="app=frontend" />
              <FormHelperText>
                matchLabels is a map of {"{key,value}"} pairs. A single {"{key,value}"} in the matchLabels map is
                equivalent to an element of matchExpressions, whose key field is &apos;key&apos;, the operator is
                &apos;In&apos;, and the values array contains only &apos;value&apos;. The requirements are ANDed.
              </FormHelperText>
            </FormGroup>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" isDisabled>
          Create
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function rowMatchesFilters(row: UdnRow, filters: UdnFilters): boolean {
  const q = (filters.name ?? "").trim().toLowerCase();
  return !q || row.name.toLowerCase().includes(q);
}

function sortUdnRows(rows: UdnRow[], column: SortColumn, direction: SortDirection): UdnRow[] {
  return [...rows].sort((a, b) => {
    switch (column) {
      case "name":
        return compareStrings(a.name, b.name, direction);
      case "namespace":
        return compareStrings(a.namespace, b.namespace, direction);
      case "topology":
        return compareStrings(a.topology, b.topology, direction);
      case "mtu":
        return compareStrings(a.mtu, b.mtu, direction);
      case "condition":
        return compareStrings(a.condition, b.condition, direction);
      default:
        return 0;
    }
  });
}

export default function UserDefinedNetworksPage() {
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<UdnFilters>({
    filters: { name: "" },
  });
  const { sortColumn, sortDirection, toggleSort } = useTableSort<SortColumn>("name");
  const [createOpen, setCreateOpen] = useState(false);
  const [udnModalOpen, setUdnModalOpen] = useState(false);
  const [cudnModalOpen, setCudnModalOpen] = useState(false);

  const filtered = useMemo(
    () => UDN_ROWS.filter((r) => rowMatchesFilters(r, filters)),
    [filters]
  );
  const sorted = useMemo(
    () => sortUdnRows(filtered, sortColumn, sortDirection),
    [filtered, sortColumn, sortDirection]
  );
  const { page, setPage, perPage, setPerPage, paginated, itemCount } = useListPagination(sorted, [filters], 20);

  useEffect(() => {
    setPage(1);
  }, [filters.name, perPage, setPage]);

  const colSpan = 6;

  return (
    <NetworkingPageShell
      title="UserDefinedNetworks"
      path="/networking/userdefinednetworks"
      createButton={
        <Dropdown
          isOpen={createOpen}
          onOpenChange={(open) => setCreateOpen(open)}
          toggle={(toggleRef) => (
            <MenuToggle ref={toggleRef} onClick={() => setCreateOpen((o) => !o)} variant="primary">
              Create
            </MenuToggle>
          )}
          popperProps={{ position: "right" }}
        >
          <DropdownList>
            <DropdownItem
              itemId="cudn"
              onClick={() => {
                setCreateOpen(false);
                setCudnModalOpen(true);
              }}
            >
              ClusterUserDefinedNetwork
            </DropdownItem>
            <DropdownItem
              itemId="udn"
              onClick={() => {
                setCreateOpen(false);
                setUdnModalOpen(true);
              }}
            >
              UserDefinedNetwork
            </DropdownItem>
          </DropdownList>
        </Dropdown>
      }
    >
      <NetworkingTablePanel>
        <DataView ouiaId="udn-data-view" className={OCS_PROTOTYPE_DATAVIEW_CLASS}>
          <DataViewToolbar
            ouiaId="udn-dv-toolbar"
            id="udn-dv-toolbar"
            className={OCS_PROTOTYPE_TOOLBAR_CLASS}
            clearAllFilters={clearAllFilters}
            collapseListedFiltersBreakpoint="xl"
            filters={
              <IoDataViewFiltersWithMidActions<UdnFilters>
                values={filters}
                onChange={(_id, partial) => onSetFilters(partial)}
                breakpoint="xl"
                midContent={
                  <ToolbarGroup variant="action-group" gap={{ default: "gapSm" }}>
                    <ToolbarItem>
                      <Button variant="plain" aria-label="List view" isAriaPressed icon={<ListIcon />} />
                    </ToolbarItem>
                    <ToolbarItem>
                      <Button variant="plain" aria-label="Refresh" icon={<SyncIcon />} />
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
                  { title: "50", value: 50 },
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
                ouiaId="udn-pagination"
                widgetId="udn-pagination"
                titles={{ items: "networks" }}
                paginationAriaLabel="UserDefinedNetworks pagination"
              />
            }
          />
          <OcsPrototypeListTable ariaLabel="UserDefinedNetworks">
            <Thead>
              <Tr>
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
                <Th dataLabel="Topology">
                  <SortableTableHeader
                    label="Topology"
                    column="topology"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                </Th>
                <Th dataLabel="MTU">
                  <SortableTableHeader
                    label="MTU"
                    column="mtu"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                </Th>
                <Th dataLabel="Conditions">
                  <SortableTableHeader
                    label="Conditions"
                    column="condition"
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                  />
                </Th>
                <Th modifier="fitContent" dataLabel="Actions">
                  <PlainTableHeader label="Actions" />
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginated.length === 0 ? (
                <Tr>
                  <Td colSpan={colSpan} dataLabel="Empty state">
                    <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-lg">
                      No user-defined networks match your filters.
                    </Content>
                  </Td>
                </Tr>
              ) : (
                paginated.map((row) => (
                  <Tr key={row.name}>
                    <Td dataLabel="Name">
                      <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                        <Label color="grey" isCompact className="ocs-resource-label">
                          {row.kind}
                        </Label>
                        <Button variant="link" isInline>
                          {row.name}
                        </Button>
                      </Flex>
                    </Td>
                    <Td dataLabel="Namespace">
                      <Content component="small">{row.namespace}</Content>
                    </Td>
                    <Td dataLabel="Topology">
                      <Content component="small">{row.topology}</Content>
                    </Td>
                    <Td dataLabel="MTU">
                      <Content component="small">{row.mtu}</Content>
                    </Td>
                    <Td dataLabel="Conditions">
                      <Label color="grey" isCompact>
                        {row.condition}
                      </Label>
                    </Td>
                    <Td dataLabel="Actions" isActionCell hasAction>
                      <Button variant="plain" aria-label={`Actions for ${row.name}`} icon={<EllipsisVIcon />} />
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </OcsPrototypeListTable>
        </DataView>
      </NetworkingTablePanel>

      <CreateUdnModal isOpen={udnModalOpen} onClose={() => setUdnModalOpen(false)} />
      <CreateClusterUdnModal isOpen={cudnModalOpen} onClose={() => setCudnModalOpen(false)} />
    </NetworkingPageShell>
  );
}
