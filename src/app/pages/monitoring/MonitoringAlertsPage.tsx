import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import {
  DataList,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Flex,
  Label,
  PageSection,
  SearchInput,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
  Content,
  Button,
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
} from "@patternfly/react-core";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import ExclamationTriangleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";
import FavoriteButton from "../../components/FavoriteButton";

type Severity = "critical" | "warning" | "info";
type ResourceKind = "VM" | "Node" | "Network";

type AlertFeedItem = {
  id: string;
  name: string;
  severity: Severity;
  time: string;
  description: string;
  namespace: string;
  resourceKind: ResourceKind;
  resourceName: string;
  topologyPath: string;
};

const FEED: AlertFeedItem[] = [
  {
    id: "1",
    name: "StressTestAlert",
    severity: "critical",
    time: "2 min ago",
    description: "High volume alert on pod sample-workload-0",
    namespace: "openshift-monitoring",
    resourceKind: "VM",
    resourceName: "fedora-db-01",
    topologyPath: "/networking/topology?focus=vm:default/fedora-db-01",
  },
  {
    id: "2",
    name: "Watchdog",
    severity: "warning",
    time: "8 min ago",
    description: "Alerting pipeline is silent longer than expected",
    namespace: "openshift-monitoring",
    resourceKind: "Node",
    resourceName: "worker-0",
    topologyPath: "/networking/topology?focus=node:worker-0",
  },
  {
    id: "3",
    name: "CannotRetrieveUpdates",
    severity: "warning",
    time: "Mar 3, 2026, 10:37 AM",
    description:
      "Failure to retrieve updates means cluster administrators must monitor for available updates on their own.",
    namespace: "openshift-cluster-version",
    resourceKind: "Node",
    resourceName: "master-0",
    topologyPath: "/networking/topology?focus=node:master-0",
  },
  {
    id: "4",
    name: "NetworkInterfaceDown",
    severity: "critical",
    time: "15 min ago",
    description: "Secondary network interface is not ready on the attached workload",
    namespace: "production",
    resourceKind: "Network",
    resourceName: "nad-sriov-dpdk",
    topologyPath: "/networking/topology?focus=nad:production/nad-sriov-dpdk",
  },
  {
    id: "5",
    name: "KubePodNotReady",
    severity: "info",
    time: "22 min ago",
    description: "Pod has been in a non-ready state for more than 15 minutes",
    namespace: "default",
    resourceKind: "VM",
    resourceName: "web-frontend",
    topologyPath: "/networking/topology?focus=vm:default/web-frontend",
  },
  {
    id: "6",
    name: "AlertmanagerReceiversNotConfigured",
    severity: "info",
    time: "Mar 3, 2026, 10:36 AM",
    description: "Alerts are not configured to be sent to a notification system.",
    namespace: "openshift-monitoring",
    resourceKind: "Network",
    resourceName: "cluster-monitoring",
    topologyPath: "/networking/topology",
  },
];

const SEVERITY_META: Record<
  Severity,
  { label: string; color: "red" | "orange" | "blue"; icon: ReactNode }
> = {
  critical: { label: "Critical", color: "red", icon: <ExclamationCircleIcon /> },
  warning: { label: "Warning", color: "orange", icon: <ExclamationTriangleIcon /> },
  info: { label: "Info", color: "blue", icon: <InfoCircleIcon /> },
};

export default function MonitoringAlertsPage() {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [severityOpen, setSeverityOpen] = useState(false);
  const [namespace, setNamespace] = useState<string>("all");
  const [nsOpen, setNsOpen] = useState(false);
  const [resourceType, setResourceType] = useState<ResourceKind | "all">("all");
  const [typeOpen, setTypeOpen] = useState(false);

  const namespaces = useMemo(
    () => Array.from(new Set(FEED.map((a) => a.namespace))).sort(),
    []
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FEED.filter((a) => {
      if (severity !== "all" && a.severity !== severity) return false;
      if (namespace !== "all" && a.namespace !== namespace) return false;
      if (resourceType !== "all" && a.resourceKind !== resourceType) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.resourceName.toLowerCase().includes(q) ||
        a.namespace.toLowerCase().includes(q)
      );
    });
  }, [search, severity, namespace, resourceType]);

  const grouped = useMemo(() => {
    const order: Severity[] = ["critical", "warning", "info"];
    return order
      .map((sev) => ({
        severity: sev,
        items: filtered.filter((a) => a.severity === sev),
      }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  const labels = [
    ...(severity !== "all" ? [`Severity: ${SEVERITY_META[severity].label}`] : []),
    ...(namespace !== "all" ? [`Namespace: ${namespace}`] : []),
    ...(resourceType !== "all" ? [`Resource type: ${resourceType}`] : []),
    ...(search.trim() ? [`Name: ${search.trim()}`] : []),
  ];

  return (
    <>
      <PageSection>
        <Flex
          justifyContent={{ default: "justifyContentSpaceBetween" }}
          alignItems={{ default: "alignItemsCenter" }}
          flexWrap={{ default: "wrap" }}
          gap={{ default: "gapMd" }}
        >
          <div>
            <Title headingLevel="h1">Alerts</Title>
            <Content component="p">
              Notification feed for firing alerts. Use resource badges to open related objects on the topology map.
            </Content>
          </div>
          <FavoriteButton name="Alerts" path="/monitoring/alerts" />
        </Flex>
      </PageSection>

      <PageSection>
        <Toolbar id="monitoring-alerts-toolbar" clearAllFilters={() => {
          setSearch("");
          setSeverity("all");
          setNamespace("all");
          setResourceType("all");
        }}>
          <ToolbarContent>
            <ToolbarGroup variant="filter-group">
              <ToolbarFilter
                categoryName="Name"
                labels={search.trim() ? [search.trim()] : []}
                deleteLabel={() => setSearch("")}
                deleteLabelGroup={() => setSearch("")}
              >
                <SearchInput
                  placeholder="Filter by name..."
                  value={search}
                  onChange={(_e, v) => setSearch(v)}
                  onClear={() => setSearch("")}
                  aria-label="Filter alerts by name"
                />
              </ToolbarFilter>

              <ToolbarFilter
                categoryName="Status"
                labels={severity !== "all" ? [SEVERITY_META[severity].label] : []}
                deleteLabel={() => setSeverity("all")}
                deleteLabelGroup={() => setSeverity("all")}
              >
                <Select
                  isOpen={severityOpen}
                  selected={severity}
                  onOpenChange={setSeverityOpen}
                  onSelect={(_e, v) => {
                    setSeverity(String(v) as Severity | "all");
                    setSeverityOpen(false);
                  }}
                  toggle={(toggleRef) => (
                    <MenuToggle ref={toggleRef} onClick={() => setSeverityOpen((o) => !o)} isExpanded={severityOpen}>
                      {severity === "all" ? "Status" : SEVERITY_META[severity].label}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    <SelectOption value="all">All statuses</SelectOption>
                    <SelectOption value="critical">Critical</SelectOption>
                    <SelectOption value="warning">Warning</SelectOption>
                    <SelectOption value="info">Info</SelectOption>
                  </SelectList>
                </Select>
              </ToolbarFilter>

              <ToolbarFilter
                categoryName="Namespace"
                labels={namespace !== "all" ? [namespace] : []}
                deleteLabel={() => setNamespace("all")}
                deleteLabelGroup={() => setNamespace("all")}
              >
                <Select
                  isOpen={nsOpen}
                  selected={namespace}
                  onOpenChange={setNsOpen}
                  onSelect={(_e, v) => {
                    setNamespace(String(v));
                    setNsOpen(false);
                  }}
                  toggle={(toggleRef) => (
                    <MenuToggle ref={toggleRef} onClick={() => setNsOpen((o) => !o)} isExpanded={nsOpen}>
                      {namespace === "all" ? "Namespace" : namespace}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    <SelectOption value="all">All namespaces</SelectOption>
                    {namespaces.map((ns) => (
                      <SelectOption key={ns} value={ns}>
                        {ns}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarFilter>

              <ToolbarFilter
                categoryName="Resource type"
                labels={resourceType !== "all" ? [resourceType] : []}
                deleteLabel={() => setResourceType("all")}
                deleteLabelGroup={() => setResourceType("all")}
              >
                <Select
                  isOpen={typeOpen}
                  selected={resourceType}
                  onOpenChange={setTypeOpen}
                  onSelect={(_e, v) => {
                    setResourceType(String(v) as ResourceKind | "all");
                    setTypeOpen(false);
                  }}
                  toggle={(toggleRef) => (
                    <MenuToggle ref={toggleRef} onClick={() => setTypeOpen((o) => !o)} isExpanded={typeOpen}>
                      {resourceType === "all" ? "Resource type" : resourceType}
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    <SelectOption value="all">All resource types</SelectOption>
                    <SelectOption value="VM">VM</SelectOption>
                    <SelectOption value="Node">Node</SelectOption>
                    <SelectOption value="Network">Network</SelectOption>
                  </SelectList>
                </Select>
              </ToolbarFilter>
            </ToolbarGroup>
            <ToolbarItem>
              <Content component="small">
                {filtered.length} of {FEED.length} alerts
                {labels.length ? ` · ${labels.join(", ")}` : ""}
              </Content>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {grouped.length === 0 ? (
          <Content component="p">No alerts match the current filters.</Content>
        ) : (
          grouped.map((group) => {
            const meta = SEVERITY_META[group.severity];
            return (
              <Flex key={group.severity} direction={{ default: "column" }} gap={{ default: "gapMd" }} style={{ marginTop: "1.5rem" }}>
                <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
                  <Label color={meta.color} icon={meta.icon}>
                    {meta.label}
                  </Label>
                  <Content component="small">{group.items.length}</Content>
                </Flex>
                <DataList aria-label={`${meta.label} alerts`} isCompact>
                  {group.items.map((alert) => (
                    <DataListItem key={alert.id} id={alert.id}>
                      <DataListItemRow>
                        <DataListItemCells
                          dataListCells={[
                            <DataListCell key="main" width={4}>
                              <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                                <Content component="p" style={{ fontWeight: 600, margin: 0 }}>
                                  {alert.name}
                                </Content>
                                <Content component="small">{alert.time}</Content>
                                <Content component="p">{alert.description}</Content>
                              </Flex>
                            </DataListCell>,
                            <DataListCell key="resource" width={2} alignRight>
                              <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsFlexEnd" }}>
                                <Label color="grey" isCompact>
                                  {alert.namespace}
                                </Label>
                                <Button variant="link" isInline component={Link} to={alert.topologyPath}>
                                  {alert.resourceKind}: {alert.resourceName}
                                </Button>
                              </Flex>
                            </DataListCell>,
                          ]}
                        />
                      </DataListItemRow>
                    </DataListItem>
                  ))}
                </DataList>
              </Flex>
            );
          })
        )}
      </PageSection>
    </>
  );
}
