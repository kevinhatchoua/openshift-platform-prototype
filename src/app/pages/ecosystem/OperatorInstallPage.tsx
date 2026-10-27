import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import {
  ActionGroup,
  Alert,
  Button,
  Card,
  CardBody,
  CardTitle,
  Content,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Grid,
  GridItem,
  Label,
  Radio,
  Title,
} from "@patternfly/react-core";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { CatalogBrandLogo } from "./CatalogBrandLogo";
import {
  readOperatorCatalogInstallState,
  type OperatorCatalogInstallState,
} from "./operatorCatalogInstallState";

type ProvidedApi = {
  short: string;
  name: string;
  description: string;
};

const DEFAULT_PROVIDED_APIS: ProvidedApi[] = [
  {
    short: "S",
    name: "Subscription",
    description: "OLM Subscription for this operator in the target namespace.",
  },
  {
    short: "CSV",
    name: "ClusterServiceVersion",
    description: "Defines the operator version, permissions, and managed CRDs for this install.",
  },
];

function slugFromOperatorId(id: string): string {
  return id.replace(/-olm-v1$/i, "").replace(/-v1$/i, "").replace(/-olm-v0$/i, "");
}

function recommendedNamespace(operator: OperatorCatalogInstallState): string {
  const slug = slugFromOperatorId(operator.id);
  const name = operator.name.toLowerCase();
  if (slug.includes("rhacs") || name.includes("advanced cluster security")) {
    return "rhacs-operator";
  }
  if (slug.includes("advanced-cluster-management") || name.includes("advanced cluster management")) {
    return "open-cluster-management";
  }
  if (slug.includes("gitops") || name.includes("gitops")) {
    return "openshift-gitops-operator";
  }
  const base = slug.replace(/-operator$/, "") || slug;
  return `${base}-operator`.replace(/^-+/, "").slice(0, 63);
}

/** Prototype: recommended namespace is missing until install creates it. */
function recommendedNamespaceExists(ns: string): boolean {
  return ns === "openshift-operators" || ns === "openshift-gitops-operator";
}

function getProvidedApis(operator: OperatorCatalogInstallState): ProvidedApi[] {
  const slug = slugFromOperatorId(operator.id);
  const name = operator.name.toLowerCase();
  if (slug.includes("rhacs") || name.includes("advanced cluster security")) {
    return [
      {
        short: "C",
        name: "Central",
        description:
          "Central is the configuration template for the central services. This includes the API server, persistent storage, and the web UI, as well as the image scanner.",
      },
      {
        short: "SC",
        name: "SecuredCluster",
        description:
          "SecuredCluster is the configuration template for the secured cluster services. These include Sensor, which is responsible for the connection to Central, and Collector.",
      },
      {
        short: "SP",
        name: "SecurityPolicy",
        description: "SecurityPolicy is the schema for the policies API.",
      },
    ];
  }
  return DEFAULT_PROVIDED_APIS;
}

function defaultVersion(operator: OperatorCatalogInstallState): string {
  const name = operator.name.toLowerCase();
  if (name.includes("advanced cluster security")) {
    return "4.11.6";
  }
  return operator.version ?? "0.16.0";
}

export default function OperatorInstallPage() {
  const { operatorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const operator = readOperatorCatalogInstallState(operatorId, location.state);

  const recommendedNs = useMemo(() => recommendedNamespace(operator), [operator]);
  const namespaceExists = useMemo(() => recommendedNamespaceExists(recommendedNs), [recommendedNs]);

  const [channel, setChannel] = useState(operator.channel ?? "stable");
  const [version, setVersion] = useState(defaultVersion(operator));
  const [installMode, setInstallMode] = useState<"all-namespaces" | "own-namespace">("all-namespaces");
  const [namespaceChoice, setNamespaceChoice] = useState<"recommended" | "custom">("recommended");
  const [customNamespace, setCustomNamespace] = useState("openshift-operators");
  const [approval, setApproval] = useState<"Automatic" | "Manual">("Automatic");
  const [consolePlugin, setConsolePlugin] = useState<"enable" | "disable">("enable");

  const supportsOwnNamespace = false;
  const installPath = `/ecosystem/software-catalog/${operator.id}/install`;
  const installedNamespace = namespaceChoice === "recommended" ? recommendedNs : customNamespace;

  const handleInstall = () => {
    const payload: OperatorCatalogInstallState = {
      ...operator,
      channel,
      version,
      namespace: installedNamespace,
    };
    navigate(`/ecosystem/software-catalog/${operator.id}/installing`, { state: payload });
  };

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Software Catalog", path: "/ecosystem/software-catalog" },
          { label: "Operator Installation" },
        ]}
      >
        <div className="ocs-operator-install-page pf-v6-u-pb-xl">
          <Grid hasGutter>
            <GridItem md={8}>
              <FlexHeader
                title="Install Operator"
                description="Install your Operator by subscribing to one of the update channels to keep the Operator up to date. The strategy determines either manual or automatic updates."
                favoriteName={`Install ${operator.name}`}
                favoritePath={installPath}
              />

              <div className="ocs-pods-list__panel ocs-operator-install-page__form pf-v6-u-mt-lg">
                <Form>
                  <FormGroup label="Update channel" isRequired fieldId="install-channel">
                    <FormSelect
                      id="install-channel"
                      aria-label="Update channel"
                      value={channel}
                      onChange={(_e, value) => setChannel(value)}
                    >
                      <FormSelectOption value="stable" label="stable" />
                      <FormSelectOption value="release-2-16" label="release-2-16" />
                      <FormSelectOption value="fast" label="fast" />
                    </FormSelect>
                  </FormGroup>

                  <FormGroup label="Version" isRequired fieldId="install-version">
                    <FormSelect
                      id="install-version"
                      aria-label="Version"
                      value={version}
                      onChange={(_e, value) => setVersion(value)}
                    >
                      <FormSelectOption value="4.11.6" label="4.11.6" />
                      <FormSelectOption value="4.10.2" label="4.10.2" />
                      <FormSelectOption value="0.16.0" label="0.16.0" />
                      <FormSelectOption value="0.15.2" label="0.15.2" />
                    </FormSelect>
                  </FormGroup>

                  <FormGroup label="Installation mode" isRequired fieldId="install-mode">
                    <Radio
                      id="install-mode-all"
                      name="install-mode"
                      label="All namespaces on the cluster (default)"
                      description="Operator will be available in all Namespaces."
                      isChecked={installMode === "all-namespaces"}
                      onChange={() => setInstallMode("all-namespaces")}
                    />
                    <Radio
                      id="install-mode-own"
                      name="install-mode"
                      label="A specific namespace on the cluster"
                      description="This mode is not supported by this Operator."
                      className="pf-v6-u-mt-sm"
                      isChecked={installMode === "own-namespace"}
                      isDisabled={!supportsOwnNamespace}
                      onChange={() => setInstallMode("own-namespace")}
                    />
                  </FormGroup>

                  <FormGroup label="Installed Namespace" isRequired fieldId="install-namespace">
                    <Radio
                      id="install-ns-recommended"
                      name="install-namespace"
                      isChecked={namespaceChoice === "recommended"}
                      onChange={() => setNamespaceChoice("recommended")}
                      label={
                        <span className="ocs-operator-install-page__ns-recommended-label">
                          Operator recommended Namespace:{" "}
                          <Label isCompact color="purple" className="pf-v6-u-mx-xs">
                            PR
                          </Label>
                          {recommendedNs}
                        </span>
                      }
                    />
                    <Radio
                      id="install-ns-custom"
                      name="install-namespace"
                      label="Select a Namespace"
                      className="pf-v6-u-mt-sm"
                      isChecked={namespaceChoice === "custom"}
                      onChange={() => setNamespaceChoice("custom")}
                    />
                    {namespaceChoice === "custom" ? (
                      <FormSelect
                        id="install-namespace-select"
                        aria-label="Select a Namespace"
                        className="pf-v6-u-mt-sm"
                        value={customNamespace}
                        onChange={(_e, value) => setCustomNamespace(value)}
                      >
                        <FormSelectOption value="openshift-operators" label="openshift-operators" />
                        <FormSelectOption value="my-project" label="my-project" />
                        <FormSelectOption value="default" label="default" />
                      </FormSelect>
                    ) : null}
                    {namespaceChoice === "recommended" && !namespaceExists ? (
                      <Alert
                        variant="info"
                        isInline
                        title="Namespace creation"
                        className="pf-v6-u-mt-md"
                      >
                        Namespace {recommendedNs} does not exist and will be created.
                      </Alert>
                    ) : null}
                  </FormGroup>

                  <FormGroup label="Update approval" isRequired fieldId="install-approval">
                    <Radio
                      id="install-approval-auto"
                      name="install-approval"
                      label="Automatic"
                      isChecked={approval === "Automatic"}
                      onChange={() => setApproval("Automatic")}
                    />
                    <Radio
                      id="install-approval-manual"
                      name="install-approval"
                      label="Manual"
                      className="pf-v6-u-mt-sm"
                      isChecked={approval === "Manual"}
                      onChange={() => setApproval("Manual")}
                    />
                  </FormGroup>

                  <FormGroup label="Console plugin" isRequired fieldId="install-console-plugin">
                    <Radio
                      id="install-console-enable"
                      name="install-console-plugin"
                      label="Enable"
                      isChecked={consolePlugin === "enable"}
                      onChange={() => setConsolePlugin("enable")}
                    />
                    <Radio
                      id="install-console-disable"
                      name="install-console-plugin"
                      label="Disable"
                      className="pf-v6-u-mt-sm"
                      isChecked={consolePlugin === "disable"}
                      onChange={() => setConsolePlugin("disable")}
                    />
                  </FormGroup>

                  <ActionGroup>
                    <Button variant="primary" onClick={handleInstall}>
                      Install
                    </Button>
                    <Button variant="link" component={Link} to="/ecosystem/software-catalog">
                      Cancel
                    </Button>
                  </ActionGroup>
                </Form>
              </div>
            </GridItem>

            <GridItem md={4}>
              <OperatorInstallSidebar operator={operator} />
            </GridItem>
          </Grid>
        </div>
      </Breadcrumbs>
    </div>
  );
}

function FlexHeader({
  title,
  description,
  favoriteName,
  favoritePath,
}: {
  title: string;
  description: string;
  favoriteName: string;
  favoritePath: string;
}) {
  return (
    <div className="ocs-operator-install-page__header-row">
      <div>
        <Title headingLevel="h1" size="2xl">
          {title}
        </Title>
        <Content component="p" className="pf-v6-u-mt-sm pf-v6-u-color-200">
          {description}
        </Content>
      </div>
      <FavoriteButton name={favoriteName} path={favoritePath} />
    </div>
  );
}

function OperatorInstallSidebar({ operator }: { operator: OperatorCatalogInstallState }) {
  const apis = getProvidedApis(operator);

  return (
    <aside className="ocs-operator-install-page__sidebar" aria-label="Operator details">
      <Card isPlain>
        <CardBody>
          <div className="ocs-operator-install-page__sidebar-head">
            <CatalogBrandLogo
              id={operator.id}
              displayName={operator.name}
              catalogType="operators"
              boxClassName="ocs-catalog-detail__logo"
              logoClassName="ocs-catalog-detail__logo-img"
            />
            <div>
              <Title headingLevel="h2" size="lg">
                {operator.name}
              </Title>
              <Content component="small">provided by {operator.provider}</Content>
            </div>
          </div>
        </CardBody>
      </Card>

      <Title headingLevel="h3" size="md" className="pf-v6-u-mt-lg pf-v6-u-mb-md">
        Provided APIs
      </Title>
      <div className="ocs-operator-install-page__api-grid">
        {apis.map((api) => (
          <Card key={api.name} isCompact className="ocs-operator-install-page__api-card">
            <CardTitle className="ocs-operator-install-page__api-card-title">
              <span className="ocs-operator-install-page__api-icon" aria-hidden="true">
                {api.short}
              </span>
              {api.name}
            </CardTitle>
            <CardBody>
              <Content component="p">{api.description}</Content>
            </CardBody>
          </Card>
        ))}
      </div>
    </aside>
  );
}
