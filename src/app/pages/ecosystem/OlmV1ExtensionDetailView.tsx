import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardBody,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  Form,
  Grid,
  GridItem,
  Label,
  Title,
} from "@patternfly/react-core";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { OlmV1ClusterExtensionSpecFields } from "../../components/ecosystem/OlmV1ClusterExtensionSpecFields";
import {
  OlmV1ExtensionEditHintAlert,
  useOlmV1ExtensionLifecycleActions,
} from "../../components/ecosystem/OlmV1ExtensionLifecycleActions";
import {
  defaultClusterExtensionSpec,
  type OlmV1ClusterExtensionSpec,
} from "../../components/ecosystem/olmV1ClusterExtensionSpec";
import { OlmMigrationStatusPanel } from "../../components/ecosystem/OlmMigrationStatusPanel";
import { getPrototypeInstalledOperator } from "./installedOperatorsLookup";

type OlmV1ExtensionDetailViewProps = {
  operatorName: string;
};

function OlmV1ExtensionDetailContent({ initial }: { initial: NonNullable<ReturnType<typeof getPrototypeInstalledOperator>> }) {
  const [operator, setOperator] = useState(initial);
  const [specDraft, setSpecDraft] = useState<OlmV1ClusterExtensionSpec>(() =>
    defaultClusterExtensionSpec({
      channel: initial.channel,
      version: initial.version,
      versionRange: initial.versionRange,
    }),
  );
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const operatorPath = `/ecosystem/installed-operators/${encodeURIComponent(operator.name)}`;

  const applySpec = (spec: OlmV1ClusterExtensionSpec) => {
    setOperator((prev) =>
      prev
        ? {
            ...prev,
            channel: spec.channel,
            version: spec.version,
            versionRange: spec.versionRange,
          }
        : prev,
    );
    setSpecDraft(spec);
    setSaveMessage("Cluster extension targeting saved (prototype stub).");
  };

  const { actionsDropdown, lifecycleModals, openEdit, canManageClusterExtension } =
    useOlmV1ExtensionLifecycleActions({
      operator,
      onSpecUpdated: applySpec,
    });

  const handleInlineSave = () => {
    applySpec(specDraft);
  };

  const specDirty =
    specDraft.channel !== operator.channel ||
    specDraft.version !== operator.version ||
    specDraft.versionRange !== (operator.versionRange ?? "");

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

              <OlmV1ExtensionEditHintAlert onEdit={openEdit} canEdit={canManageClusterExtension} />

              {saveMessage ? (
                <Alert variant="success" title={saveMessage} isInline onTimeout={() => setSaveMessage(null)} timeout={8000} />
              ) : null}

              <OlmMigrationStatusPanel operator={operator} variant="cluster-extension" />

              <Card isPlain>
                <CardBody>
                  <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-md">
                    Extension targeting
                  </Title>
                  <Form className="pf-v6-u-max-width-md">
                    <OlmV1ClusterExtensionSpecFields
                      idPrefix="ce-detail"
                      value={specDraft}
                      onChange={setSpecDraft}
                      isReadOnly={!canManageClusterExtension}
                    />
                    <Flex gap={{ default: "gapSm" }} className="pf-v6-u-mt-md">
                      <Button
                        variant="primary"
                        isDisabled={!canManageClusterExtension || !specDirty}
                        onClick={handleInlineSave}
                      >
                        Save
                      </Button>
                      <Button
                        variant="link"
                        isDisabled={!canManageClusterExtension || !specDirty}
                        onClick={() =>
                          setSpecDraft(
                            defaultClusterExtensionSpec({
                              channel: operator.channel,
                              version: operator.version,
                              versionRange: operator.versionRange,
                            }),
                          )
                        }
                      >
                        Reset
                      </Button>
                    </Flex>
                  </Form>
                </CardBody>
              </Card>

              <Card isPlain>
                <CardBody>
                  <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-md">
                    Cluster extension details
                  </Title>
                  <DescriptionList isHorizontal isCompact>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Package name</DescriptionListTerm>
                      <DescriptionListDescription>{operator.packageName ?? "—"}</DescriptionListDescription>
                    </DescriptionListGroup>
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

export default function OlmV1ExtensionDetailView({ operatorName }: OlmV1ExtensionDetailViewProps) {
  const initialOperator = useMemo(
    () => getPrototypeInstalledOperator(operatorName),
    [operatorName],
  );

  if (!initialOperator) {
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

  return <OlmV1ExtensionDetailContent initial={initialOperator} />;
}
