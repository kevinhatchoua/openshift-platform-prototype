import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import {
  ActionGroup,
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

const DEFAULT_PROVIDED_APIS = [
  {
    name: "Subscription",
    description: "OLM Subscription for this operator in the target namespace.",
  },
  {
    name: "ClusterServiceVersion",
    description: "Defines the operator version, permissions, and managed CRDs for this install.",
  },
];

export default function OperatorInstallPage() {
  const { operatorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const operator = readOperatorCatalogInstallState(operatorId, location.state);

  const [channel, setChannel] = useState(operator.channel ?? "stable");
  const [version, setVersion] = useState(operator.version ?? "0.16.0");
  const [installMode, setInstallMode] = useState<"all-namespaces" | "own-namespace">("all-namespaces");
  const [namespace, setNamespace] = useState("openshift-operators");
  const [approval, setApproval] = useState<"Automatic" | "Manual">("Automatic");

  const supportsOwnNamespace = false;
  const installPath = `/ecosystem/software-catalog/${operator.id}/install`;

  const handleInstall = () => {
    const payload: OperatorCatalogInstallState = {
      ...operator,
      channel,
      version,
    };
    navigate(`/ecosystem/software-catalog/${operator.id}/installing`, { state: payload });
  };

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Ecosystem", path: "/ecosystem" },
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
                      <FormSelectOption value="release-2-16" label="release-2.16" />
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
                      <FormSelectOption value="0.16.0" label="0.16.0" />
                      <FormSelectOption value="0.15.2" label="0.15.2" />
                      <FormSelectOption value="0.14.1" label="0.14.1" />
                    </FormSelect>
                  </FormGroup>

                  <FormGroup label="Installation mode" isRequired fieldId="install-mode">
                    <Radio
                      id="install-mode-all"
                      name="install-mode"
                      label="All namespaces on the cluster (default)"
                      isChecked={installMode === "all-namespaces"}
                      onChange={() => setInstallMode("all-namespaces")}
                    />
                    <Radio
                      id="install-mode-own"
                      name="install-mode"
                      label="A specific namespace on the cluster"
                      description={
                        supportsOwnNamespace
                          ? undefined
                          : "This mode is not supported by this Operator."
                      }
                      className="pf-v6-u-mt-sm"
                      isChecked={installMode === "own-namespace"}
                      isDisabled={!supportsOwnNamespace}
                      onChange={() => setInstallMode("own-namespace")}
                    />
                  </FormGroup>

                  <FormGroup label="Installed Namespace" isRequired fieldId="install-namespace">
                    <FormSelect
                      id="install-namespace"
                      aria-label="Installed Namespace"
                      value={namespace}
                      onChange={(_e, value) => setNamespace(value)}
                      isDisabled={installMode === "all-namespaces"}
                    >
                      <FormSelectOption value="openshift-operators" label="openshift-operators" />
                      <FormSelectOption value="my-project" label="my-project" />
                      <FormSelectOption value="default" label="default" />
                    </FormSelect>
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

                  <ActionGroup>
                    <Button variant="primary" onClick={handleInstall}>
                      Install
                    </Button>
                    <Button variant="secondary" component={Link} to="/ecosystem/software-catalog">
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
  return (
    <aside className="ocs-operator-install-page__sidebar" aria-label="Operator details">
      <Card isPlain>
        <CardBody>
          <div className="ocs-operator-install-page__sidebar-head">
            <CatalogBrandLogo
              id={operator.id}
              catalogType="operators"
              boxClassName="ocs-catalog-detail__logo"
              logoClassName="ocs-catalog-detail__logo-img"
            />
            <div>
              <Title headingLevel="h2" size="lg">
                {operator.name}
              </Title>
              <Content component="small">Provided by {operator.provider}</Content>
            </div>
          </div>
        </CardBody>
      </Card>

      <Title headingLevel="h3" size="md" className="pf-v6-u-mt-lg pf-v6-u-mb-md">
        Provided APIs
      </Title>
      <div className="ocs-operator-install-page__api-grid">
        {DEFAULT_PROVIDED_APIS.map((api) => (
          <Card key={api.name} isCompact>
            <CardTitle>{api.name}</CardTitle>
            <CardBody>
              <Content component="p">{api.description}</Content>
            </CardBody>
          </Card>
        ))}
      </div>
    </aside>
  );
}
