import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
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
  Label,
  NotificationBadge,
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerGroup,
  NotificationDrawerGroupList,
  NotificationDrawerList,
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
  PageSection,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import BellIcon from "@patternfly/react-icons/dist/esm/icons/bell-icon";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import ExclamationTriangleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";

/** Consult mock for HPUX-1923 / OCPBUGS-84497 — uses full OCP Layout shell. */
const TOTAL_ALERTS = 2413;
const DRAWER_CAP = 50;
const BADGE_LABEL = "999+";
const ALERTS_HREF = "/observe/alerts";

type Severity = "danger" | "warning" | "info";
type View = "overview" | "badge" | "drawer";

type MockAlert = {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  time: string;
};

const SEVERITY_COUNTS = { critical: 812, warning: 1401, info: 200 } as const;

function buildDrawerAlerts(count: number): MockAlert[] {
  const severities: Severity[] = ["danger", "warning", "info"];
  return Array.from({ length: count }, (_, i) => {
    const severity = severities[i % 3];
    return {
      id: `alert-${i}`,
      title: severity === "danger" ? "StressTestAlert" : severity === "warning" ? "Watchdog" : "InfoAlert",
      description: `High volume alert on pod sample-workload-${i}`,
      severity,
      time: `${(i % 50) + 1} min ago`,
    };
  });
}

function parseView(raw: string | null): View {
  if (raw === "badge" || raw === "drawer" || raw === "overview") return raw;
  return "overview";
}

export default function AlertVolumeMockPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = parseView(searchParams.get("view"));
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(view === "drawer");
  const [expandedGroup, setExpandedGroup] = useState<"critical" | "warning" | "info" | null>("critical");

  const drawerAlerts = useMemo(() => buildDrawerAlerts(DRAWER_CAP), []);
  const bySeverity = useMemo(
    () => ({
      danger: drawerAlerts.filter((a) => a.severity === "danger").slice(0, 8),
      warning: drawerAlerts.filter((a) => a.severity === "warning").slice(0, 8),
      info: drawerAlerts.filter((a) => a.severity === "info").slice(0, 8),
    }),
    [drawerAlerts]
  );

  const setView = (next: View) => {
    setSearchParams({ view: next });
    setIsDrawerExpanded(next === "drawer");
  };

  const closeDrawer = () => {
    setIsDrawerExpanded(false);
    setSearchParams({ view: view === "drawer" ? "overview" : view });
  };

  const toggleGroup = (group: "critical" | "warning" | "info", nextExpanded: boolean) => {
    setExpandedGroup(nextExpanded ? group : null);
  };

  const panelContent = (
    <DrawerPanelContent widths={{ default: "width_33", lg: "width_33" }} data-testid="alert-volume-drawer">
      <DrawerHead>
        <Title headingLevel="h2" size="lg">
          Notifications
        </Title>
        <Content component="small">{`${DRAWER_CAP} of ${TOTAL_ALERTS.toLocaleString()} shown`}</Content>
        <DrawerActions>
          <DrawerCloseButton onClose={closeDrawer} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>
        <NotificationDrawer>
          <NotificationDrawerBody>
            <Alert
              isInline
              variant="info"
              title={`Showing ${DRAWER_CAP} of ${TOTAL_ALERTS.toLocaleString()} alerts`}
              actionLinks={
                <Button variant="link" isInline component={Link} to={ALERTS_HREF}>
                  View all alerts
                </Button>
              }
            >
              <Content component="p">
                Bounded recent set keeps the console responsive. Open the alerts feed for the full list.
              </Content>
            </Alert>
            <NotificationDrawerGroupList>
              <NotificationDrawerGroup
                title="Critical"
                count={SEVERITY_COUNTS.critical}
                isExpanded={expandedGroup === "critical"}
                onExpand={(_e, v) => toggleGroup("critical", v)}
              >
                <NotificationDrawerList aria-label="Critical notifications">
                  {bySeverity.danger.map((alert) => (
                    <NotificationDrawerListItem key={alert.id} variant="danger">
                      <NotificationDrawerListItemHeader variant="danger" title={alert.title} srTitle="Critical alert:" />
                      <NotificationDrawerListItemBody timestamp={alert.time}>{alert.description}</NotificationDrawerListItemBody>
                    </NotificationDrawerListItem>
                  ))}
                </NotificationDrawerList>
              </NotificationDrawerGroup>
              <NotificationDrawerGroup
                title="Warning"
                count={SEVERITY_COUNTS.warning}
                isExpanded={expandedGroup === "warning"}
                onExpand={(_e, v) => toggleGroup("warning", v)}
              >
                <NotificationDrawerList aria-label="Warning notifications">
                  {bySeverity.warning.map((alert) => (
                    <NotificationDrawerListItem key={alert.id} variant="warning">
                      <NotificationDrawerListItemHeader variant="warning" title={alert.title} srTitle="Warning alert:" />
                      <NotificationDrawerListItemBody timestamp={alert.time}>{alert.description}</NotificationDrawerListItemBody>
                    </NotificationDrawerListItem>
                  ))}
                </NotificationDrawerList>
              </NotificationDrawerGroup>
              <NotificationDrawerGroup
                title="Info"
                count={SEVERITY_COUNTS.info}
                isExpanded={expandedGroup === "info"}
                onExpand={(_e, v) => toggleGroup("info", v)}
              >
                <NotificationDrawerList aria-label="Info notifications">
                  {bySeverity.info.map((alert) => (
                    <NotificationDrawerListItem key={alert.id} variant="info">
                      <NotificationDrawerListItemHeader variant="info" title={alert.title} srTitle="Info alert:" />
                      <NotificationDrawerListItemBody timestamp={alert.time}>{alert.description}</NotificationDrawerListItemBody>
                    </NotificationDrawerListItem>
                  ))}
                </NotificationDrawerList>
              </NotificationDrawerGroup>
            </NotificationDrawerGroupList>
            <Flex justifyContent={{ default: "justifyContentCenter" }} style={{ padding: "1rem 0" }}>
              <Button variant="secondary" component={Link} to={ALERTS_HREF}>
                View all alerts
              </Button>
            </Flex>
          </NotificationDrawerBody>
        </NotificationDrawer>
      </DrawerPanelBody>
    </DrawerPanelContent>
  );

  return (
    <Drawer
      isExpanded={isDrawerExpanded}
      position="end"
      onExpand={() => {
        /* PF 6.5: panel finished expanding — keep shell/nav intact */
      }}
    >
      <DrawerContent panelContent={panelContent}>
        <DrawerContentBody>
          <PageSection>
            <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
              <Title headingLevel="h1" size="xl">
                High alert volume — UX mock (HPUX-1923)
              </Title>
              <Content component="p">
                Proposed behavior under ~{TOTAL_ALERTS.toLocaleString()} firing alerts. Full OCP navigation remains available
                in the sidebar.
              </Content>
              <Toolbar id="alert-volume-mock-toolbar">
                <ToolbarContent>
                  <ToolbarGroup>
                    <ToolbarItem>
                      <Button variant={view === "overview" ? "primary" : "secondary"} onClick={() => setView("overview")}>
                        Overview summary
                      </Button>
                    </ToolbarItem>
                    <ToolbarItem>
                      <Button variant={view === "badge" ? "primary" : "secondary"} onClick={() => setView("badge")}>
                        Badge 999+
                      </Button>
                    </ToolbarItem>
                    <ToolbarItem>
                      <Button variant={view === "drawer" ? "primary" : "secondary"} onClick={() => setView("drawer")}>
                        Capped drawer
                      </Button>
                    </ToolbarItem>
                  </ToolbarGroup>
                  <ToolbarGroup align={{ default: "alignEnd" }}>
                    <ToolbarItem>
                      <NotificationBadge
                        variant="attention"
                        isExpanded={isDrawerExpanded}
                        aria-label={`${BADGE_LABEL} notifications`}
                        data-testid="alert-volume-badge"
                        onClick={() => {
                          const next = !isDrawerExpanded;
                          setIsDrawerExpanded(next);
                          setSearchParams({ view: next ? "drawer" : "badge" });
                        }}
                      >
                        {BADGE_LABEL}
                      </NotificationBadge>
                    </ToolbarItem>
                  </ToolbarGroup>
                </ToolbarContent>
              </Toolbar>
            </Flex>
          </PageSection>

          <PageSection data-testid="alert-volume-overview">
            <Card isFullHeight>
              <CardHeader
                actions={{
                  actions: (
                    <Button variant="link" component={Link} to={ALERTS_HREF} isInline>
                      View all alerts
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
                  <Flex gap={{ default: "gapLg" }} alignItems={{ default: "alignItemsCenter" }} flexWrap={{ default: "wrap" }}>
                    <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                      <CheckCircleIcon color="var(--pf-t--global--icon--color--status--success--default)" />
                      <Content component="p">Cluster</Content>
                    </Flex>
                    <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                      <CheckCircleIcon color="var(--pf-t--global--icon--color--status--success--default)" />
                      <Content component="p">Control Plane</Content>
                    </Flex>
                    <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                      <InfoCircleIcon color="var(--pf-t--global--icon--color--status--info--default)" />
                      <Content component="p">Operators</Content>
                    </Flex>
                  </Flex>

                  <Alert isInline variant="danger" title={`${TOTAL_ALERTS.toLocaleString()} firing alerts`}>
                    <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
                      <Content component="p">
                        Summary only — individual alert rows are not rendered on Overview when volume is high.
                      </Content>
                      <Flex gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
                        <Label color="red" icon={<ExclamationCircleIcon />}>
                          {SEVERITY_COUNTS.critical.toLocaleString()} Critical
                        </Label>
                        <Label color="orange" icon={<ExclamationTriangleIcon />}>
                          {SEVERITY_COUNTS.warning.toLocaleString()} Warning
                        </Label>
                        <Label color="blue" icon={<InfoCircleIcon />}>
                          {SEVERITY_COUNTS.info.toLocaleString()} Info
                        </Label>
                      </Flex>
                      <FlexItem>
                        <Button variant="link" isInline component={Link} to={ALERTS_HREF}>
                          View all alerts
                        </Button>
                      </FlexItem>
                    </Flex>
                  </Alert>
                </Flex>
              </CardBody>
            </Card>
          </PageSection>

          {view === "badge" ? (
            <PageSection>
              <Alert isInline variant="info" title="Badge proposal">
                Masthead / toolbar shows a capped count ({BADGE_LABEL}) with attention styling. Exact counts display until
                the threshold; the badge does not require mounting the full alert list.
              </Alert>
            </PageSection>
          ) : null}
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
}
