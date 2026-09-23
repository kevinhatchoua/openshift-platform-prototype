import { useMemo, useState } from "react";
import {
  Alert,
  Card,
  CardBody,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Grid,
  GridItem,
  Label,
  Title,
} from "@patternfly/react-core";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import {
  OlmV1ExtensionUpdateAlert,
  useOlmV1ExtensionLifecycleActions,
} from "../../components/ecosystem/OlmV1ExtensionLifecycleActions";
import { getPrototypeInstalledOperator } from "./installedOperatorsLookup";

type OlmV1ExtensionDetailViewProps = {
  operatorName: string;
};

export default function OlmV1ExtensionDetailView({ operatorName }: OlmV1ExtensionDetailViewProps) {
  const initialOperator = useMemo(
    () => getPrototypeInstalledOperator(operatorName),
    [operatorName],
  );
  const [operator, setOperator] = useState(initialOperator);

  if (!operator) {
    return (
      <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
        <Breadcrumbs
          items={[
            { label: "Installed Operators", path: "/ecosystem/installed-operators" },
            { label: operatorName },
          ]}
        >
          <Alert variant="warning" title="Operator not found" isInline>
            No prototype data is available for this cluster extension.
          </Alert>
        </Breadcrumbs>
      </div>
    );
  }

  const operatorPath = `/ecosystem/installed-operators/${encodeURIComponent(operator.name)}`;
  const { actionsDropdown, lifecycleModals, openUpdate } = useOlmV1ExtensionLifecycleActions({
    operator,
    onVersionUpdated: (newVersion) => {
      setOperator((prev) =>
        prev
          ? {
              ...prev,
              version: newVersion,
              updateAvailable: undefined,
            }
          : prev,
      );
    },
  });

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Installed Operators", path: "/ecosystem/installed-operators" },
          { label: operator.name },
        ]}
      >
        <Grid hasGutter>
          <GridItem md={9}>
            <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
              <Flex
                alignItems={{ default: "alignItemsCenter" }}
                justifyContent={{ default: "justifyContentSpaceBetween" }}
                flexWrap={{ default: "wrap" }}
                gap={{ default: "gapMd" }}
              >
                <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
                  <Flex alignItems={{ default: "alignItemsCenter" }} gap={{ default: "gapSm" }} flexWrap={{ default: "wrap" }}>
                    <Title headingLevel="h1" size="2xl">
                      {operator.name}
                    </Title>
                    <Label color="blue" isCompact>
                      OLM v1 cluster extension
                    </Label>
                  </Flex>
                  <span className="pf-v6-u-color-200 pf-v6-u-font-size-sm">
                    {operator.version} · channel {operator.channel} · {operator.source}
                  </span>
                </Flex>
                <Flex gap={{ default: "gapSm" }} alignItems={{ default: "alignItemsCenter" }}>
                  <FavoriteButton name={operator.name} path={operatorPath} />
                  {actionsDropdown}
                </Flex>
              </Flex>

              <OlmV1ExtensionUpdateAlert operator={operator} onUpdate={openUpdate} />

              <Card isPlain>
                <CardBody>
                  <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-md">
                    Cluster extension details
                  </Title>
                  <DescriptionList isHorizontal isCompact>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Namespace</DescriptionListTerm>
                      <DescriptionListDescription>{operator.namespace}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Status</DescriptionListTerm>
                      <DescriptionListDescription>{operator.status}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Cluster compatibility</DescriptionListTerm>
                      <DescriptionListDescription>{operator.clusterCompatibility}</DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Managed namespaces</DescriptionListTerm>
                      <DescriptionListDescription>
                        {(operator.managedNamespaces ?? []).join(", ") || "—"}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Automatic updates</DescriptionListTerm>
                      <DescriptionListDescription>
                        {operator.autoUpdate ? "Enabled" : "Manual approval"}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </CardBody>
              </Card>

              {operator.compatibilityMessage ? (
                <Alert variant="warning" title="Compatibility note" isInline>
                  {operator.compatibilityMessage}
                </Alert>
              ) : null}
            </Flex>
          </GridItem>
        </Grid>
      </Breadcrumbs>
      {lifecycleModals}
    </div>
  );
}
