import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import {
  ActionGroup,
  Button,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Label,
  LabelGroup,
  Radio,
  TextInput,
  Title,
} from "@patternfly/react-core";
import OutlinedQuestionCircleIcon from "@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon";
import PencilAltIcon from "@patternfly/react-icons/dist/esm/icons/pencil-alt-icon";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { buildClusterExtensionYaml } from "../../components/ecosystem/olmV1ClusterExtensionSpec";
import { DualModeCreateLayout } from "../networking/DualModeCreateLayout";
import type { ConfigureViewMode } from "../networking/useSyncedFormYaml";
import {
  readClusterExtensionCreateState,
  type ClusterExtensionCreateState,
} from "./operatorCatalogInstallState";

const YAML_SCHEMA_FIELDS = [
  { name: "spec.packageName", type: "string", description: "Catalog package name for the extension." },
  { name: "spec.version", type: "string", description: "Exact version or semver range." },
  { name: "spec.channels", type: "string", description: "Target channels (for example, stable, beta)." },
  { name: "spec.catalogs", type: "array", description: "Catalog sources used to resolve the package." },
  { name: "spec.serviceAccountName", type: "string", description: "Service account used by the extension controller." },
];

const DEFAULT_CATALOGS = ["openshift-redhat-operators"];

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63);
}

function FieldLabel({ label, help }: { label: string; help?: string }) {
  return (
    <span className="ocs-cluster-extension-create__label">
      {label}
      {help ? (
        <Button
          variant="plain"
          aria-label={`More information about ${label}`}
          className="ocs-cluster-extension-create__help"
          icon={<OutlinedQuestionCircleIcon aria-hidden />}
        />
      ) : null}
    </span>
  );
}

export default function ClusterExtensionCreatePage() {
  const { operatorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const catalog = readClusterExtensionCreateState(operatorId, location.state);

  const defaultSlug = useMemo(() => slugFromName(catalog.name) || "advanced-cluster-management", [catalog.name]);

  const [viewMode, setViewMode] = useState<ConfigureViewMode>("form");
  const [extensionName, setExtensionName] = useState(defaultSlug);
  const [packageName, setPackageName] = useState(defaultSlug);
  const [namespaceMode, setNamespaceMode] = useState<"auto" | "select">("auto");
  const [autoNamespace, setAutoNamespace] = useState(defaultSlug);
  const [editingNamespace, setEditingNamespace] = useState(false);
  const [saMode, setSaMode] = useState<"auto" | "select">("auto");
  const [autoServiceAccount, setAutoServiceAccount] = useState(`${defaultSlug}-service-account`);
  const [editingServiceAccount, setEditingServiceAccount] = useState(false);
  const [versionOrRange, setVersionOrRange] = useState("2.17.0");
  const [channels, setChannels] = useState("");
  const [catalogs, setCatalogs] = useState<string[]>(DEFAULT_CATALOGS);
  const [yamlText, setYamlText] = useState("");

  const namespace = namespaceMode === "auto" ? autoNamespace : "";
  const serviceAccountName = saMode === "auto" ? autoServiceAccount : "";

  const formPayload = useMemo(
    () => ({
      name: extensionName,
      packageName,
      namespace,
      serviceAccountName,
      spec: {
        channel: channels.split(",")[0]?.trim() || "stable",
        version: versionOrRange,
        versionRange: versionOrRange,
      },
      catalogs,
    }),
    [extensionName, packageName, namespace, serviceAccountName, channels, versionOrRange, catalogs],
  );

  useEffect(() => {
    if (viewMode === "yaml") {
      setYamlText(buildClusterExtensionYaml(formPayload));
    }
  }, [viewMode, formPayload]);

  const canSubmit =
    extensionName.trim().length > 0 &&
    packageName.trim().length > 0 &&
    namespace.length > 0 &&
    serviceAccountName.length > 0 &&
    versionOrRange.trim().length > 0 &&
    catalogs.length > 0;

  const handleSubmit = () => {
    const payload: ClusterExtensionCreateState = {
      ...catalog,
      installKind: "cluster-extension",
      extensionName,
      packageName,
      namespace,
      serviceAccountName,
      channel: channels.split(",")[0]?.trim() || "stable",
      version: versionOrRange,
      versionRange: versionOrRange,
    };
    navigate(`/ecosystem/software-catalog/${catalog.id}/installing`, { state: payload });
  };

  const removeCatalog = (value: string) => {
    setCatalogs((prev) => prev.filter((c) => c !== value));
  };

  const favoritePath = `/ecosystem/software-catalog/${catalog.id}/create-cluster-extension`;

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Software Catalog", path: "/ecosystem/software-catalog?catalog=nextgen" },
          { label: "Create ClusterExtension" },
        ]}
      >
        <div className="ocs-cluster-extension-create__header-row pf-v6-u-mb-md">
          <div>
            <Title headingLevel="h1" size="2xl" className="pf-v6-u-mb-sm">
              Create ClusterExtension
            </Title>
            <p className="pf-v6-u-color-200">
              Create a ClusterExtension to add functionality to your cluster. Operator Lifecycle Manager v1
              manages ClusterExtensions.
            </p>
          </div>
          <FavoriteButton name={`Create ${catalog.name}`} path={favoritePath} />
        </div>

        <div className="ocs-cluster-extension-create pf-v6-u-pb-xl">
          <DualModeCreateLayout
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            yamlText={yamlText}
            onYamlChange={setYamlText}
            yamlError={null}
            hasUnmappedContent
            formBannerTitle="Some fields might not be displayed in this form."
            formBannerBody="Select YAML view to edit all fields."
            schemaTitle="ClusterExtension"
            schemaFields={YAML_SCHEMA_FIELDS}
          >
            <Form>
              <FormGroup label="Name" isRequired fieldId="ce-name">
                <TextInput
                  id="ce-name"
                  value={extensionName}
                  onChange={(_e, v) => setExtensionName(v)}
                  aria-label="Name"
                />
              </FormGroup>

              <FormGroup
                label={<FieldLabel label="Package name" help />}
                isRequired
                fieldId="ce-package"
              >
                <TextInput
                  id="ce-package"
                  value={packageName}
                  onChange={(_e, v) => setPackageName(v)}
                  aria-label="Package name"
                />
              </FormGroup>

              <FormGroup
                label="Namespace"
                isRequired
                fieldId="ce-namespace"
              >
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      Namespace for the operator controller, manifest, etc. A dedicated operator namespace is
                      recommended.
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
                <Radio
                  id="ce-ns-auto"
                  name="ce-namespace"
                  isChecked={namespaceMode === "auto"}
                  onChange={() => setNamespaceMode("auto")}
                  label={
                    <span className="ocs-cluster-extension-create__auto-row">
                      Automatically create a new Namespace:{" "}
                      {editingNamespace ? (
                        <TextInput
                          id="ce-ns-auto-edit"
                          value={autoNamespace}
                          onChange={(_e, v) => setAutoNamespace(v)}
                          aria-label="Namespace name"
                          className="ocs-cluster-extension-create__inline-input"
                        />
                      ) : (
                        <strong>{autoNamespace}</strong>
                      )}
                      <Button
                        variant="plain"
                        aria-label="Edit namespace name"
                        icon={<PencilAltIcon />}
                        onClick={() => setEditingNamespace((v) => !v)}
                      />
                    </span>
                  }
                />
                <Radio
                  id="ce-ns-select"
                  name="ce-namespace"
                  className="pf-v6-u-mt-sm"
                  label="Select from cluster"
                  isChecked={namespaceMode === "select"}
                  isDisabled
                  onChange={() => setNamespaceMode("select")}
                />
              </FormGroup>

              <FormGroup label="Service Account" isRequired fieldId="ce-sa">
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      Service account must be in the selected namespace. A dedicated service account for the
                      operator is recommended.
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
                <Radio
                  id="ce-sa-auto"
                  name="ce-service-account"
                  isChecked={saMode === "auto"}
                  onChange={() => setSaMode("auto")}
                  label={
                    <span className="ocs-cluster-extension-create__auto-row">
                      Automatically create a new ServiceAccount:{" "}
                      {editingServiceAccount ? (
                        <TextInput
                          id="ce-sa-auto-edit"
                          value={autoServiceAccount}
                          onChange={(_e, v) => setAutoServiceAccount(v)}
                          aria-label="Service account name"
                          className="ocs-cluster-extension-create__inline-input"
                        />
                      ) : (
                        <strong>{autoServiceAccount}</strong>
                      )}
                      <Button
                        variant="plain"
                        aria-label="Edit service account name"
                        icon={<PencilAltIcon />}
                        onClick={() => setEditingServiceAccount((v) => !v)}
                      />
                    </span>
                  }
                />
                <Radio
                  id="ce-sa-select"
                  name="ce-service-account"
                  className="pf-v6-u-mt-sm"
                  label="Select from cluster"
                  isChecked={saMode === "select"}
                  isDisabled
                  onChange={() => setSaMode("select")}
                />
              </FormGroup>

              <FormGroup
                label={<FieldLabel label="Version or Version range" help />}
                fieldId="ce-version"
              >
                <TextInput
                  id="ce-version"
                  value={versionOrRange}
                  onChange={(_e, v) => setVersionOrRange(v)}
                  aria-label="Version or Version range"
                />
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      For example, 1.2.3 for an exact version, or &gt;1.2.3 &lt;1.4.5 for a range
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>

              <FormGroup label={<FieldLabel label="Channels" help />} fieldId="ce-channels">
                <TextInput
                  id="ce-channels"
                  value={channels}
                  onChange={(_e, v) => setChannels(v)}
                  aria-label="Channels"
                />
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>For example, stable, beta</HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>

              <FormGroup label={<FieldLabel label="Catalogs" help />} fieldId="ce-catalogs">
                <div className="ocs-cluster-extension-create__catalogs">
                  <LabelGroup>
                    {catalogs.map((cat) => (
                      <Label key={cat} color="blue" onClose={() => removeCatalog(cat)}>
                        {cat}
                      </Label>
                    ))}
                  </LabelGroup>
                  {catalogs.length > 0 ? (
                    <Button variant="link" isInline onClick={() => setCatalogs([])}>
                      Clear all
                    </Button>
                  ) : null}
                </div>
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>Package will only be resolved from specified catalogs.</HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>

              <ActionGroup>
                <Button variant="primary" isDisabled={!canSubmit} onClick={handleSubmit}>
                  Create
                </Button>
                <Button variant="link" component={Link} to="/ecosystem/software-catalog?catalog=nextgen">
                  Cancel
                </Button>
              </ActionGroup>
            </Form>
          </DualModeCreateLayout>
        </div>
      </Breadcrumbs>
    </div>
  );
}
