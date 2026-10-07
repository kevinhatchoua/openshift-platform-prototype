import {
  Card,
  CardBody,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Title,
} from "@patternfly/react-core";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { OlmMigrationStatusPanel } from "../../components/ecosystem/OlmMigrationStatusPanel";
import type { CatalogOperator } from "./installedOperatorsTypes";

type InstalledCatalogOperatorDetailPageProps = {
  operator: CatalogOperator;
};

export default function InstalledCatalogOperatorDetailPage({
  operator,
}: InstalledCatalogOperatorDetailPageProps) {
  const operatorPath = `/ecosystem/installed-operators/${encodeURIComponent(operator.name)}`;

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Installed Operators", path: "/ecosystem/installed-operators" },
          { label: operator.name },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
              <Title headingLevel="h1" size="2xl">{operator.name}</Title>
              <span className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                {operator.version} · channel {operator.channel} · {operator.namespace}
              </span>
            </Flex>
            <FavoriteButton name={operator.name} path={operatorPath} />
          </Flex>

          <OlmMigrationStatusPanel operator={operator} variant="classic" />

          <Card isPlain>
            <CardBody>
              <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-md">
                Operator details
              </Title>
              <DescriptionList isHorizontal isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>Status</DescriptionListTerm>
                  <DescriptionListDescription>{operator.status}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Catalog source</DescriptionListTerm>
                  <DescriptionListDescription>{operator.source}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Cluster compatibility</DescriptionListTerm>
                  <DescriptionListDescription>{operator.clusterCompatibility}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </CardBody>
          </Card>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
