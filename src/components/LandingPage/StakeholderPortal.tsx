import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Grid,
  GridItem,
  Label,
  MenuToggle,
  PageSection,
  Spinner,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import EnvelopeIcon from "@patternfly/react-icons/dist/esm/icons/envelope-icon";
import FilterIcon from "@patternfly/react-icons/dist/esm/icons/filter-icon";
import SlackHashIcon from "@patternfly/react-icons/dist/esm/icons/slack-hash-icon";
import UserIcon from "@patternfly/react-icons/dist/esm/icons/user-icon";
import {
  EPIC_CARDS,
  JIRA_BROWSE_URL,
  STATUS_COLOR,
  STATUS_LABEL,
  type EpicCardProps,
  type TrackSegment,
} from "./epicCardsData";
import { useEpicJiraStatuses } from "./useEpicJiraStatuses";

type StatusFilter = "all" | "completed" | "active";

const FILTER_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All Work" },
  { id: "completed", label: "Completed Only" },
  { id: "active", label: "In Progress / Not Started" },
];

function TrackLine({ segments }: { segments: TrackSegment[] }) {
  return (
    <Content component="small">
      {segments.map((segment, index) =>
        segment.type === "jira" ? (
          <Button
            key={`${segment.key}-${index}`}
            variant="link"
            isInline
            component="a"
            href={`${JIRA_BROWSE_URL}/${segment.key}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {segment.key}
          </Button>
        ) : (
          <span key={`text-${index}`}>{segment.value}</span>
        )
      )}
    </Content>
  );
}

function EpicCard({ title, track, description, status, ctaLabel, ctaTo, ctaDisabled }: EpicCardProps) {
  return (
    <Card isFullHeight>
      <CardTitle>
        <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
          <Flex justifyContent={{ default: "justifyContentSpaceBetween" }} alignItems={{ default: "alignItemsFlexStart" }}>
            <Title headingLevel="h3" size="md">
              {title}
            </Title>
            <Label color={STATUS_COLOR[status]} isCompact>
              {STATUS_LABEL[status]}
            </Label>
          </Flex>
          <TrackLine segments={track} />
        </Flex>
      </CardTitle>
      <CardBody>
        <Content component="p">{description}</Content>
      </CardBody>
      <CardFooter>
        {ctaDisabled || !ctaTo ? (
          <Button variant="link" isDisabled>
            {ctaLabel}
          </Button>
        ) : (
          <Button variant="link" isInline component={Link} to={ctaTo}>
            {ctaLabel}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function StakeholderPortal() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const { cards: epicCards, loading: statusesLoading } = useEpicJiraStatuses(EPIC_CARDS);

  const filteredEpics = useMemo(
    () =>
      epicCards.filter((epic) => {
        if (statusFilter === "completed") return epic.status === "completed";
        if (statusFilter === "active") return epic.status === "in-progress" || epic.status === "not-started";
        return true;
      }),
    [epicCards, statusFilter]
  );

  const activeFilterLabel = FILTER_OPTIONS.find((o) => o.id === statusFilter)?.label ?? "All Work";

  return (
    <PageSection className="ocs-stakeholder-portal">
      <Flex direction={{ default: "column" }} gap={{ default: "gapXl" }}>
        <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
          <Title headingLevel="h1" size="2xl">
            OpenShift Platform Prototype
          </Title>
          <Content component="p">
            Two-phase OCP 5.0 network UX roadmap: <strong>Phase 1</strong> automates cross-layer links between Networking
            and Virtualization; <strong>Phase 2</strong> delivers graph topology visualization (topology over tree view).
            Track progress across networking (
            <Button
              variant="link"
              isInline
              component="a"
              href={`${JIRA_BROWSE_URL}/HPUX-1717`}
              target="_blank"
              rel="noopener noreferrer"
            >
              HPUX-1717
            </Button>
            ), DataView toolbar filtering, and OLM cluster updates.
          </Content>
        </Flex>

        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <Dropdown
                isOpen={filterOpen}
                onOpenChange={setFilterOpen}
                onSelect={(_event, itemId) => {
                  setStatusFilter(itemId as StatusFilter);
                  setFilterOpen(false);
                }}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setFilterOpen((o) => !o)}
                    isExpanded={filterOpen}
                    icon={<FilterIcon aria-hidden />}
                  >
                    {activeFilterLabel}
                  </MenuToggle>
                )}
              >
                <DropdownList>
                  {FILTER_OPTIONS.map((option) => (
                    <DropdownItem key={option.id} itemId={option.id}>
                      {option.label}
                    </DropdownItem>
                  ))}
                </DropdownList>
              </Dropdown>
            </ToolbarItem>
            {statusesLoading ? (
              <ToolbarItem>
                <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                  <Spinner size="md" aria-label="Syncing Jira statuses" />
                  <Content component="small">Syncing Jira statuses…</Content>
                </Flex>
              </ToolbarItem>
            ) : null}
          </ToolbarContent>
        </Toolbar>

        <Grid hasGutter>
          {filteredEpics.map((card) => (
            <GridItem key={card.id} span={12} md={6} lg={4}>
              <EpicCard {...card} />
            </GridItem>
          ))}
        </Grid>

        <Card>
          <CardBody>
            <DescriptionList isHorizontal isCompact>
              <DescriptionListGroup>
                <DescriptionListTerm>
                  <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                    <UserIcon aria-hidden />
                    Maintainer
                  </Flex>
                </DescriptionListTerm>
                <DescriptionListDescription>Kevin Hatchoua</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>
                  <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                    <EnvelopeIcon aria-hidden />
                    Email
                  </Flex>
                </DescriptionListTerm>
                <DescriptionListDescription>
                  <Button variant="link" isInline component="a" href="mailto:khatchou@redhat.com">
                    khatchou@redhat.com
                  </Button>
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>
                  <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                    <SlackHashIcon aria-hidden />
                    Slack
                  </Flex>
                </DescriptionListTerm>
                <DescriptionListDescription>@KevinHatchoua</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </CardBody>
        </Card>
      </Flex>
    </PageSection>
  );
}
