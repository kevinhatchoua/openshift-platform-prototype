import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
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
  Flex,
  Gallery,
  GalleryItem,
  Label,
  Popover,
  SearchInput,
  Title,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import ListIcon from "@patternfly/react-icons/dist/esm/icons/list-icon";
import ThLargeIcon from "@patternfly/react-icons/dist/esm/icons/th-large-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import Breadcrumbs from "../../components/Breadcrumbs";
import {
  OcsNamedResourceDataView,
  PlainTableHeader,
} from "../../components/dataView/OcsPrototypeListTable";
import GitOpsSimpleDetailPage, { GitOpsNotFound } from "./GitOpsSimpleDetailPage";
import {
  argoInstancesForInstance,
  findArgoCd,
  gitopsDetailPath,
  instanceKeyOf,
  type ArgoCdRecord,
} from "./gitopsData";
import GitOpsPageHeader, { useGitOpsInstance } from "./GitOpsPageHeader";
import { GitOpsEditDeleteMenu, HealthStatus, ResourceName } from "./gitopsShared";

const CARD_THRESHOLD = 6;

export default function GitOpsArgoCdPage() {
  const navigate = useNavigate();
  const { instance } = useGitOpsInstance();
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<"all" | "Healthy" | "Degraded">("all");
  const [view, setView] = useState<"cards" | "list" | "auto">("auto");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return argoInstancesForInstance(instance).filter((inst) => {
      if (phase !== "all" && inst.status !== phase) return false;
      if (!q) return true;
      const blob = `${inst.name} ${inst.ns} ${inst.server} ${inst.version}`.toLowerCase();
      return blob.includes(q);
    });
  }, [query, phase, instance]);

  const resolvedView = view === "auto" ? (filtered.length > CARD_THRESHOLD ? "list" : "cards") : view;
  const totalCount = argoInstancesForInstance(instance).length;

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/overview" },
          { label: "ArgoCD Instances", path: "/gitops/argocd" },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <GitOpsPageHeader title="ArgoCD Instances" path="/gitops/argocd" />

          <Toolbar id="gitops-argocd-toolbar" className="ocs-gitops-argocd-toolbar">
            <ToolbarContent className="ocs-gitops-argocd-toolbar__filters">
              <ToolbarGroup variant="filter-group">
                <ToolbarItem>
                  <SearchInput
                    aria-label="Filter instances"
                    placeholder="Filter instances..."
                    value={query}
                    onChange={(_e, v) => setQuery(v)}
                    onClear={() => setQuery("")}
                  />
                </ToolbarItem>
                <ToolbarItem>
                  <ToggleGroup aria-label="Phase filter">
                    {(["all", "Healthy", "Degraded"] as const).map((p) => (
                      <ToggleGroupItem
                        key={p}
                        text={p === "all" ? "All phases" : p}
                        isSelected={phase === p}
                        onChange={() => setPhase(p)}
                      />
                    ))}
                  </ToggleGroup>
                </ToolbarItem>
              </ToolbarGroup>
            </ToolbarContent>
            <ToolbarContent className="ocs-gitops-argocd-toolbar__actions">
              <ToolbarGroup alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapMd" }}>
                <ToolbarItem variant="label" className="pf-v6-u-display-none pf-v6-u-display-inline-block-on-md">
                  {filtered.length} of {totalCount} instances
                  {filtered.length > CARD_THRESHOLD ? " — list view recommended" : ""}
                </ToolbarItem>
                <ToolbarItem>
                  <ToggleGroup aria-label="Instance view">
                    <ToggleGroupItem
                      icon={<ThLargeIcon />}
                      aria-label="Card view"
                      isSelected={resolvedView === "cards"}
                      onChange={() => setView("cards")}
                    />
                    <ToggleGroupItem
                      icon={<ListIcon />}
                      aria-label="List view"
                      isSelected={resolvedView === "list"}
                      onChange={() => setView("list")}
                    />
                  </ToggleGroup>
                </ToolbarItem>
                <ToolbarItem>
                  <Button variant="primary" onClick={() => navigate("/gitops/create?kind=argocd")}>
                    Create Argo CD
                  </Button>
                </ToolbarItem>
              </ToolbarGroup>
            </ToolbarContent>
          </Toolbar>

          {resolvedView === "cards" ? (
            <Gallery hasGutter minWidths={{ default: "280px", md: "320px" }}>
              {filtered.map((inst) => (
                <GalleryItem key={instanceKeyOf(inst)}>
                  <InstanceCard inst={inst} onOpen={() => navigate(gitopsDetailPath("argocd", inst.ns, inst.name))} />
                </GalleryItem>
              ))}
            </Gallery>
          ) : (
            <OcsNamedResourceDataView
              ouiaId="gitops-argocd-data-view"
              ariaLabel="ArgoCD Instances"
              itemsLabel="instances"
              items={filtered}
              getName={(item) => item.name}
            >
              {(rows) => (
                <>
                  <Thead>
                    <Tr>
                      <Th dataLabel="Name">
                        <PlainTableHeader label="Name" />
                      </Th>
                      <Th dataLabel="Namespace">
                        <PlainTableHeader label="Namespace" />
                      </Th>
                      <Th dataLabel="Status">
                        <PlainTableHeader label="Status" />
                      </Th>
                      <Th dataLabel="App count">
                        <PlainTableHeader label="App count" />
                      </Th>
                      <Th dataLabel="Version">
                        <PlainTableHeader label="Version" />
                      </Th>
                      <Th dataLabel="Created">
                        <PlainTableHeader label="Created" />
                      </Th>
                      <Th modifier="fitContent" dataLabel="Actions">
                        <PlainTableHeader label="Actions" />
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {rows.map((inst) => {
                      const href = gitopsDetailPath("argocd", inst.ns, inst.name);
                      return (
                        <Tr key={instanceKeyOf(inst)} onClick={() => navigate(href)}>
                          <Td dataLabel="Name">
                            <ResourceName kind="ArgoCD" name={inst.name} to={href} />
                          </Td>
                          <Td dataLabel="Namespace">
                            <ResourceName kind="Namespace" name={inst.ns} />
                          </Td>
                          <Td dataLabel="Status">
                            <HealthStatus status={inst.status === "Healthy" ? "Healthy" : "Degraded"} />
                          </Td>
                          <Td dataLabel="App count">{inst.applications}</Td>
                          <Td dataLabel="Version">{inst.version}</Td>
                          <Td dataLabel="Created">{inst.created}</Td>
                          <Td dataLabel="Actions" isActionCell hasAction>
                            <GitOpsEditDeleteMenu kind="ArgoCD" name={inst.name} />
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </>
              )}
            </OcsNamedResourceDataView>
          )}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}

function InstanceCard({ inst, onOpen }: { inst: ArgoCdRecord; onOpen: () => void }) {
  const healthy = inst.status === "Healthy";
  const componentSummary = (Object.keys(inst.components) as Array<keyof typeof inst.components>)
    .map((comp) => `${comp}: ${inst.components[comp]}`)
    .join(" · ");

  return (
    <Card isClickable className="ocs-gitops-argocd-card">
      <CardHeader
        actions={{
          actions: (
            <span
              style={{ position: "relative", zIndex: 2 }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <GitOpsEditDeleteMenu kind="ArgoCD" name={inst.name} />
            </span>
          ),
        }}
        selectableActions={{
          onClickAction: onOpen,
          selectableActionAriaLabel: `Open ${inst.name}`,
        }}
      >
        <CardTitle>
          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
            <span>{inst.name}</span>
            <Label color={healthy ? "green" : "red"} isCompact>
              {healthy ? "Healthy" : "Degraded"}
            </Label>
          </Flex>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <DescriptionList isCompact className="ocs-gitops-argocd-card__summary">
          <DescriptionListGroup>
            <DescriptionListTerm>Namespace</DescriptionListTerm>
            <DescriptionListDescription>{inst.ns}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Applications</DescriptionListTerm>
            <DescriptionListDescription>{inst.applications}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Version</DescriptionListTerm>
            <DescriptionListDescription>{inst.version}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Created</DescriptionListTerm>
            <DescriptionListDescription>{inst.created}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
        <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }} className="pf-v6-u-mt-sm">
          {healthy ? (
            <CheckCircleIcon className="pf-v6-u-color-success" aria-hidden />
          ) : (
            <ExclamationCircleIcon className="pf-v6-u-color-danger" aria-hidden />
          )}
          <Content component="small" className="pf-v6-u-color-200">
            {healthy ? "All components healthy" : "One or more components degraded"}
            {inst.failedSyncs24h > 0 ? ` · ${inst.failedSyncs24h} failed syncs (24h)` : ""}
          </Content>
          <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <Popover
              aria-label={`${inst.name} instance details`}
              headerContent={<Title headingLevel="h4" size="md">{inst.name}</Title>}
              bodyContent={
                <DescriptionList isCompact>
                  <DescriptionListGroup>
                    <DescriptionListTerm>URL</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Button
                        variant="link"
                        isInline
                        component="a"
                        href={inst.server}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {inst.server}
                      </Button>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Resource requests</DescriptionListTerm>
                    <DescriptionListDescription>
                      CPU {inst.cpu} · Memory {inst.memory}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Sync activity</DescriptionListTerm>
                    <DescriptionListDescription>
                      {inst.successfulSyncs} successful · {inst.failedSyncs24h} failed (24h)
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Cluster connectivity</DescriptionListTerm>
                    <DescriptionListDescription>{inst.clusterConnectivity}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Repo pending requests</DescriptionListTerm>
                    <DescriptionListDescription>{inst.repoPending}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Components</DescriptionListTerm>
                    <DescriptionListDescription>{componentSummary}</DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              }
            >
              <Button variant="link" isInline size="sm">View details</Button>
            </Popover>
          </span>
        </Flex>
      </CardBody>
    </Card>
  );
}

export function GitOpsArgoCdDetailPage() {
  const { namespace = "", name = "" } = useParams();
  const rec = findArgoCd(decodeURIComponent(namespace), decodeURIComponent(name));
  if (!rec) return <GitOpsNotFound listPath="/gitops/argocd" listTitle="ArgoCD Instances" />;
  return (
    <GitOpsSimpleDetailPage
      kindLabel="Argo CD"
      listPath="/gitops/argocd"
      listTitle="ArgoCD Instances"
      resourceKind="ArgoCD"
      detailKind="argocd"
      title={rec.name}
      ns={rec.ns}
      status={rec.status}
      extraActions={[
        { id: "sync", label: "Refresh" },
        { id: "open-ui", label: "Open Argo CD UI" },
      ]}
      fields={[
        { term: "Name", value: rec.name },
        { term: "Namespace", value: rec.ns },
        { term: "Server", value: rec.server },
        { term: "Version", value: rec.version },
        { term: "Applications", value: rec.applications },
        { term: "CPU", value: rec.cpu },
        { term: "Memory", value: rec.memory },
        { term: "Cluster connectivity", value: rec.clusterConnectivity },
        { term: "Created", value: rec.created },
      ]}
      footnote={
        <Content component="small">
          Component health:{" "}
          {(Object.keys(rec.components) as Array<keyof typeof rec.components>)
            .map((c) => `${c}=${rec.components[c]}`)
            .join(" · ")}
        </Content>
      }
    />
  );
}
