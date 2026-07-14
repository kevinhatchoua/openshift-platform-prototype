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
  TextArea,
  TextInput,
  Title,
} from "@patternfly/react-core";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import Breadcrumbs from "../../components/Breadcrumbs";
import FavoriteButton from "../../components/FavoriteButton";
import { ConsoleYamlCreateView, type ConsoleSchemaField } from "./ConsoleYamlCreateView";
import { EditorToggle } from "./EditorToggle";
import { serviceFormToYaml, serviceYamlToForm } from "./networkCreateYaml";
import { createService } from "./networkingMockData";
import { NETWORKING_CRUMB } from "./networkingShared";
import { useSyncedFormYaml } from "./useSyncedFormYaml";

const SERVICE_TYPES = ["ClusterIP", "NodePort", "LoadBalancer", "ExternalName"] as const;

const SERVICE_SCHEMA_INTRO =
  "Service is a named abstraction of software service (for example, mysql) consisting of local port that the proxy listens on, and the selector that determines which pods will answer requests sent through the proxy.";

const SERVICE_SCHEMA_FIELDS: ConsoleSchemaField[] = [
  {
    name: "apiVersion",
    type: "string",
    description: "APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values.",
    allowedValues: "v1",
    docsHref: "https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.29/#service-v1-core",
  },
  {
    name: "kind",
    type: "string",
    description:
      "Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated.",
    allowedValues: "Service",
    docsHref: "https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.29/#service-v1-core",
  },
  {
    name: "metadata",
    type: "object",
    description: "Standard object's metadata.",
    docsHref: "https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.29/#objectmeta-v1-meta",
    hasViewDetails: true,
  },
  {
    name: "spec",
    type: "object",
    description:
      "Spec defines the behavior of a service. https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status",
    docsHref: "https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.29/#servicespec-v1-core",
    hasViewDetails: true,
  },
];

function hasRequiredText(value: string | undefined): boolean {
  return (value ?? "").trim().length > 0;
}

function hasValidPorts(value: string | undefined): boolean {
  const lines = (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return false;
  return lines.every(
    (line) =>
      /^\d+\s*:\s*\d+\s*\/\s*\w+$/i.test(line) ||
      /^\d+\s*\/\s*\w+$/i.test(line) ||
      /^\d+$/.test(line)
  );
}

export default function CreateServicePage() {
  const navigate = useNavigate();
  const sync = useSyncedFormYaml(
    {
      toYaml: serviceFormToYaml,
      fromYaml: serviceYamlToForm,
      schemaTitle: "Service",
      schemaFields: [],
    },
    {
      name: "example",
      namespace: "default",
      type: "ClusterIP",
      selector: "app=MyApp",
      ports: "80:9376/TCP",
    }
  );

  const canCreate =
    sync.canSubmit &&
    hasRequiredText(sync.formState.name) &&
    hasRequiredText(sync.formState.namespace) &&
    (sync.viewMode === "yaml" ||
      (hasRequiredText(sync.formState.type) &&
        hasRequiredText(sync.formState.selector) &&
        hasValidPorts(sync.formState.ports)));

  const handleCreate = () => {
    if (!canCreate) return;
    createService({
      name: sync.formState.name,
      namespace: sync.formState.namespace,
      type: sync.formState.type,
      selector: sync.formState.selector,
      ports: sync.formState.ports,
    });
    navigate("/networking");
  };

  const handleDownload = () => {
    const blob = new Blob([sync.yamlText], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${sync.formState.name || "service"}.yaml`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const description =
    sync.viewMode === "yaml"
      ? "Create by manually entering YAML or JSON definitions, or by dragging and dropping a file into the editor."
      : "Create a Service using the form. Switch to YAML view for full control, including fields not shown in the form.";

  return (
    <div className="ocs-app-page-outer w-full ocs-create-service-page">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          NETWORKING_CRUMB,
          { label: "Services", path: "/networking" },
          { label: "Create Service", path: "/networking/services/create" },
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
                Create Service
              </Title>
              <Content component="p" className="ocs-create-service-page__desc">
                {description}
              </Content>
            </Flex>
            <FavoriteButton name="Create Service" path="/networking/services/create" />
          </Flex>

          <EditorToggle
            value={sync.viewMode}
            onChange={sync.setViewMode}
            idPrefix="service-create"
          />

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
              schemaTitle="Service"
              schemaIntro={SERVICE_SCHEMA_INTRO}
              schemaFields={SERVICE_SCHEMA_FIELDS}
              ariaLabel="Service YAML"
            />
          ) : (
            <div className="app-glass-panel pf-v6-u-p-lg">
              <Content component="p">
                Expose an application running on a set of pods as a network service. Form fields sync with the YAML
                manifest.
              </Content>
              <Form className="pf-v6-u-mt-md">
                <FormGroup label="Name" isRequired fieldId="service-name">
                  <TextInput
                    id="service-name"
                    value={sync.formState.name}
                    onChange={(_e, v) => sync.patchFormState({ name: v })}
                    type="text"
                  />
                </FormGroup>
                <FormGroup label="Namespace" isRequired fieldId="service-namespace">
                  <TextInput
                    id="service-namespace"
                    value={sync.formState.namespace}
                    onChange={(_e, v) => sync.patchFormState({ namespace: v })}
                    type="text"
                  />
                </FormGroup>
                <FormGroup label="Type" isRequired fieldId="service-type">
                  <FormSelect
                    id="service-type"
                    value={sync.formState.type}
                    onChange={(_e, v) => sync.patchFormState({ type: v })}
                    aria-label="Service type"
                  >
                    {SERVICE_TYPES.map((type) => (
                      <FormSelectOption key={type} value={type} label={type} />
                    ))}
                  </FormSelect>
                </FormGroup>
                <FormGroup label="Selector" isRequired fieldId="service-selector">
                  <TextArea
                    id="service-selector"
                    value={sync.formState.selector}
                    onChange={(_e, v) => sync.patchFormState({ selector: v })}
                    resizeOrientation="vertical"
                    rows={3}
                    aria-label="Pod selector labels"
                  />
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem>One label per line as key=value (e.g. app=MyApp).</HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                </FormGroup>
                <FormGroup label="Ports" isRequired fieldId="service-ports">
                  <TextArea
                    id="service-ports"
                    value={sync.formState.ports}
                    onChange={(_e, v) => sync.patchFormState({ ports: v })}
                    resizeOrientation="vertical"
                    rows={3}
                    aria-label="Service ports"
                  />
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem>
                        One port per line as port:targetPort/PROTOCOL (e.g. 80:9376/TCP).
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
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
              <Button variant="secondary" onClick={() => navigate("/networking")}>
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
