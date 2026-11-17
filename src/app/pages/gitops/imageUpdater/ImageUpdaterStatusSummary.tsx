import {
  Alert,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Label,
} from "@patternfly/react-core";
import type { ImageUpdaterRecord } from "../gitopsData";
import { imageUpdaterIsReady } from "../gitopsData";

export function ImageUpdaterStatusSummary({ rec }: { rec: ImageUpdaterRecord }) {
  const ready = imageUpdaterIsReady(rec);
  const errorCondition = rec.conditions.find((c) => c.type === "Error" && c.status === "True");

  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
      <DescriptionList isHorizontal isCompact>
        <DescriptionListGroup>
          <DescriptionListTerm>Applications matched</DescriptionListTerm>
          <DescriptionListDescription>{rec.applicationsMatched}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Images managed</DescriptionListTerm>
          <DescriptionListDescription>{rec.imagesManaged}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Last registry check</DescriptionListTerm>
          <DescriptionListDescription>{rec.lastCheckedAt}</DescriptionListDescription>
        </DescriptionListGroup>
        {rec.lastUpdatedAt ? (
          <DescriptionListGroup>
            <DescriptionListTerm>Last update applied</DescriptionListTerm>
            <DescriptionListDescription>{rec.lastUpdatedAt}</DescriptionListDescription>
          </DescriptionListGroup>
        ) : null}
        <DescriptionListGroup>
          <DescriptionListTerm>Ready</DescriptionListTerm>
          <DescriptionListDescription>
            <Label color={ready ? "green" : "red"} isCompact>
              {ready ? "True" : "False"}
            </Label>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Created at</DescriptionListTerm>
          <DescriptionListDescription>{rec.createdAt}</DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
      {errorCondition ? (
        <Alert isInline variant="danger" title={errorCondition.reason}>
          {errorCondition.message}
        </Alert>
      ) : null}
    </Flex>
  );
}