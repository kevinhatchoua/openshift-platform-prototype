import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import {
  Alert,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Grid,
  GridItem,
  Label,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import {
  ConnectedVmTabBadge,
  NetworkVirtualMachinesTab,
} from "../../components/networking/NetworkVirtualMachinesTab";
import {
  getAttachedVmsForNetwork,
  getNad,
  getNetworkHealth,
  getUdn,
  nadDetailPath,
  nadYaml,
  networkResourcePath,
  udnDetailPath,
  udnYaml,
  type NetworkResourceRef,
} from "../networking/networkingMockData";
import { VIRT_CRUMB } from "./virtualizationMockData";

function resolveNetworkFromPath(pathname: string, params: Record<string, string | undefined>) {
  const name = decodeURIComponent(params.name ?? "");
  const namespace = params.namespace ? decodeURIComponent(params.namespace) : undefined;

  if (pathname.includes("/virtualmachinenetworks/nad/")) {
    const nad = getNad(namespace ?? "", name);
    if (!nad) return null;
    const ref: NetworkResourceRef = { kind: "NAD", name: nad.name, namespace: nad.namespace };
    return {
      ref,
      kindLabel: "NAD",
      labelColor: "blue" as const,
      title: nad.name,
      networkingPath: nadDetailPath(nad.namespace, nad.name),
      yaml: nadYaml(nad),
      details: (
        <>
          <DescriptionListGroup>
            <DescriptionListTerm>Namespace</DescriptionListTerm>
            <DescriptionListDescription>{nad.namespace}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Type</DescriptionListTerm>
            <DescriptionListDescription>{nad.type}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Network type</DescriptionListTerm>
            <DescriptionListDescription>{nad.networkType}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Description</DescriptionListTerm>
            <DescriptionListDescription>{nad.description}</DescriptionListDescription>
          </DescriptionListGroup>
        </>
      ),
    };
  }

  const isCluster = pathname.includes("/virtualmachinenetworks/cudn/");
  const udn = getUdn(name, namespace);
  if (!udn || (isCluster && udn.kind !== "CUDN") || (!isCluster && udn.kind === "CUDN")) return null;

  const ref: NetworkResourceRef =
    udn.kind === "CUDN" ? { kind: "CUDN", name: udn.name } : { kind: "UDN", name: udn.name, namespace: udn.namespace };

  return {
    ref,
    kindLabel: udn.kind,
    labelColor: "purple" as const,
    title: udn.name,
    networkingPath: networkResourcePath(ref),
    yaml: udnYaml(udn),
    details: (
      <>
        <DescriptionListGroup>
          <DescriptionListTerm>Namespace</DescriptionListTerm>
          <DescriptionListDescription>{udn.namespace ?? "—"}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Topology</DescriptionListTerm>
          <DescriptionListDescription>{udn.topology}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>MTU</DescriptionListTerm>
          <DescriptionListDescription>{udn.mtu}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Condition</DescriptionListTerm>
          <DescriptionListDescription>{udn.condition}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Description</DescriptionListTerm>
          <DescriptionListDescription>{udn.description}</DescriptionListDescription>
        </DescriptionListGroup>
      </>
    ),
  };
}

export default function VirtualMachineNetworkDetailPage() {
  const params = useParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("details");
  const [attachmentRev, setAttachmentRev] = useState(0);

  const network = useMemo(
    () => resolveNetworkFromPath(location.pathname, params),
    [location.pathname, params]
  );

  const vmCount = useMemo(
    () => (network ? getAttachedVmsForNetwork(network.ref).length : 0),
    [network, attachmentRev]
  );

  const health = network ? getNetworkHealth(network.ref) : "healthy";

  if (!network) {
    return (
      <div className="ocs-app-page-outer w-full">
        <Breadcrumbs
          items={[
            { label: "Home", path: "/" },
            VIRT_CRUMB,
            { label: "Virtual machine networks", path: "/virtualization/virtualmachinenetworks" },
            { label: "Not found" },
          ]}
        >
          <Title headingLevel="h1" size="2xl">
            Virtual machine network not found
          </Title>
          <Button variant="link" component={Link} to="/virtualization/virtualmachinenetworks" className="pf-v6-u-mt-md">
            Back to Virtual machine networks
          </Button>
        </Breadcrumbs>
      </div>
    );
  }

  const detailPath = location.pathname;

  return (
    <div className="ocs-app-page-outer ocs-vm-net-detail-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          VIRT_CRUMB,
          { label: "Virtual machine networks", path: "/virtualization/virtualmachinenetworks" },
          { label: network.title },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }} flexWrap={{ default: "wrap" }}>
            <Label color={network.labelColor} isCompact className="ocs-resource-label">
              {network.kindLabel}
            </Label>
            <Title headingLevel="h1" size="2xl">
              {network.title}
            </Title>
            <FavoriteButton name={network.title} path={detailPath} />
          </Flex>

          {health !== "healthy" ? (
            <Alert
              variant={health === "down" ? "danger" : "warning"}
              title={health === "down" ? "Network connectivity failure" : "Network degraded"}
              isInline
            >
              Connected virtual machines may show errors on their status page until connectivity is restored.{" "}
              <Button variant="link" isInline component={Link} to={network.networkingPath}>
                Open networking resource
              </Button>
            </Alert>
          ) : null}

          <Tabs
            activeKey={activeTab}
            onSelect={(_e, key) => setActiveTab(String(key))}
            aria-label="Virtual machine network details"
          >
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
            <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
            <Tab
              eventKey="connected-vms"
              title={
                <TabTitleText>
                  Connected virtual machines <ConnectedVmTabBadge count={vmCount} />
                </TabTitleText>
              }
            />
          </Tabs>

          {activeTab === "details" ? (
            <section className="ocs-node-details__panel app-glass-panel" aria-label="Network details">
              <Title headingLevel="h2" size="xl" className="ocs-pod-details__section-title">
                Network details
              </Title>
              <Grid hasGutter className="ocs-node-details__columns">
                <GridItem md={8}>
                  <DescriptionList isHorizontal isCompact className="ocs-node-details__dl">
                    <DescriptionListGroup>
                      <DescriptionListTerm>Name</DescriptionListTerm>
                      <DescriptionListDescription>{network.title}</DescriptionListDescription>
                    </DescriptionListGroup>
                    {network.details}
                    <DescriptionListGroup>
                      <DescriptionListTerm>Networking resource</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Button variant="link" isInline component={Link} to={network.networkingPath}>
                          View in Networking
                        </Button>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </GridItem>
              </Grid>
            </section>
          ) : null}

          {activeTab === "yaml" ? (
            <section className="ocs-node-details__panel app-glass-panel" aria-label="YAML">
              <pre className="ocs-net-yaml">{network.yaml}</pre>
            </section>
          ) : null}

          {activeTab === "connected-vms" ? (
            <NetworkVirtualMachinesTab
              networkRef={network.ref}
              networkName={network.title}
              onAttachmentsChange={() => setAttachmentRev((r) => r + 1)}
            />
          ) : null}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
