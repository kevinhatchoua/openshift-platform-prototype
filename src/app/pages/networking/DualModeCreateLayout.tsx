import {
  Alert,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  FormGroup,
  Radio,
  TextArea,
  Title,
} from "@patternfly/react-core";
import type { ConfigureViewMode } from "./useSyncedFormYaml";
import type { YamlSchemaField } from "./networkCreateYaml";

type DualModeCreateLayoutProps = {
  viewMode: ConfigureViewMode;
  onViewModeChange: (mode: ConfigureViewMode) => void;
  yamlText: string;
  onYamlChange: (value: string) => void;
  yamlError: string | null;
  hasUnmappedContent: boolean;
  schemaTitle: string;
  schemaFields: YamlSchemaField[];
  children: React.ReactNode;
};

export function DualModeCreateLayout({
  viewMode,
  onViewModeChange,
  yamlText,
  onYamlChange,
  yamlError,
  hasUnmappedContent,
  schemaTitle,
  schemaFields,
  children,
}: DualModeCreateLayoutProps) {
  return (
    <div className="ocs-dual-mode-create">
      <FormGroup label="Configure via" fieldId="configure-via">
        <div className="ocs-dual-mode-create__toggle" role="radiogroup" aria-label="Configure via">
          <Radio
            id="configure-form-view"
            name="configure-via"
            label="Form view"
            isChecked={viewMode === "form"}
            onChange={() => onViewModeChange("form")}
          />
          <Radio
            id="configure-yaml-view"
            name="configure-via"
            label="YAML view"
            isChecked={viewMode === "yaml"}
            onChange={() => onViewModeChange("yaml")}
          />
        </div>
      </FormGroup>

      <Divider className="ocs-dual-mode-create__divider" />

      {hasUnmappedContent ? (
        <Alert
          variant="info"
          title="Some fields may not be represented in the form view."
          isInline
          className="ocs-dual-mode-create__banner"
        >
          Select YAML view for full control of unrecognized configuration.
        </Alert>
      ) : null}

      {yamlError ? (
        <Alert variant="danger" title="YAML validation error" isInline className="ocs-dual-mode-create__banner">
          {yamlError}
        </Alert>
      ) : null}

      {viewMode === "form" ? children : null}

      {viewMode === "yaml" ? (
        <div className="ocs-dual-mode-create__yaml-layout">
          <TextArea
            id="create-resource-yaml"
            className="ocs-dual-mode-create__yaml-editor"
            value={yamlText}
            onChange={(_event, value) => onYamlChange(value)}
            resizeOrientation="vertical"
            aria-label="Resource YAML"
          />
          <aside className="ocs-dual-mode-create__schema" aria-label={`${schemaTitle} schema`}>
            <Title headingLevel="h3" size="md">
              {schemaTitle}
            </Title>
            <Content component="p" className="ocs-dual-mode-create__schema-intro">
              Schema reference for fields in this resource manifest.
            </Content>
            <DescriptionList isCompact>
              {schemaFields.map((field) => (
                <DescriptionListGroup key={field.name}>
                  <DescriptionListTerm>
                    {field.name} <Content component="small">({field.type})</Content>
                  </DescriptionListTerm>
                  <DescriptionListDescription>{field.description}</DescriptionListDescription>
                </DescriptionListGroup>
              ))}
            </DescriptionList>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
