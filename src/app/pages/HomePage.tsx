import { useMemo, useState } from "react";
import { Link } from "react-router";
import { usePatternFlyGlassActive } from "@/lib/usePatternFlyGlassActive";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Icon,
  Label,
  List,
  ListItem,
  MenuToggle,
  PageSection,
  Progress,
  Title,
} from "@patternfly/react-core";
import AngleDownIcon from "@patternfly/react-icons/dist/esm/icons/angle-down-icon";
import AngleUpIcon from "@patternfly/react-icons/dist/esm/icons/angle-up-icon";
import BellIcon from "@patternfly/react-icons/dist/esm/icons/bell-icon";
import ChartLineIcon from "@patternfly/react-icons/dist/esm/icons/chart-line-icon";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import CubesIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import ServerIcon from "@patternfly/react-icons/dist/esm/icons/server-icon";
import { useNotificationAlerts } from "../contexts/NotificationAlertsContext";

const inventoryItems = [
  { label: "Nodes", abbr: "N", color: "purple" as const, count: 6 },
  { label: "Pods", abbr: "P", color: "teal" as const, count: 273 },
  { label: "StorageClasses", abbr: "SC", color: "blue" as const, count: 2 },
  { label: "PersistentVolumeClaims", abbr: "PVC", color: "blue" as const, count: 0 },
];

const recentEvents = [
  { time: "12:52 PM", text: 'Pulling image "nginx"', badge: "P", color: "teal" as const, id: 1 },
  {
    time: "12:40 PM",
    text: "Back-off restarting failed container task-pv-container in pod task-pv-pod_robb(295e1f3c-bea0-42b7-b557-ce829dc542b6)",
    badge: "P",
    color: "teal" as const,
    id: 2,
  },
  { time: "12:14 PM", text: "Job completed", badge: "J", color: "blue" as const, id: 3 },
  {
    time: "11:53 PM",
    text: "Saw completed job: image-pruner-29543040, condition: Complete",
    badge: "CJ",
    color: "blue" as const,
    id: 4,
  },
  { time: "11:38 PM", text: "Created container: image-pruner", badge: "P", color: "teal" as const, id: 5 },
];

const statusRows: { label: string; status: "success" | "info"; path: string | null }[] = [
  { label: "Cluster", status: "success", path: "/administration/cluster-settings" },
  { label: "Control Plane", status: "success", path: null },
  { label: "Operators", status: "info", path: "/ecosystem/installed-operators" },
  { label: "Dynamic Plugins", status: "success", path: "/administration/dynamic-plugins" },
  { label: "Insights", status: "success", path: null },
];

function UtilizationToolbarDropdown({ label, menuId }: { label: string; menuId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onSelect={() => setIsOpen(false)}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          id={menuId}
          variant="secondary"
          onClick={() => setIsOpen((o) => !o)}
          isExpanded={isOpen}
          icon={isOpen ? <AngleUpIcon /> : <AngleDownIcon />}
        >
          {label}
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem itemId="1" onClick={() => setIsOpen(false)}>
          Option 1
        </DropdownItem>
        <DropdownItem itemId="2" onClick={() => setIsOpen(false)}>
          Option 2
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}

const utilizationRows: { name: string; detail: string; value: number }[] = [
  { name: "CPU", detail: "21.76 cores / 24 cores", value: Math.round((21.76 / 24) * 100) },
  { name: "Memory", detail: "29.79 GiB / 32.12 GiB", value: Math.round((29.79 / 32.12) * 100) },
  { name: "Filesystem", detail: "186.6 GiB / 718.7 GiB", value: Math.round((186.6 / 718.7) * 100) },
  { name: "Network transfer", detail: "5.10 MBps in / 5.16 MBps out", value: 45 },
];

function DetailsCard({ isGlass }: { isGlass: boolean }) {
  return (
    <Card isFullHeight isGlass={isGlass}>
      <CardHeader
        actions={{
          actions: (
            <Button variant="link" component={Link} to="/settings" isInline>
              View settings
            </Button>
          ),
        }}
      >
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }}>
          <ServerIcon />
          <CardTitle>Details</CardTitle>
        </Flex>
      </CardHeader>
      <CardBody>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>Cluster API address</DescriptionListTerm>
            <DescriptionListDescription>
              <Content component="small">
                <code>https://api.rhamilto.devcluster.openshift.com:6443</code>
              </Content>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Cluster ID</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                <Content component="small">
                  <code>03242ee9-8986-4f0f-acc0-65aad26ba6a5</code>
                </Content>
                <Content component="small">
                  <Button
                    variant="link"
                    isInline
                    component="a"
                    href="https://console.redhat.com/openshift"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OpenShift Cluster Manager
                  </Button>
                </Content>
              </Flex>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Infrastructure provider</DescriptionListTerm>
            <DescriptionListDescription>
              <Label color="orange">AWS</Label>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>OpenShift version</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex flexWrap={{ default: "wrap" }} gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                <Content component="small">
                  <code>4.21.0</code>
                </Content>
                <Button variant="link" isInline component={Link} to="/administration/cluster-settings">
                  Update available
                </Button>
              </Flex>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Service Level Agreement (SLA)</DescriptionListTerm>
            <DescriptionListDescription>
              <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                <Content component="p">Self-support, 60 day trial</Content>
                <Content component="p">Warning alert: 59 days remaining</Content>
                <Button
                  variant="link"
                  isInline
                  component="a"
                  href="https://console.redhat.com/openshift/subscriptions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Manage subscription settings
                </Button>
              </Flex>
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Update channel</DescriptionListTerm>
            <DescriptionListDescription>
              <Content component="small">
                <code>candidate-4.22</code>
              </Content>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
    </Card>
  );
}

function ClusterInventoryCard({ isGlass }: { isGlass: boolean }) {
  return (
    <Card isFullHeight isGlass={isGlass}>
      <CardHeader>
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }}>
          <CubesIcon />
          <CardTitle>
            <Button variant="link" isInline component={Link} to="/inventory">
              Cluster inventory
            </Button>
          </CardTitle>
        </Flex>
      </CardHeader>
      <CardBody>
        <List isPlain isBordered>
          {inventoryItems.map((item) => (
            <ListItem
              key={item.label}
              icon={
                <Label color={item.color} isCompact>
                  {item.abbr}
                </Label>
              }
            >
              <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} alignItems={{ default: "alignItemsCenter" }}>
                <FlexItem>{item.label}</FlexItem>
                <FlexItem>
                  <Label isCompact>{item.count}</Label>
                </FlexItem>
              </Flex>
            </ListItem>
          ))}
        </List>
      </CardBody>
    </Card>
  );
}

function ActivityCard({ isGlass }: { isGlass: boolean }) {
  return (
    <Card isFullHeight isGlass={isGlass}>
      <CardHeader
        actions={{
          actions: (
            <Button variant="link" component={Link} to="/activity/all" isInline>
              View all events
            </Button>
          ),
        }}
      >
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }}>
          <ListIcon />
          <CardTitle>Activity</CardTitle>
        </Flex>
      </CardHeader>
      <CardBody>
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <div>
            <Title headingLevel="h3" size="md">
              Ongoing
            </Title>
            <Content component="p">There are no ongoing activities.</Content>
          </div>
          <Divider />
          <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} alignItems={{ default: "alignItemsCenter" }}>
            <Title headingLevel="h3" size="md">
              Recent events
            </Title>
            <Button variant="link" isInline>
              Pause
            </Button>
          </Flex>
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            {recentEvents.map((event, index) => (
              <div key={event.id}>
                {index > 0 ? <Divider className="pf-v6-u-mb-md" /> : null}
                <Flex gap={{ default: "gapMd" }} alignItems={{ default: "alignItemsFlexStart" }}>
                  <Label color={event.color} isCompact>
                    {event.badge}
                  </Label>
                  <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                    <Content component="small">
                      <code>{event.time}</code>
                    </Content>
                    <Button variant="link" isInline component={Link} to={`/activity/${event.id}`}>
                      {event.text}
                    </Button>
                  </Flex>
                </Flex>
              </div>
            ))}
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
}

function StatusAlertRow({
  id,
  name,
  time,
  description,
  onDismiss,
}: {
  id: string;
  name: string;
  time: string;
  description: string;
  onDismiss: (id: string) => void;
}) {
  return (
    <Alert
      isInline
      title={name}
      variant="warning"
      actionLinks={
        <Flex gap={{ default: "gapSm" }}>
          <Button
            variant="link"
            isInline
            component={Link}
            to={`/observe/alerts?q=${encodeURIComponent(name)}&state=Firing`}
          >
            View details
          </Button>
          <Button variant="link" isInline onClick={() => onDismiss(id)}>
            Dismiss
          </Button>
        </Flex>
      }
    >
      <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
        <Content component="small">{time}</Content>
        <Content component="p">{description}</Content>
      </Flex>
    </Alert>
  );
}

function StatusCard({ isGlass }: { isGlass: boolean }) {
  const { alerts, dismiss } = useNotificationAlerts();
  const statusAlerts = useMemo(
    () =>
      alerts.filter(
        (a) => a.severity !== "recommendation" && a.state === "Firing" && (a.severity === "warning" || a.severity === "critical")
      ),
    [alerts]
  );

  return (
    <Card isGlass={isGlass}>
      <CardHeader
        actions={{
          actions: (
            <Button
              variant="link"
              component={Link}
              to="/observe/alerts?state=Firing&source=Platform"
              isInline
            >
              View alerts
            </Button>
          ),
        }}
      >
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }}>
          <BellIcon />
          <CardTitle>Status</CardTitle>
        </Flex>
      </CardHeader>
      <CardBody>
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex gap={{ default: "gapLg" }} flexWrap={{ default: "wrap" }}>
            {statusRows.map((row) => (
              <Flex key={row.label} gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                <Icon status={row.status === "success" ? "success" : "info"} size="sm">
                  {row.status === "success" ? <CheckCircleIcon /> : <InfoCircleIcon />}
                </Icon>
                {row.path ? (
                  <Button variant="link" isInline component={Link} to={row.path}>
                    {row.label}
                  </Button>
                ) : (
                  <Content component="p">{row.label}</Content>
                )}
              </Flex>
            ))}
          </Flex>

          <Alert isInline title="Cluster update available" variant="info">
            <Flex flexWrap={{ default: "wrap" }} gap={{ default: "gapMd" }} alignItems={{ default: "alignItemsCenter" }}>
              <Content component="p">4.21.0 → 4.22.0</Content>
              <Button variant="link" isInline component={Link} to="/administration/cluster-settings">
                Update plan
              </Button>
              <Button variant="link" isInline component={Link} to="/ecosystem/installed-operators">
                Installed Operators
              </Button>
            </Flex>
          </Alert>

          {statusAlerts.length > 0 ? (
            <>
              <Divider />
              <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
                {statusAlerts.map((alert) => (
                  <StatusAlertRow
                    key={alert.id}
                    id={alert.id}
                    name={alert.name}
                    time={alert.time}
                    description={alert.description}
                    onDismiss={dismiss}
                  />
                ))}
              </Flex>
            </>
          ) : null}
        </Flex>
      </CardBody>
    </Card>
  );
}

function ClusterUtilizationCard({ isGlass }: { isGlass: boolean }) {
  return (
    <Card isGlass={isGlass}>
      <CardHeader
        actions={{
          actions: (
            <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
              <UtilizationToolbarDropdown label="Filter by Node type" menuId="overview-node-type" />
              <UtilizationToolbarDropdown label="1 hour" menuId="overview-time-range" />
            </Flex>
          ),
        }}
      >
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }}>
          <ChartLineIcon />
          <CardTitle>Cluster utilization</CardTitle>
        </Flex>
      </CardHeader>
      <CardBody>
        <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
          <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} flexWrap={{ default: "wrap" }}>
            <Content component="p">
              <strong>Resource</strong>
            </Content>
            <Content component="p">
              <strong>Usage</strong>
            </Content>
            <Content component="small">
              <Flex gap={{ default: "gapXl" }}>
                <span>7:45 PM</span>
                <span>8:00 PM</span>
                <span>8:15 PM</span>
              </Flex>
            </Content>
          </Flex>
          <Divider />
          <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
            {utilizationRows.map((row) => (
              <div key={row.name}>
                <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                  <Content component="p">
                    <strong>{row.name}</strong>
                  </Content>
                  <Content component="small">
                    <code>{row.detail}</code>
                  </Content>
                  <Progress
                    value={row.value}
                    title=""
                    measureLocation="none"
                    aria-label={`${row.name} utilization`}
                  />
                </Flex>
                {row.name !== "Network transfer" ? <Divider /> : null}
              </div>
            ))}
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
}

export default function HomePage() {
  const isGlass = usePatternFlyGlassActive();

  return (
    <PageSection padding={{ default: "noPadding" }} className="ocs-app-page-chrome">
      <Grid hasGutter>
        <GridItem span={12} lg={3}>
          <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
            <DetailsCard isGlass={isGlass} />
            <ClusterInventoryCard isGlass={isGlass} />
          </Flex>
        </GridItem>
        <GridItem span={12} lg={6}>
          <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
            <StatusCard isGlass={isGlass} />
            <ClusterUtilizationCard isGlass={isGlass} />
          </Flex>
        </GridItem>
        <GridItem span={12} lg={3}>
          <ActivityCard isGlass={isGlass} />
        </GridItem>
      </Grid>
    </PageSection>
  );
}
