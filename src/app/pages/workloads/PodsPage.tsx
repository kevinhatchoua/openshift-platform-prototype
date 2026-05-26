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
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import OutlinedClockIcon from "@patternfly/react-icons/dist/esm/icons/outlined-clock-icon";
import SyncIcon from "@patternfly/react-icons/dist/esm/icons/sync-icon";
import TimesCircleIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { IoDataViewFiltersWithMidActions } from "../../components/dataView/IoDataViewFiltersWithMidActions";
import { PODS, podDetailPath, type PodRecord, type PodStatus } from "./podListData";

type PodFilters = {
  name: string;
  namespace: string;
};

function PodStatusCell({ status }: { status: PodStatus }) {
  switch (status) {
    case "Running":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="success" aria-hidden>
            <CheckCircleIcon />
          </Icon>
          <Content component="small">{status}</Content>
        </Flex>
      );
    case "Pending":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="warning" aria-hidden>
            <ClockIcon />
          </Icon>
          <Content component="small">{status}</Content>
        </Flex>
      );
    case "Failed":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="danger" aria-hidden>
            <TimesCircleIcon />
          </Icon>
          <Content component="small">{status}</Content>
        </Flex>
      );
    case "Succeeded":
      return (
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
          <Icon status="info" aria-hidden>
            <CheckCircleIcon />
          </Icon>
          <Content component="small">{status}</Content>
        </Flex>
      );
    default:
      return <Content component="small">{status}</Content>;
  }
}

function OwnerKindLabel({ kind }: { kind: PodRecord["owner"]["kind"] }) {
  const abbrev =
    kind === "ReplicaSet"
      ? "RS"
      : kind === "StatefulSet"
        ? "SS"
        : kind === "DaemonSet"
          ? "DS"
          : kind === "CronJob"
            ? "CJ"
            : "J";
  return (
    <Label color="blue" isCompact className="ocs-resource-label">
      {abbrev}
    </Label>
  );
}

export default function PodsPage() {
  const navigate = useNavigate();
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<PodFilters>({
    filters: { name: "", namespace: "" },
  });

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  const filteredPods = useMemo(() => {
    const nameQ = (filters.name ?? "").trim().toLowerCase();
    const nsQ = (filters.namespace ?? "").trim().toLowerCase();
    return PODS.filter((pod) => {
      const matchesName = !nameQ || pod.name.toLowerCase().includes(nameQ);
      const matchesNs = !nsQ || pod.namespace.toLowerCase().includes(nsQ);
      return matchesName && matchesNs;
    });
  }, [filters.name, filters.namespace]);

  const paginatedPods = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredPods.slice(start, start + perPage);
  }, [filteredPods, page, perPage]);

  useEffect(() => {
    setPage(1);
  }, [filters.name, filters.namespace, perPage]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredPods.length / perPage) || 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredPods.length, page, perPage]);

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "Workloads", path: "/workloads" },
          { label: "Pods", path: "/workloads/pods" },
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
                Pods
              </Title>
              <FavoriteButton name="Pods" path="/workloads/pods" />
            </Flex>
            <Button variant="primary">Create Pod</Button>
          </Flex>

          <div className="ocs-pods-list__panel app-glass-panel">
            <DataView ouiaId="pods-data-view" className="ocs-pods-dataview">
              <DataViewToolbar
                ouiaId="pods-dv-toolbar"
                id="pods-dv-toolbar"
                className="ocs-io-dv-toolbar-align ocs-pods-list__dv-toolbar"
                clearAllFilters={clearAllFilters}
                collapseListedFiltersBreakpoint="xl"
                filters={
                  <IoDataViewFiltersWithMidActions<PodFilters>
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
                      title="Namespace"
                      filterId="namespace"
                      placeholder="Filter by namespace..."
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
                    itemCount={filteredPods.length}
                    page={page}
                    perPage={perPage}
                    onSetPage={(_e, p) => setPage(p)}
                    onPerPageSelect={(_e, pp) => {
                      setPerPage(pp);
                      setPage(1);
                    }}
                    variant={PaginationVariant.top}
                    isCompact
                    ouiaId="pods-pagination"
                    widgetId="pods-pagination"
                    titles={{ items: "pods" }}
                    paginationAriaLabel="Pods pagination"
                  />
                }
              />

              <div className="ocs-nodes-list__table-wrap ocs-pods-list__table-wrap">
                <table className="ocs-nodes-list__table ocs-pods-list__table" aria-label="Pods">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Namespace</th>
                      <th scope="col">Status</th>
                      <th scope="col">Ready</th>
                      <th scope="col">Restarts</th>
                      <th scope="col">Owner</th>
                      <th scope="col">Memory</th>
                      <th scope="col">CPU</th>
                      <th scope="col">Created</th>
                      <th scope="col">
                        <span className="pf-v6-u-screen-reader">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPods.length === 0 ? (
                      <tr>
                        <td colSpan={10}>
                          <Content component="p" className="pf-v6-u-text-align-center pf-v6-u-py-lg">
                            No pods match your filters.
                          </Content>
                        </td>
                      </tr>
                    ) : (
                      paginatedPods.map((pod) => (
                        <tr
                          key={`${pod.namespace}/${pod.name}`}
                          className="ocs-pods-list__row"
                          onClick={() => navigate(podDetailPath(pod.namespace, pod.name))}
                        >
                          <td>
                            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <Label color="teal" isCompact className="ocs-resource-label">
                                P
                              </Label>
                              <Button
                                variant="link"
                                isInline
                                component={Link}
                                to={podDetailPath(pod.namespace, pod.name)}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {pod.name}
                              </Button>
                            </Flex>
                          </td>
                          <td>
                            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <Label color="green" isCompact className="ocs-resource-label">
                                NS
                              </Label>
                              <Button variant="link" isInline onClick={(e) => e.stopPropagation()}>
                                {pod.namespace}
                              </Button>
                            </Flex>
                          </td>
                          <td>
                            <PodStatusCell status={pod.status} />
                          </td>
                          <td>
                            <Content component="small">{pod.ready}</Content>
                          </td>
                          <td>
                            <Content component="small">{pod.restarts}</Content>
                          </td>
                          <td>
                            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <OwnerKindLabel kind={pod.owner.kind} />
                              <Button variant="link" isInline onClick={(e) => e.stopPropagation()}>
                                {pod.owner.name}
                              </Button>
                            </Flex>
                          </td>
                          <td>
                            <Content component="small">{pod.memory}</Content>
                          </td>
                          <td>
                            <Content component="small">{pod.cpu}</Content>
                          </td>
                          <td>
                            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                              <OutlinedClockIcon aria-hidden className="ocs-pods-list__created-icon" />
                              <Content component="small">{pod.created}</Content>
                            </Flex>
                          </td>
                          <td>
                            <Button
                              variant="plain"
                              aria-label={`Actions for ${pod.name}`}
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
