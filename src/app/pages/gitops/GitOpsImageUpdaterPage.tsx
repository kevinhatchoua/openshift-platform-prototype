import { useState } from "react";
import { useParams } from "react-router";
import {
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Label,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import { ConsoleYamlEditor } from "../../components/console/ConsoleYamlEditor";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { GitOpsSimpleListPage } from "./GitOpsSimpleListPage";
import { GitOpsNotFound } from "./GitOpsSimpleDetailPage";
import {
  findImageUpdater,
  gitopsDetailPath,
  imageUpdaterIsReady,
  imageUpdatersForInstance,
  type ImageUpdaterRecord,
} from "./gitopsData";
import { useGitOpsInstance } from "./GitOpsPageHeader";
import {
  GitOpsEditDeleteMenu,
  HealthStatus,
  ResourceName,
  type GitOpsActionItem,
} from "./gitopsShared";

const IMAGE_UPDATER_DETAIL_ACTIONS: GitOpsActionItem[] = [
  { id: "edit-labels", label: "Edit labels" },
  { id: "edit-annotations", label: "Edit annotations" },
];
import { ImageUpdaterRecentUpdatesTable } from "./imageUpdater/ImageUpdaterRecentUpdatesTable";
import { ImageUpdaterStatusSummary } from "./imageUpdater/ImageUpdaterStatusSummary";
import { ImageUpdaterTrackedImageCard } from "./imageUpdater/ImageUpdaterTrackedImageCard";
import { buildImageUpdaterYaml } from "./imageUpdaterYaml";

export default function GitOpsImageUpdaterPage() {
  const { instance } = useGitOpsInstance();
  return (
    <GitOpsSimpleListPage
      title="Image Updater"
      path="/gitops/imageupdaters"
      createLabel="Create ImageUpdater"
      kind="ImageUpdater"
      detailKind="imageupdaters"
      items={imageUpdatersForInstance(instance)}
      columns={[
        { key: "name", label: "Name" },
        { key: "namespace", label: "Namespace" },
        { key: "applicationsMatched", label: "Applications matched" },
        { key: "imagesManaged", label: "Images managed" },
        { key: "lastCheckedAt", label: "Last checked" },
        { key: "ready", label: "Ready" },
        { key: "age", label: "Age" },
      ]}
      renderCell={(item, key) => {
        if (key === "applicationsMatched") return item.applicationsMatched;
        if (key === "imagesManaged") return item.imagesManaged;
        if (key === "lastCheckedAt") return item.lastCheckedAt;
        if (key === "ready") {
          const ready = imageUpdaterIsReady(item);
          return (
            <Label color={ready ? "green" : "red"} isCompact>
              {ready ? "True" : "False"}
            </Label>
          );
        }
        if (key === "age") return item.age;
        return null;
      }}
      footnote={
        <Content component="small" className="pf-v6-u-color-200">
          List columns align with ImageUpdater <code>status</code> (GITOPS-11498 P1.5). Per-image update strategy is on
          the detail page.
        </Content>
      }
    />
  );
}

export function GitOpsImageUpdaterDetailPage() {
  const { namespace = "", name = "" } = useParams();
  const rec = findImageUpdater(decodeURIComponent(namespace), decodeURIComponent(name));
  if (!rec) return <GitOpsNotFound listPath="/gitops/imageupdaters" listTitle="Image Updater" />;
  return <ImageUpdaterDetailBody rec={rec} />;
}

function ImageUpdaterDetailBody({ rec }: { rec: ImageUpdaterRecord }) {
  const [activeTab, setActiveTab] = useState("details");
  const href = gitopsDetailPath("imageupdaters", rec.ns, rec.name);

  return (
    <div className="ocs-app-page-outer ocs-pod-details-page h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/rollouts" },
          { label: "Image Updater", path: "/gitops/imageupdaters" },
          { label: rec.name },
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
              <ResourceName kind="ImageUpdater" name={rec.name} />
              <HealthStatus status={rec.status} />
            </Flex>
            <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
              <FavoriteButton name={rec.name} path={href} />
              <GitOpsEditDeleteMenu
                kind="ImageUpdater"
                name={rec.name}
                variant="secondary"
                extraItems={IMAGE_UPDATER_DETAIL_ACTIONS}
              />
            </Flex>
          </Flex>

          <Tabs
            activeKey={activeTab}
            onSelect={(_e, key) => setActiveTab(String(key))}
            aria-label="Image Updater details"
          >
            <Tab eventKey="details" title={<TabTitleText>Details</TabTitleText>} />
            <Tab eventKey="update-strategy" title={<TabTitleText>Update strategy</TabTitleText>} />
            <Tab eventKey="recent-updates" title={<TabTitleText>Recent updates</TabTitleText>} />
            <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
          </Tabs>

          {activeTab === "details" ? (
            <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
              <DescriptionList isHorizontal isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>Name</DescriptionListTerm>
                  <DescriptionListDescription>{rec.name}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Namespace</DescriptionListTerm>
                  <DescriptionListDescription>{rec.ns}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Age</DescriptionListTerm>
                  <DescriptionListDescription>{rec.age}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>

              <Title headingLevel="h2" size="lg">
                Controller status
              </Title>
              <ImageUpdaterStatusSummary rec={rec} />
            </Flex>
          ) : null}

          {activeTab === "update-strategy" ? (
            <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
              <Content component="p" className="pf-v6-u-color-200 pf-v6-u-mb-0">
                {rec.trackedImages.length} image{rec.trackedImages.length === 1 ? "" : "s"} tracked · Last registry
                check {rec.lastCheckedAt}
              </Content>
              <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
                {rec.trackedImages.map((img) => (
                  <ImageUpdaterTrackedImageCard key={img.alias} image={img} />
                ))}
              </Flex>
            </Flex>
          ) : null}

          {activeTab === "recent-updates" ? <ImageUpdaterRecentUpdatesTable rows={rec.recentUpdates} /> : null}

          {activeTab === "yaml" ? (
            <ConsoleYamlEditor
              initialYaml={buildImageUpdaterYaml(rec)}
              downloadFileName={`${rec.name}.yaml`}
              ariaLabel="ImageUpdater YAML"
            />
          ) : null}
        </Flex>
      </Breadcrumbs>
    </div>
  );
}