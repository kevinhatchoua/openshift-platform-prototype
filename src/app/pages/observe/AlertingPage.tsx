import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Button,
  Flex,
  Label,
  MenuToggle,
  PageSection,
  Pagination,
  Select,
  SelectList,
  SelectOption,
  Tab,
  Tabs,
  TabTitleText,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
  SearchInput,
  Content,
} from "@patternfly/react-core";
import { ExpandableRowContent, Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import BellIcon from "@patternfly/react-icons/dist/esm/icons/bell-icon";
import ExclamationTriangleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon";
import FilterIcon from "@patternfly/react-icons/dist/esm/icons/filter-icon";
import FavoriteButton from "../../components/FavoriteButton";
import { useNotificationAlerts, type ConsoleAlert } from "../../contexts/NotificationAlertsContext";

type FilterAttribute = "name" | "state" | "source" | "severity";
type SortColumn = "name" | "state";

const FILTER_ATTRIBUTES: { id: FilterAttribute; label: string; placeholder: string }[] = [
  { id: "name", label: "Alert Name", placeholder: "Filter by Name" },
  { id: "state", label: "Alert State", placeholder: "Filter by state..." },
  { id: "source", label: "Source", placeholder: "Filter by source..." },
  { id: "severity", label: "Severity", placeholder: "Filter by severity..." },
];

function severityLabel(alert: ConsoleAlert) {
  if (alert.severity === "warning") {
    return (
      <Label color="orange" icon={<ExclamationTriangleIcon />}>
        Warning
      </Label>
    );
  }
  if (alert.severity === "critical") {
    return (
      <Label color="red" icon={<ExclamationTriangleIcon />}>
        Critical
      </Label>
    );
  }
  return <Label color="grey">-- None</Label>;
}

export default function AlertingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    alerts,
    search,
    setSearch,
    alertStateFilter,
    setAlertStateFilter,
    sourceFilter,
    setSourceFilter,
  } = useNotificationAlerts();

  const [activeTab, setActiveTab] = useState<string | number>("alerts");
  const [filterAttr, setFilterAttr] = useState<FilterAttribute>("name");
  const [attrSelectOpen, setAttrSelectOpen] = useState(false);
  const [valueSelectOpen, setValueSelectOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<"all" | "warning" | "critical" | "info">("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<{ index: SortColumn; direction: "asc" | "desc" }>({
    index: "name",
    direction: "asc",
  });

  useEffect(() => {
    const state = searchParams.get("state");
    const source = searchParams.get("source");
    const q = searchParams.get("q");
    if (state === "Firing") setAlertStateFilter("Firing");
    if (state === "all") setAlertStateFilter("all");
    if (source === "Platform") setSourceFilter("Platform");
    if (source === "all") setSourceFilter("all");
    if (q != null) setSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    if (alertStateFilter === "Firing") next.set("state", "Firing");
    if (sourceFilter === "Platform") next.set("source", "Platform");
    if (search.trim()) next.set("q", search.trim());
    setSearchParams(next, { replace: true });
  }, [alertStateFilter, sourceFilter, search, setSearchParams]);

  const tableAlerts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = alerts.filter((a) => {
      if (a.severity === "recommendation") return false;
      if (alertStateFilter !== "all" && a.state !== alertStateFilter) return false;
      if (sourceFilter !== "all" && a.source !== sourceFilter) return false;
      if (severityFilter !== "all" && a.severity !== severityFilter) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q);
    });

    const dir = sortBy.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const left = sortBy.index === "name" ? a.name : a.state;
      const right = sortBy.index === "name" ? b.name : b.state;
      return left.localeCompare(right) * dir;
    });
  }, [alerts, alertStateFilter, sourceFilter, severityFilter, search, sortBy]);

  const pageAlerts = useMemo(() => {
    const start = (page - 1) * perPage;
    return tableAlerts.slice(start, start + perPage);
  }, [tableAlerts, page, perPage]);

  useEffect(() => {
    setPage(1);
  }, [search, alertStateFilter, sourceFilter, severityFilter]);

  const activeAttr = FILTER_ATTRIBUTES.find((a) => a.id === filterAttr) ?? FILTER_ATTRIBUTES[0];
  const clearAllFilters = () => {
    setAlertStateFilter("all");
    setSourceFilter("all");
    setSeverityFilter("all");
    setSearch("");
  };

  const applyAttributeValue = (value: string) => {
    if (filterAttr === "state") {
      setAlertStateFilter(value === "all" ? "all" : (value as "Firing"));
    } else if (filterAttr === "source") {
      setSourceFilter(value === "all" ? "all" : (value as "Platform"));
    } else if (filterAttr === "severity") {
      setSeverityFilter(value as typeof severityFilter);
    }
    setValueSelectOpen(false);
  };

  const getSortParams = (column: SortColumn) => ({
    sort: {
      sortBy: {
        index: sortBy.index === "name" ? 0 : 1,
        direction: sortBy.direction,
      },
      onSort: (_e: unknown, _index: number, direction: "asc" | "desc") => {
        setSortBy({ index: column, direction });
      },
      columnIndex: column === "name" ? 0 : 1,
    },
  });

  return (
    <div className="ocs-alerting-page">
      <PageSection className="ocs-alerting-page__project" isFilled={false}>
        <Select
          isOpen={projectOpen}
          selected="all"
          onOpenChange={setProjectOpen}
          onSelect={() => setProjectOpen(false)}
          toggle={(toggleRef) => (
            <MenuToggle
              ref={toggleRef}
              onClick={() => setProjectOpen((o) => !o)}
              isExpanded={projectOpen}
              variant="plainText"
              className="ocs-alerting-page__project-toggle"
            >
              Project: All Projects
            </MenuToggle>
          )}
        >
          <SelectList>
            <SelectOption value="all">All Projects</SelectOption>
          </SelectList>
        </Select>
      </PageSection>

      <PageSection className="ocs-alerting-page__header" isFilled={false}>
        <Flex
          justifyContent={{ default: "justifyContentSpaceBetween" }}
          alignItems={{ default: "alignItemsCenter" }}
          className="ocs-alerting-page__title-row"
        >
          <Title headingLevel="h1" size="2xl">
            Alerting
          </Title>
          <FavoriteButton name="Alerting" path="/observe/alerts" />
        </Flex>
      </PageSection>

      <PageSection type="tabs" className="ocs-alerting-page__tabs" isFilled={false}>
        <Tabs
          activeKey={activeTab}
          onSelect={(_e, key) => setActiveTab(key)}
          aria-label="Alerting sections"
        >
          <Tab eventKey="alerts" title={<TabTitleText>Alerts</TabTitleText>} />
          <Tab eventKey="silences" title={<TabTitleText>Silences</TabTitleText>} />
          <Tab eventKey="rules" title={<TabTitleText>Alerting rules</TabTitleText>} />
        </Tabs>
      </PageSection>

      {activeTab === "alerts" ? (
        <PageSection className="ocs-alerting-page__content">
          <Toolbar
            id="observe-alerts-toolbar"
            className="ocs-alerting-page__toolbar"
            clearAllFilters={clearAllFilters}
            clearFiltersButtonText="Clear all filters"
          >
            <ToolbarContent>
              <ToolbarGroup variant="filter-group" alignItems="center">
                <ToolbarItem>
                  <Select
                    isOpen={attrSelectOpen}
                    selected={filterAttr}
                    onOpenChange={setAttrSelectOpen}
                    onSelect={(_e, value) => {
                      setFilterAttr(String(value) as FilterAttribute);
                      setAttrSelectOpen(false);
                      setValueSelectOpen(false);
                    }}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() => setAttrSelectOpen((o) => !o)}
                        isExpanded={attrSelectOpen}
                        icon={<FilterIcon />}
                        aria-label="Filter attribute"
                      >
                        {activeAttr.label}
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      {FILTER_ATTRIBUTES.map((attr) => (
                        <SelectOption key={attr.id} value={attr.id}>
                          {attr.label}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </ToolbarItem>

                <ToolbarFilter
                  categoryName="Alert Name"
                  labels={search.trim() ? [search.trim()] : []}
                  deleteLabel={() => setSearch("")}
                  deleteLabelGroup={() => setSearch("")}
                >
                  {filterAttr === "name" ? (
                    <SearchInput
                      placeholder={activeAttr.placeholder}
                      value={search}
                      onChange={(_e, v) => setSearch(v)}
                      onClear={() => setSearch("")}
                      aria-label="Filter by Name"
                      className="ocs-alerting-page__name-filter"
                    />
                  ) : (
                    <Select
                      isOpen={valueSelectOpen}
                      onOpenChange={setValueSelectOpen}
                      onSelect={(_e, value) => applyAttributeValue(String(value))}
                      selected={
                        filterAttr === "state"
                          ? alertStateFilter
                          : filterAttr === "source"
                            ? sourceFilter
                            : severityFilter
                      }
                      toggle={(toggleRef) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() => setValueSelectOpen((o) => !o)}
                          isExpanded={valueSelectOpen}
                          className="ocs-alerting-page__name-filter"
                        >
                          {activeAttr.placeholder}
                        </MenuToggle>
                      )}
                    >
                      <SelectList>
                        {filterAttr === "state" ? (
                          <>
                            <SelectOption value="Firing">Firing</SelectOption>
                            <SelectOption value="Pending">Pending</SelectOption>
                            <SelectOption value="Silenced">Silenced</SelectOption>
                            <SelectOption value="all">All states</SelectOption>
                          </>
                        ) : null}
                        {filterAttr === "source" ? (
                          <>
                            <SelectOption value="Platform">Platform</SelectOption>
                            <SelectOption value="User">User</SelectOption>
                            <SelectOption value="all">All sources</SelectOption>
                          </>
                        ) : null}
                        {filterAttr === "severity" ? (
                          <>
                            <SelectOption value="critical">Critical</SelectOption>
                            <SelectOption value="warning">Warning</SelectOption>
                            <SelectOption value="info">None</SelectOption>
                            <SelectOption value="all">All severities</SelectOption>
                          </>
                        ) : null}
                      </SelectList>
                    </Select>
                  )}
                </ToolbarFilter>

                <ToolbarFilter
                  categoryName="Alert State"
                  labels={alertStateFilter === "Firing" ? ["Firing"] : []}
                  deleteLabel={() => setAlertStateFilter("all")}
                  deleteLabelGroup={() => setAlertStateFilter("all")}
                >
                  <span hidden />
                </ToolbarFilter>
                <ToolbarFilter
                  categoryName="Source"
                  labels={sourceFilter === "Platform" ? ["Platform"] : []}
                  deleteLabel={() => setSourceFilter("all")}
                  deleteLabelGroup={() => setSourceFilter("all")}
                >
                  <span hidden />
                </ToolbarFilter>
                <ToolbarFilter
                  categoryName="Severity"
                  labels={
                    severityFilter !== "all"
                      ? [severityFilter === "info" ? "None" : severityFilter]
                      : []
                  }
                  deleteLabel={() => setSeverityFilter("all")}
                  deleteLabelGroup={() => setSeverityFilter("all")}
                >
                  <span hidden />
                </ToolbarFilter>
              </ToolbarGroup>

              <ToolbarItem>
                <Button variant="link" isInline>
                  Export as CSV
                </Button>
              </ToolbarItem>

              <ToolbarItem align={{ default: "alignEnd" }}>
                <Pagination
                  itemCount={tableAlerts.length}
                  page={page}
                  perPage={perPage}
                  onSetPage={(_e, p) => setPage(p)}
                  onPerPageSelect={(_e, pp) => {
                    setPerPage(pp);
                    setPage(1);
                  }}
                  variant="top"
                  isCompact
                  titles={{ paginationAriaLabel: "Alerts pagination" }}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          <Table aria-label="Alerts" className="ocs-alerting-page__table">
            <Thead>
              <Tr>
                <Th screenReaderText="Expand" width={10} />
                <Th {...getSortParams("name")}>Name</Th>
                <Th>Severity</Th>
                <Th width={10}>Total</Th>
                <Th width={15} {...getSortParams("state")}>
                  State
                </Th>
              </Tr>
            </Thead>
            {pageAlerts.map((alert, rowIndex) => {
              const isExpanded = expanded.has(alert.id);
              return (
                <Tbody key={alert.id} isExpanded={isExpanded}>
                  <Tr>
                    <Td
                      expand={{
                        rowIndex,
                        isExpanded,
                        onToggle: () =>
                          setExpanded((prev) => {
                            const next = new Set(prev);
                            if (next.has(alert.id)) next.delete(alert.id);
                            else next.add(alert.id);
                            return next;
                          }),
                        expandId: `alert-expand-${alert.id}`,
                      }}
                    />
                    <Td dataLabel="Name">
                      <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                        <Label color="purple" isCompact>
                          AR
                        </Label>
                        <Button
                          variant="link"
                          isInline
                          component={Link}
                          to={`/observe/alerts?q=${encodeURIComponent(alert.name)}&state=Firing`}
                        >
                          {alert.name}
                        </Button>
                      </Flex>
                    </Td>
                    <Td dataLabel="Severity">{severityLabel(alert)}</Td>
                    <Td dataLabel="Total">{alert.total}</Td>
                    <Td dataLabel="State">
                      <Flex gap={{ default: "gapXs" }} alignItems={{ default: "alignItemsCenter" }}>
                        <BellIcon aria-hidden />
                        <span>{alert.state}</span>
                      </Flex>
                    </Td>
                  </Tr>
                  <Tr isExpanded={isExpanded}>
                    <Td colSpan={5}>
                      <ExpandableRowContent>
                        <Content component="p">{alert.description}</Content>
                        <Content component="small">{alert.time}</Content>
                      </ExpandableRowContent>
                    </Td>
                  </Tr>
                </Tbody>
              );
            })}
          </Table>

          <Pagination
            itemCount={tableAlerts.length}
            page={page}
            perPage={perPage}
            onSetPage={(_e, p) => setPage(p)}
            onPerPageSelect={(_e, pp) => {
              setPerPage(pp);
              setPage(1);
            }}
            variant="bottom"
            className="ocs-alerting-page__pagination-bottom"
            titles={{ paginationAriaLabel: "Alerts pagination bottom" }}
          />
        </PageSection>
      ) : (
        <PageSection>
          <Content component="p">
            {activeTab === "silences" ? "Silences" : "Alerting rules"} — layout placeholder.
          </Content>
        </PageSection>
      )}
    </div>
  );
}
