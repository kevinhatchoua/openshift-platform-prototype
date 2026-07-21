import { Link } from "react-router";
import {
  Badge,
  Button,
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Flex,
  NotificationDrawer,
  NotificationDrawerBody,
  NotificationDrawerList,
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
  SearchInput,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import CheckIcon from "@patternfly/react-icons/dist/esm/icons/check-icon";
import {
  useNotificationAlerts,
  type AlertSeverity,
  type ConsoleAlert,
} from "../../contexts/NotificationAlertsContext";
import { useMemo, useState } from "react";

/** Drawer tabs map 1:1 to alert severity (OCP notification model). */
type DrawerTab = "critical" | "warning" | "info";

const SEVERITY_TABS: { id: DrawerTab; label: string }[] = [
  { id: "critical", label: "Critical" },
  { id: "warning", label: "Warning" },
  { id: "info", label: "Info" },
];

function variantFor(severity: AlertSeverity): "danger" | "warning" | "info" | "custom" {
  if (severity === "critical") return "danger";
  if (severity === "warning" || severity === "recommendation") return "warning";
  return "info";
}

function NotificationCard({
  alert,
  onSilence,
}: {
  alert: ConsoleAlert;
  onSilence: (id: string) => void;
}) {
  const { markRead, dismiss } = useNotificationAlerts();
  return (
    <NotificationDrawerListItem
      variant={variantFor(alert.severity)}
      isRead={alert.isRead}
      onClick={() => markRead([alert.id], true)}
      className="ocs-console-notification-drawer__item"
    >
      <NotificationDrawerListItemHeader
        variant={variantFor(alert.severity)}
        title={alert.name}
        srTitle={`${alert.severity} alert:`}
      >
        {!alert.isRead ? (
          <span className="ocs-console-notification-drawer__unread-dot" aria-label="Unread" />
        ) : null}
      </NotificationDrawerListItemHeader>
      <NotificationDrawerListItemBody timestamp={alert.time}>
        <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
          <span className="ocs-console-notification-drawer__description">{alert.description}</span>
          <Flex gap={{ default: "gapMd" }} className="ocs-console-notification-drawer__actions">
            {alert.configPath ? (
              <Button
                variant="link"
                isInline
                component={Link}
                to={alert.configPath}
                onClick={(e) => e.stopPropagation()}
              >
                Configure
              </Button>
            ) : null}
            <Button
              variant="link"
              isInline
              onClick={(e) => {
                e.stopPropagation();
                onSilence(alert.id);
              }}
            >
              Silence
            </Button>
            <Button
              variant="link"
              isInline
              onClick={(e) => {
                e.stopPropagation();
                dismiss(alert.id);
              }}
            >
              Dismiss
            </Button>
          </Flex>
        </Flex>
      </NotificationDrawerListItemBody>
    </NotificationDrawerListItem>
  );
}

function severityBucket(severity: AlertSeverity): DrawerTab {
  if (severity === "critical") return "critical";
  if (severity === "info") return "info";
  // warning + recommendation (Insights-style) surface under Warning
  return "warning";
}

function tabAlerts(tab: DrawerTab, alerts: ConsoleAlert[], search: string): ConsoleAlert[] {
  const q = search.trim().toLowerCase();
  return alerts.filter((a) => {
    if (severityBucket(a.severity) !== tab) return false;
    if (!q) return true;
    return a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
  });
}

export default function ConsoleNotificationDrawerPanel({
  onSilenceRequest,
}: {
  onSilenceRequest: (ids: string[]) => void;
}) {
  const { setDrawerOpen, search, setSearch, alerts, markRead, observeAlertsHref } = useNotificationAlerts();
  const [activeTab, setActiveTab] = useState<DrawerTab>("warning");

  const counts = useMemo(() => {
    const next = { critical: 0, warning: 0, info: 0 };
    for (const a of alerts) {
      next[severityBucket(a.severity)] += 1;
    }
    return next;
  }, [alerts]);

  const visible = useMemo(() => tabAlerts(activeTab, alerts, search), [activeTab, alerts, search]);

  const markAllRead = () => {
    markRead(
      alerts.filter((a) => !a.isRead).map((a) => a.id),
      true
    );
  };

  return (
    <DrawerPanelContent
      widths={{ default: "width_50", lg: "width_33", xl: "width_33" }}
      className="ocs-console-notification-drawer"
      data-testid="console-notification-drawer"
    >
      <DrawerHead className="ocs-console-notification-drawer__head">
        <Flex
          justifyContent={{ default: "justifyContentSpaceBetween" }}
          alignItems={{ default: "alignItemsCenter" }}
          flexWrap={{ default: "nowrap" }}
          className="ocs-console-notification-drawer__title-row"
        >
          <Title headingLevel="h2" size="xl">
            Notifications
          </Title>
          <Button variant="link" isInline icon={<CheckIcon />} onClick={markAllRead}>
            Mark all as read
          </Button>
        </Flex>
        <DrawerActions>
          <DrawerCloseButton onClose={() => setDrawerOpen(false)} />
        </DrawerActions>
      </DrawerHead>

      <div className="ocs-console-notification-drawer__tabs">
        <Tabs
          activeKey={activeTab}
          onSelect={(_e, key) => setActiveTab(key as DrawerTab)}
          aria-label="Filter notifications by severity"
        >
          {SEVERITY_TABS.map((tab) => (
            <Tab
              key={tab.id}
              eventKey={tab.id}
              title={
                <TabTitleText>
                  {tab.label}{" "}
                  <Badge
                    isRead={counts[tab.id] === 0}
                    className="ocs-console-notification-drawer__tab-badge"
                  >
                    {counts[tab.id]}
                  </Badge>
                </TabTitleText>
              }
            />
          ))}
        </Tabs>
      </div>

      <div className="ocs-console-notification-drawer__search">
        <SearchInput
          placeholder="Search notifications..."
          value={search}
          onChange={(_e, v) => setSearch(v)}
          onClear={() => setSearch("")}
          aria-label="Search notifications"
        />
      </div>

      <DrawerPanelBody className="ocs-console-notification-drawer__body">
        <NotificationDrawer>
          <NotificationDrawerBody>
            {visible.length === 0 ? (
              <p className="ocs-console-notification-drawer__empty">No notifications in this view.</p>
            ) : (
              <NotificationDrawerList aria-label={`${activeTab} notifications`}>
                {visible.map((alert) => (
                  <NotificationCard key={alert.id} alert={alert} onSilence={(id) => onSilenceRequest([id])} />
                ))}
              </NotificationDrawerList>
            )}
          </NotificationDrawerBody>
        </NotificationDrawer>

        <div className="ocs-console-notification-drawer__footer">
          <Button
            variant="link"
            isInline
            component={Link}
            to={observeAlertsHref}
            onClick={() => setDrawerOpen(false)}
          >
            View all alerts in Observe →
          </Button>
        </div>
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
}
