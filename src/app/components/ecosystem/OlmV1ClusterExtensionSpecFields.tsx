import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextInput,
} from "@patternfly/react-core";
import type { OlmV1ClusterExtensionSpec } from "./olmV1ClusterExtensionSpec";

type OlmV1ClusterExtensionSpecFieldsProps = {
  idPrefix: string;
  value: OlmV1ClusterExtensionSpec;
  onChange: (next: OlmV1ClusterExtensionSpec) => void;
  showVersionRange?: boolean;
  isReadOnly?: boolean;
};

/**
 * Manual channel / version / range inputs for OCP 5.1 (OCPSTRAT-2620).
 * Update discovery via catalogd is deferred (OCPSTRAT-3760 / 3761).
 */
export function OlmV1ClusterExtensionSpecFields({
  idPrefix,
  value,
  onChange,
  showVersionRange = true,
  isReadOnly = false,
}: OlmV1ClusterExtensionSpecFieldsProps) {
  const patch = (partial: Partial<OlmV1ClusterExtensionSpec>) => onChange({ ...value, ...partial });

  return (
    <>
      <FormGroup label="Channel" isRequired fieldId={`${idPrefix}-channel`}>
        <TextInput
          id={`${idPrefix}-channel`}
          value={value.channel}
          onChange={(_e, v) => patch({ channel: v })}
          aria-label="Channel"
          isDisabled={isReadOnly}
        />
        <FormHelperText>
          <HelperText>
            <HelperTextItem>Enter the target channel as plain text. Catalog-backed selectors are planned for a later release.</HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>

      <FormGroup label="Version" isRequired fieldId={`${idPrefix}-version`}>
        <TextInput
          id={`${idPrefix}-version`}
          value={value.version}
          onChange={(_e, v) => patch({ version: v })}
          aria-label="Version"
          isDisabled={isReadOnly}
        />
      </FormGroup>

      {showVersionRange ? (
        <FormGroup label="Version range" fieldId={`${idPrefix}-version-range`}>
          <TextInput
            id={`${idPrefix}-version-range`}
            value={value.versionRange}
            onChange={(_e, v) => patch({ versionRange: v })}
            aria-label="Version range"
            isDisabled={isReadOnly}
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem>Semver range accepted by the ClusterExtension API (for example &gt;=1.12.0 &lt;1.14.0).</HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
      ) : null}
    </>
  );
}
