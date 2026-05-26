import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Button,
  Content,
  Flex,
  Icon,
  Label,
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
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import OutlinedClockIcon from "@patternfly/react-icons/dist/esm/icons/outlined-clock-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import Breadcrumbs from "../components/Breadcrumbs";
import FavoriteButton from "../components/FavoriteButton";
import { IoDataViewFiltersWithMidActions } from "../components/dataView/IoDataViewFiltersWithMidActions";
import { COMPUTE_NODES_LIST } from "./compute/nodeDetailData";

type NodeStatus = (typeof COMPUTE_NODES_LIST)[number]["status"];

type NodeFilters = {
  name: string;
  role: string;
};

function nodeDetailPath(nodeName: string) {
  return `/compute/nodes/${encodeURIComponent(nodeName)}`;
}

function NodeStatusCell({ status }: { status: NodeStatus }) {
  return (
    <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
      <Icon status="success" aria-hidden>
        <CheckCircleIcon />
      </Icon>
      <Content component="small">{status}</Content>
    </Flex>
  );
}

export default function ComputePage() {
  const navigate = useNavigate();
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<NodeFilters>({
    filters: { name: "", role: "" },
  });

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  const filteredNodes = useMemo(() => {
    const nameQ = (filters.name ?? "").trim().toLowerCase();
    const roleQ = (filters.role ?? "").trim().toLowerCase();
    return COMPUTE_NODES_LIST.filter((node) => {
      const matchesName = !nameQ || node.name.toLowerCase().includes(nameQ);
      const matchesRole = !roleQ || node.role.toLowerCase().includes(roleQ);
      return matchesName && matchesRole;
    });
  }, [filters.name, filters.role]);

  const paginatedNodes = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredNodes.slice(start, start + perPage);
  }, [filteredNodes, page, perPage]);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.role, perPage]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredNodes.length / perPage) || 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredNodes.length, page, perPage]);

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Compute", path: "/compute" },
          { label: "Nodes", path: "/compute" },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
              <Title headingLevel="h1" size="2xl">
                Nodes
              </Title>
              <FavoriteButton name="Nodes" path="/compute" />
            </Flex>
          </Flex>

          <div className="ocs-pods-list__panel app-glass-panel">
            <DataView ouiaId="nodes-data-view" className="ocs-pods-dataview">
              <DataViewToolbar
                ouiaId="nodes-dv-toolbar"
                id="nodes-dv-toolbar"
                className="ocs-io-dv-toolbar-align ocs-pods-list__dv-toolbar"
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<NodeFilters>
                    values={filters}
                    onChange={(_filterId, partial) => onSetFilters(partial)}
                    breakpoint="xl"
                    midContent={
                      <ToolbarGroup variant="action-group" gap={{ default: "gapSm" }}>
                        <ToolbarItem>
                          <Button
                            variant="plain"
                            aria-label="List view"
                            isAriaPressed
                            icon={<ListIcon />}
                          />
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
                      placeholder="Filter by name..."
                      style={{ minWidth: "16rem", maxWidth: "100%" }}
                    />
                    <DataViewTextFilter
                      title="Role"
                      filterId="role"
                      placeholder="Filter by role..."
                      style={{ minWidth: "14rem", maxWidth: "100%" }}
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
                    itemCount={filteredNodes.length}
                    page={page}
                    perPage={perPage}
                    onSetPage={(_e, p) => setPage(p)}
                    onPerPageSelect={(_e, pp) => {
                      setPerPage(pp);
                      setPage(1);
                    }}
                    variant={PaginationVariant.top}
                    isCompact
                    ouiaId="nodes-pagination"
                    widgetId="nodes-pagination"
                    titles={{ items: "nodes" }}
                    paginationAriaLabel="Nodes pagination"
                  />
                }
              />

              <div className="ocs-nodes-list__table-wrap ocs-pods-list__table-wrap">
                <table className="ocs-nodes-list__table ocs-pods-list__table" aria-label="Nodes">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Status</th>
                      <th scope="col">Role</th>
                      <th scope="col">Kubelet version</th>
                      <th scope="col">CPU</th>
                      <th scope="col">Memory</th>
                      <th scope="col">Pods</th>
                      <th scope="col">Age</th>
                      <th scope="col">
                        <span className="pf-v6-u-screen-reader">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedNodes.length === 0 ? (
                      <tr>
                        <td colSpan={9}>
                          <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-lg">
                            No nodes match your filters.
                          </Content>
                        </td>
                      </tr>
                    ) : (
                      paginatedNodes.map((node) => (
                        <tr
                          key={node.name}
                          className="ocs-pods-list__row"
                          onClick={() => navigate(nodeDetailPath(node.name))}
                        >
                          <td>
                            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <Label color="blue" isCompact className="ocs-resource-label">
                                N
                              </Label>
                              <Button
                                variant="link"
                                isInline
                                component={Link}
                                to={nodeDetailPath(node.name)}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {node.name}
                              </Button>
                            </Flex>
                          </td>
                          <td>
                            <NodeStatusCell status={node.status} />
                          </td>
                          <td>
                            <Content component="small">{node.role}</Content>
                          </td>
                          <td>
                            <Content component="small">{node.kubelet}</Content>
                          </td>
                          <td>
                            <Content component="small">{node.cpu}</Content>
                          </td>
                          <td>
                            <Content component="small">{node.memory}</Content>
                          </td>
                          <td>
                            <Content component="small">{node.pods}</Content>
                          </td>
                          <td>
                            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <OutlinedClockIcon aria-hidden className="ocs-pods-list__created-icon" />
                              <Content component="small">{node.age}</Content>
                            </Flex>
                          </td>
                          <td>
                            <Button
                              variant="plain"
                              aria-label={`Actions for ${node.name}`}
                              icon={<EllipsisVIcon />}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </DataView>
          </div>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
