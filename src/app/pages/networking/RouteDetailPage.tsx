import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Label,
  MenuToggle,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import {
  EndpointHealthCell,
  deriveEndpointHealth,
} from "./EndpointHealthCell";
import {
  getRoute,
  routeDetailPath,
  routeYaml,
  serviceDetailPath,
} from "./networkingMockData";
import { NETWORKING_CRUMB as CRUMB } from "./networkingShared";

export default function RouteDetailPage() {
  const { namespace = "", name = "" } = useParams();
  const decodedNs = decodeURIComponent(namespace);
  const decodedName = decodeURIComponent(name);
  const route = getRoute(decodedNs, decodedName);
  const [activeTab, setActiveTab] = useState("details");
  const [actionsOpen, setActionsOpen] = useState(false);

  if (!route) {
    return (
      <div className="ocs-app-page-outer w-full">
        <Breadcrumbs
          items={[
            { label: "Home", path: "/" },
            CRUMB,
            { label: "Routes", path: "/networking/routes" },
            { label: "Not found" },
          ]}
        >
          <Title headingLevel="h1" size="2xl">
            Route not found
          </Title>
          <Button variant="link" component={Link} to="/networking/routes" className="pf-v6-u-mt-md">
            Back to Routes
          </Button>
        </Breadcrumbs>
      </div>
    );
  }

  const detailPath = routeDetailPath(route.namespace, route.name);
  const health = deriveEndpointHealth(
    route.endpointReady,
    route.endpointTotal,
    route.endpointHealthLoaded !== false
  );

  return (
    <div className="ocs-app-page-outer ocs-net-detail-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          CRUMB,
          { label: "Routes", path: "/networking/routes" },
          { label: "Route details" },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
              <Label color="blue" isCompact className="ocs-resource-label">
                RT
              </Label>
              <Title headingLevel="h1" size="2xl">
                {route.name}
              </Title>
              <FavoriteButton name={route.name} path={detailPath} />
            </Flex>
            <Dropdown
              isOpen={actionsOpen}
              onOpenChange={setActionsOpen}
              toggle={(toggleRef) => (
                <MenuToggle ref={toggleRef} onClick={() => setActionsOpen((o) => !o)} isExpanded={actionsOpen}>
                  Actions
                </MenuToggle>
              )}
            >
              <DropdownList>
                <DropdownItem>Edit Route</DropdownItem>
                <DropdownItem>Delete Route</DropdownItem>
              </DropdownList>
            </Dropdown>
          </Flex>

          <Tabs
            activeKey={activeTab}
            onSelect={(_e, key) => setActiveTab(String(key))}
            aria-label="Route details"
          >
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
            <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
          </Tabs>

          {activeTab === "details" ? (
            <section className="ocs-node-details__panel app-glass-panel" aria-label="Route details">
              <Title headingLevel="h2" size="xl" className="ocs-pod-details__section-title">
                Route details
              </Title>
              <DescriptionList isHorizontal isCompact className="ocs-node-details__dl">
                <DescriptionListGroup>
                  <DescriptionListTerm>Name</DescriptionListTerm>
                  <DescriptionListDescription>{route.name}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Namespace</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Button variant="link" isInline>
                      {route.namespace}
                    </Button>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Hostname</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Content component="p" className="pf-v6-u-mb-0 ocs-pods-list__mono">
                      {route.host}
                    </Content>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Service</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Button
                      variant="link"
                      isInline
                      component={Link}
                      to={serviceDetailPath(route.serviceNamespace, route.serviceName)}
                    >
                      {route.serviceName}
                    </Button>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Health</DescriptionListTerm>
                  <DescriptionListDescription>
                    <EndpointHealthCell health={health} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Location</DescriptionListTerm>
                  <DescriptionListDescription>{route.location}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>TLS termination</DescriptionListTerm>
                  <DescriptionListDescription>{route.tlsTermination}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </section>
          ) : null}

          {activeTab === "yaml" ? (
            <section className="ocs-node-details__panel app-glass-panel" aria-label="Route YAML">
              <pre className="ocs-net-yaml">{routeYaml(route)}</pre>
            </section>
          ) : null}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
