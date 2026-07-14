import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
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
import { DualModeCreateLayout } from "./DualModeCreateLayout";
import { SERVICE_YAML_SCHEMA, serviceFormToYaml, serviceYamlToForm } from "./networkCreateYaml";
import { NETWORKING_CRUMB, NetworkingTablePanel } from "./networkingShared";
import { useSyncedFormYaml } from "./useSyncedFormYaml";

const SERVICE_TYPES = ["ClusterIP", "NodePort", "LoadBalancer", "ExternalName"] as const;

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
      schemaFields: SERVICE_YAML_SCHEMA,
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
    hasRequiredText(sync.formState.type) &&
    hasRequiredText(sync.formState.selector) &&
    hasValidPorts(sync.formState.ports);

  const description = useMemo(
    () =>
      sync.viewMode === "yaml"
        ? "Create by manually entering YAML or JSON definitions, or by dragging and dropping a file into the editor."
        : "Create a Service using the form. Switch to YAML view for full control, including fields not shown in the form.",
    [sync.viewMode]
  );

  const handleCreate = () => {
    if (!canCreate) return;
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

  return (
    <div className="ocs-app-page-outer w-full">
      <Breadcrumbs
        items={[
          { label: "Home", path: "/" },
          NETWORKING_CRUMB,
          { label: "Services", path: "/networking" },
          { label: "Create Service", path: "/networking/services/create" },
        ]}
      >
        <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
          <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
            <Title headingLevel="h1" size="2xl">
              Create Service
            </Title>
            <Content component="p">{description}</Content>
          </Flex>

          <NetworkingTablePanel>
            <div className="pf-v6-u-p-lg">
              <DualModeCreateLayout
                viewMode={sync.viewMode}
                onViewModeChange={sync.setViewMode}
                yamlText={sync.yamlText}
                onYamlChange={sync.handleYamlChange}
                yamlError={sync.yamlError}
                hasUnmappedContent={sync.hasUnmappedContent}
                schemaTitle={sync.schemaTitle}
                schemaFields={sync.schemaFields}
              >
                <Content component="p">
                  Expose an application running on a set of pods as a network service. Form fields sync with the YAML
                  manifest — aligned with the dual-mode create pattern from HPUX-1717.
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
              </DualModeCreateLayout>

              <Flex
                className="pf-v6-u-mt-lg"
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
                <Button variant="link" icon={<DownloadIcon />} onClick={handleDownload}>
                  Download
                </Button>
              </Flex>
            </div>
          </NetworkingTablePanel>
        </Flex>
      </Breadcrumbs>
    </div>
  );
}
