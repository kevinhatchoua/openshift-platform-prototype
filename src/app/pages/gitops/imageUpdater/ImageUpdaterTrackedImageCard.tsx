import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Label,
} from "@patternfly/react-core";
import { Link } from "react-router";
import type { ImageUpdaterTrackedImage } from "../gitopsData";
import { gitopsDetailPath } from "../gitopsData";

const CHECK_STATUS_LABEL: Record<
  ImageUpdaterTrackedImage["checkStatus"],
  { text: string; color: "green" | "blue" | "orange" | "red" }
> = {
  "up-to-date": { text: "Up to date", color: "green" },
  "update-available": { text: "Update available", color: "blue" },
  "held-back": { text: "Held back by constraint", color: "orange" },
  error: { text: "Error", color: "red" },
};

const STRATEGY_LABEL: Record<ImageUpdaterTrackedImage["updateStrategy"], string> = {
  semver: "Version constraint (semver)",
  "newest-build": "Most recently pushed tag",
  digest: "Tracked tag (digest)",
  alphabetical: "Alphabetical (highest tag)",
};

function alertVariant(
  status: ImageUpdaterTrackedImage["checkStatus"]
): "success" | "info" | "warning" | "danger" {
  switch (status) {
    case "up-to-date":
      return "success";
    case "update-available":
      return "info";
    case "held-back":
      return "warning";
    case "error":
      return "danger";
    default:
      return "info";
  }
}

export function ImageUpdaterTrackedImageCard({ image }: { image: ImageUpdaterTrackedImage }) {
  const pill = CHECK_STATUS_LABEL[image.checkStatus];

  return (
    <Card className="ocs-image-updater-tracked-card" isCompact>
      <CardTitle>
        <Flex
          alignItems={{ default: "alignItemsCenter" }}
          justifyContent={{ default: "justifyContentSpaceBetween" }}
          flexWrap={{ default: "wrap" }}
          gap={{ default: "gapSm" }}
        >
          <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
            <Content component="h3" className="pf-v6-u-font-weight-bold pf-v6-u-mb-0">
              {image.alias}
            </Content>
            <Content component="small" className="ocs-image-updater-tracked-card__image-ref">
              {image.imageName}
            </Content>
          </Flex>
          <Label color={pill.color} isCompact>
            {pill.text}
          </Label>
        </Flex>
      </CardTitle>
      <CardBody>
        <DescriptionList isHorizontal isCompact className="ocs-image-updater-tracked-card__dl">
          <DescriptionListGroup>
            <DescriptionListTerm>Update strategy</DescriptionListTerm>
            <DescriptionListDescription>{STRATEGY_LABEL[image.updateStrategy]}</DescriptionListDescription>
          </DescriptionListGroup>
          {image.semverConstraint ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Constraint</DescriptionListTerm>
              <DescriptionListDescription>
                <code>{image.semverConstraint}</code>
              </DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
          {image.deployedTag ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Deployed</DescriptionListTerm>
              <DescriptionListDescription>
                <code>{image.deployedTag}</code>
                {image.candidateTag ? (
                  <>
                    {" "}
                    · candidate <code>{image.candidateTag}</code>
                  </>
                ) : null}
              </DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
          {image.allowTags ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Allow tags</DescriptionListTerm>
              <DescriptionListDescription>
                <code>{image.allowTags}</code>
              </DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
          {image.ignoreTags ? (
            <DescriptionListGroup>
              <DescriptionListTerm>Ignore tags</DescriptionListTerm>
              <DescriptionListDescription>
                <code>{image.ignoreTags}</code>
              </DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
          <DescriptionListGroup>
            <DescriptionListTerm>Write-back</DescriptionListTerm>
            <DescriptionListDescription>
              {image.writeBackMethod}
              {image.writeBackTarget ? ` · ${image.writeBackTarget}` : ""}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Applications</DescriptionListTerm>
            <DescriptionListDescription>
              {image.applications.map((app, index) => (
                <span key={`${app.ns}/${app.name}`}>
                  {index > 0 ? ", " : null}
                  <Link to={gitopsDetailPath("applications", app.ns, app.name)}>{app.name}</Link>
                </span>
              ))}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
        {image.statusDetail && image.checkStatus !== "up-to-date" ? (
          <Alert isInline variant={alertVariant(image.checkStatus)} title={pill.text} className="pf-v6-u-mt-md">
            {image.statusDetail}
          </Alert>
        ) : null}
      </CardBody>
    </Card>
  );
}