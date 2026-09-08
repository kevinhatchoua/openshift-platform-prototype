import { useMemo } from "react";
import { useParams } from "react-router";
import {
  Card,
  CardBody,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Label,
  Title,
} from "@patternfly/react-core";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { findExperiment, gitopsDetailPath } from "./gitopsData";
import { GitOpsLink, HealthStatus } from "./gitopsShared";

export default function GitOpsExperimentDetailPage() {
  const { namespace = "", rollout = "", name = "" } = useParams();
  const decodedNs = decodeURIComponent(namespace);
  const decodedRollout = decodeURIComponent(rollout);
  const decodedName = decodeURIComponent(name);
  const experiment = useMemo(
    () => findExperiment(decodedNs, decodedRollout, decodedName),
    [decodedNs, decodedRollout, decodedName]
  );

  if (!experiment) {
    return (
      <div className="ocs-app-page-outer w-full">
        <Content component="p">Experiment not found.</Content>
      </div>
    );
  }

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          { label: "GitOps", path: "/gitops/overview" },
          { label: "Rollouts", path: "/gitops/rollouts" },
          {
            label: decodedRollout,
            path: gitopsDetailPath("rollouts", decodedNs, decodedRollout),
          },
          { label: decodedName },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }}>
            <Title headingLevel="h1" size="2xl">
              {experiment.name}
            </Title>
            <FavoriteButton
              name={experiment.name}
              path={`/gitops/ns/${namespace}/rollouts/${rollout}/experiments/${name}`}
            />
          </Flex>
          <DescriptionList isCompact>
            <DescriptionListGroup>
              <DescriptionListTerm>Phase</DescriptionListTerm>
              <DescriptionListDescription>
                <HealthStatus status={experiment.phase === "Failed" ? "Degraded" : experiment.phase} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Rollout</DescriptionListTerm>
              <DescriptionListDescription>
                <GitOpsLink to={gitopsDetailPath("rollouts", decodedNs, decodedRollout)}>
                  {decodedRollout}
                </GitOpsLink>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Duration</DescriptionListTerm>
              <DescriptionListDescription>{experiment.duration}</DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
          <Card>
            <CardBody>
              <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-md">
                Metrics
              </Title>
              <Content component="p">{experiment.metrics}</Content>
              <Flex gap={{ default: "gapSm" }} className="pf-v6-u-mt-md" flexWrap={{ default: "wrap" }}>
                {experiment.metricSeries.map((m) => (
                  <Label key={m.name} color={m.status === "pass" ? "green" : "red"} isCompact>
                    {m.name}: {m.value}
                  </Label>
                ))}
              </Flex>
            </CardBody>
          </Card>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
