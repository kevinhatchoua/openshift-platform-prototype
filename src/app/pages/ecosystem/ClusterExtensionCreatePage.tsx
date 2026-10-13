import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import {
  ActionGroup,
  Button,
  ExpandableSection,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  TextInput,
  Title,
} from "@patternfly/react-core";
import Breadcrumbs from "../../components/Breadcrumbs";
import { OlmV1ClusterExtensionSpecFields } from "../../components/ecosystem/OlmV1ClusterExtensionSpecFields";
import {
  buildClusterExtensionYaml,
  defaultClusterExtensionSpec,
  type OlmV1ClusterExtensionSpec,
} from "../../components/ecosystem/olmV1ClusterExtensionSpec";
import { DualModeCreateLayout } from "../networking/DualModeCreateLayout";
import type { ConfigureViewMode } from "../networking/useSyncedFormYaml";
import {
  readClusterExtensionCreateState,
  type ClusterExtensionCreateState,
} from "./operatorCatalogInstallState";

const NAMESPACE_OPTIONS = [
  "openshift-operators",
  "openshift-gitops-operator",
  "cert-manager-operator",
];

const SERVICE_ACCOUNT_OPTIONS = [
  "cluster-extension-controller",
  "default",
  "openshift-gitops-operator-controller-manager",
];

const YAML_SCHEMA_FIELDS = [
  { name: "spec.packageName", type: "string", description: "Catalog package name for the extension." },
  { name: "spec.channel", type: "string", description: "Target channel (manual entry in 5.1)." },
  { name: "spec.version", type: "string", description: "Target version." },
  { name: "spec.versionRange", type: "string", description: "Optional semver range constraint." },
  { name: "spec.serviceAccountName", type: "string", description: "Service account used by the extension controller." },
];

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63);
}

export default function ClusterExtensionCreatePage() {
  const { operatorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const catalog = readClusterExtensionCreateState(operatorId, location.state);

  const defaultExtensionName = useMemo(
    () => slugFromName(catalog.name) || "new-cluster-extension",
    [catalog.name],
  );
  const defaultPackage = useMemo(() => slugFromName(catalog.name) || "fancy-operator", [catalog.name]);

  const [viewMode, setViewMode] = useState<ConfigureViewMode>("form");
  const [extensionName, setExtensionName] = useState(defaultExtensionName);
  const [packageName, setPackageName] = useState(defaultPackage);
  const [namespace, setNamespace] = useState("");
  const [serviceAccount, setServiceAccount] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [spec, setSpec] = useState<OlmV1ClusterExtensionSpec>(() => defaultClusterExtensionSpec());
  const [yamlText, setYamlText] = useState("");

  const formPayload = useMemo(
    () => ({
      name: extensionName,
      packageName,
      namespace,
      serviceAccountName: serviceAccount,
      spec,
    }),
    [extensionName, packageName, namespace, serviceAccount, spec],
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
    serviceAccount.length > 0 &&
    spec.channel.trim().length > 0 &&
    spec.version.trim().length > 0;

  const handleSubmit = () => {
    const payload: ClusterExtensionCreateState = {
      ...catalog,
      installKind: "cluster-extension",
      extensionName,
      packageName,
      namespace,
      serviceAccountName: serviceAccount,
      channel: spec.channel,
      version: spec.version,
      versionRange: spec.versionRange,
    };
    navigate(`/ecosystem/software-catalog/${catalog.id}/installing`, { state: payload });
  };

  return (
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
      <Breadcrumbs
        items={[
          { label: "Ecosystem", path: "/ecosystem" },
          { label: "Software Catalog", path: "/ecosystem/software-catalog?catalog=nextgen" },
          { label: "Create ClusterExtension" },
        ]}
      >
        <Title headingLevel="h1" size="2xl" className="pf-v6-u-mb-sm">
          Create ClusterExtension
        </Title>
        <p className="pf-v6-u-mb-lg pf-v6-u-color-200">
          Add and configure custom resources for your project.
        </p>

        <div className="ocs-cluster-extension-create pf-v6-u-pb-xl">
          <DualModeCreateLayout
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            yamlText={yamlText}
            onYamlChange={setYamlText}
            yamlError={null}
            hasUnmappedContent
            schemaTitle="ClusterExtension"
            schemaFields={YAML_SCHEMA_FIELDS}
          >
            <Form>
              <FormGroup label="ClusterExtension name" isRequired fieldId="ce-name">
                <TextInput
                  id="ce-name"
                  value={extensionName}
                  onChange={(_e, v) => setExtensionName(v)}
                  aria-label="ClusterExtension name"
                />
              </FormGroup>

              <FormGroup label="Package name" isRequired fieldId="ce-package">
                <TextInput
                  id="ce-package"
                  value={packageName}
                  onChange={(_e, v) => setPackageName(v)}
                  aria-label="Package name"
                />
                <p className="pf-v6-u-mt-sm pf-v6-u-font-size-sm pf-v6-u-color-200">
                  This is the key for finding the desired package.
                </p>
              </FormGroup>

              <FormGroup label="Namespace" isRequired fieldId="ce-namespace">
                <FormSelect
                  id="ce-namespace"
                  aria-label="Namespace"
                  value={namespace}
                  onChange={(_e, v) => setNamespace(v)}
                >
                  <FormSelectOption value="" label="Select a namespace" />
                  {NAMESPACE_OPTIONS.map((ns) => (
                    <FormSelectOption key={ns} value={ns} label={ns} />
                  ))}
                </FormSelect>
                <p className="pf-v6-u-mt-sm pf-v6-u-font-size-sm pf-v6-u-color-200">
                  We strongly suggest that you create a new namespace for each ClusterExtension you install.
                </p>
              </FormGroup>

              <FormGroup label="Service account name" isRequired fieldId="ce-sa">
                <FormSelect
                  id="ce-sa"
                  aria-label="Service account name"
                  value={serviceAccount}
                  onChange={(_e, v) => setServiceAccount(v)}
                >
                  <FormSelectOption value="" label="Select a service account name" />
                  {SERVICE_ACCOUNT_OPTIONS.map((sa) => (
                    <FormSelectOption key={sa} value={sa} label={sa} />
                  ))}
                </FormSelect>
              </FormGroup>

              <ExpandableSection
                toggleText={advancedOpen ? "Advanced configuration" : "Advanced configuration"}
                onToggle={(_e, open) => setAdvancedOpen(open)}
                isExpanded={advancedOpen}
                className="pf-v6-u-mt-md pf-v6-u-mb-md"
              >
                <OlmV1ClusterExtensionSpecFields idPrefix="ce-create-advanced" value={spec} onChange={setSpec} />
              </ExpandableSection>

              <ActionGroup>
                <Button variant="primary" isDisabled={!canSubmit} onClick={handleSubmit}>
                  Submit
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
