import { useNavigate } from "react-router";
import {
  Alert,
  Button,
  Content,
  Flex,
  Form,
  FormGroup,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  TextInput,
  Title,
} from "@patternfly/react-core";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { ConsoleYamlCreateView, type ConsoleSchemaField } from "./ConsoleYamlCreateView";
import { EditorToggle } from "./EditorToggle";
import { routeFormToYaml, routeYamlToForm } from "./networkCreateYaml";
import { createRoute } from "./networkingMockData";
import { NETWORKING_CRUMB } from "./networkingShared";
import { useSyncedFormYaml } from "./useSyncedFormYaml";

const TLS_OPTIONS = ["edge", "reencrypt", "passthrough", "None"] as const;

const ROUTE_SCHEMA_INTRO =
  "A Route exposes a Service at a host name for external clients. TLS termination and the backing Service determine how traffic reaches application pods.";

const ROUTE_SCHEMA_FIELDS: ConsoleSchemaField[] = [
  {
    name: "apiVersion",
    type: "string",
    description: "APIVersion for OpenShift Route resources.",
    allowedValues: "route.openshift.io/v1",
  },
  {
    name: "kind",
    type: "string",
    description: "Must be Route.",
    allowedValues: "Route",
  },
  {
    name: "metadata",
    type: "object",
    description: "Standard object's metadata.",
    hasViewDetails: true,
  },
  {
    name: "spec",
    type: "object",
    description: "Desired state of the Route, including host, to (Service), and optional TLS.",
    hasViewDetails: true,
  },
];

function hasRequiredText(value: string | undefined): boolean {
  return (value ?? "").trim().length > 0;
}

export default function CreateRoutePage() {
  const navigate = useNavigate();
  const sync = useSyncedFormYaml(
    {
      toYaml: routeFormToYaml,
      fromYaml: routeYamlToForm,
      schemaTitle: "Route",
      schemaFields: [],
    },
    {
      name: "example",
      namespace: "default",
      hostname: "example-default.apps.cluster.example.com",
      serviceName: "frontend",
      tlsTermination: "edge",
    }
  );

  const canCreate =
    sync.canSubmit &&
    hasRequiredText(sync.formState.name) &&
    hasRequiredText(sync.formState.namespace) &&
    (sync.viewMode === "yaml" || hasRequiredText(sync.formState.serviceName));

  const handleCreate = () => {
    if (!canCreate) return;
    createRoute({
      name: sync.formState.name,
      namespace: sync.formState.namespace,
      hostname: sync.formState.hostname,
      serviceName: sync.formState.serviceName,
      tlsTermination: sync.formState.tlsTermination,
    });
    navigate("/networking/routes");
  };

  const handleDownload = () => {
    const blob = new Blob([sync.yamlText], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${sync.formState.name || "route"}.yaml`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const description =
    sync.viewMode === "yaml"
      ? "Create by manually entering YAML or JSON definitions, or by dragging and dropping a file into the editor."
      : "Create a Route using the form. Switch to YAML view for full control, including fields not shown in the form.";

  return (
    <div className="ocs-app-page-outer w-full ocs-create-service-page">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          NETWORKING_CRUMB,
          { label: "Routes", path: "/networking/routes" },
          { label: "Create Route", path: "/networking/routes/create" },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }} className="ocs-create-service-page__body">
          <Flex
            alignItems={{ default: "alignItemsFlexStart" }}
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            flexWrap={{ default: "nowrap" }}
          >
            <Flex direction={{ default: "column" }} gap={{ default: "gapXs" }}>
              <Title headingLevel="h1" size="2xl">
                Create Route
              </Title>
              <Content component="p" className="ocs-create-service-page__desc">
                {description}
              </Content>
            </Flex>
            <FavoriteButton name="Create Route" path="/networking/routes/create" />
          </Flex>

          <EditorToggle value={sync.viewMode} onChange={sync.setViewMode} idPrefix="route-create" />

          {sync.yamlError ? (
            <Alert variant="danger" title="YAML validation error" isInline>
              {sync.yamlError}
            </Alert>
          ) : null}

          {sync.viewMode === "form" && sync.hasUnmappedContent ? (
            <Alert variant="info" title="Some fields may not be represented in the form view." isInline>
              Select YAML view for full control of unrecognized configuration.
            </Alert>
          ) : null}

          {sync.viewMode === "yaml" ? (
            <ConsoleYamlCreateView
              yamlText={sync.yamlText}
              onYamlChange={sync.handleYamlChange}
              schemaTitle="Route"
              schemaIntro={ROUTE_SCHEMA_INTRO}
              schemaFields={ROUTE_SCHEMA_FIELDS}
              ariaLabel="Route YAML"
            />
          ) : (
            <div className="app-glass-panel pf-v6-u-p-lg">
              <Content component="p">
                Expose a Service at a hostname. Form fields sync with the YAML manifest. Health on the Routes list
                reflects the referenced Service&apos;s endpoint readiness.
              </Content>
              <Form className="pf-v6-u-mt-md">
                <FormGroup label="Name" isRequired fieldId="route-name">
                  <TextInput
                    id="route-name"
                    value={sync.formState.name}
                    onChange={(_e, v) => sync.patchFormState({ name: v })}
                    type="text"
                  />
                </FormGroup>
                <FormGroup label="Namespace" isRequired fieldId="route-namespace">
                  <TextInput
                    id="route-namespace"
                    value={sync.formState.namespace}
                    onChange={(_e, v) => sync.patchFormState({ namespace: v })}
                    type="text"
                  />
                </FormGroup>
                <FormGroup label="Hostname" fieldId="route-hostname">
                  <TextInput
                    id="route-hostname"
                    value={sync.formState.hostname}
                    onChange={(_e, v) => sync.patchFormState({ hostname: v })}
                    type="text"
                  />
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem>
                        Optional. Leave blank to generate {"{name}-{namespace}.apps.cluster.example.com"}.
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                </FormGroup>
                <FormGroup label="Service" isRequired fieldId="route-service">
                  <TextInput
                    id="route-service"
                    value={sync.formState.serviceName}
                    onChange={(_e, v) => sync.patchFormState({ serviceName: v })}
                    type="text"
                  />
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem>Name of the Service in the same namespace that backs this Route.</HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                </FormGroup>
                <FormGroup label="TLS termination" fieldId="route-tls">
                  <FormSelect
                    id="route-tls"
                    value={sync.formState.tlsTermination}
                    onChange={(_e, v) => sync.patchFormState({ tlsTermination: v })}
                    aria-label="TLS termination"
                  >
                    {TLS_OPTIONS.map((opt) => (
                      <FormSelectOption key={opt} value={opt} label={opt} />
                    ))}
                  </FormSelect>
                </FormGroup>
              </Form>
            </div>
          )}

          <Flex
            className="ocs-create-service-page__footer"
            justifyContent={{ default: "justifyContentSpaceBetween" }}
            alignItems={{ default: "alignItemsCenter" }}
            flexWrap={{ default: "wrap" }}
            gap={{ default: "gapMd" }}
          >
            <Flex gap={{ default: "gapMd" }}>
              <Button variant="primary" isDisabled={!canCreate} onClick={handleCreate}>
                Create
              </Button>
              <Button variant="secondary" onClick={() => navigate("/networking/routes")}>
                Cancel
              </Button>
            </Flex>
            <Button variant="secondary" icon={<DownloadIcon />} onClick={handleDownload}>
              Download
            </Button>
          </Flex>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
