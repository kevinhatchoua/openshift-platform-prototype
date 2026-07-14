import type { FormEvent } from "react";
import { Flex, Radio } from "@patternfly/react-core";
import type { ConfigureViewMode } from "./useSyncedFormYaml";

type EditorToggleProps = {
  value: ConfigureViewMode;
  onChange: (mode: ConfigureViewMode) => void;
  /** Prefix for radio ids when multiple toggles can mount on one page. */
  idPrefix?: string;
};

/**
 * OCP console Form/YAML switcher — mirrors console-shared EditorToggle
 * (Configure via: + Form view / YAML view radios on one row).
 */
export function EditorToggle({ value, onChange, idPrefix = "editor" }: EditorToggleProps) {
  const formId = `${idPrefix}-form`;
  const yamlId = `${idPrefix}-yaml`;
  const labelId = `${idPrefix}-configure-via-label`;

  const handleChange = (event: FormEvent<HTMLInputElement>) => {
    onChange(event.currentTarget.value as ConfigureViewMode);
  };

  return (
    <div className="ocs-editor-toggle">
      <Flex
        spaceItems={{ default: "spaceItemsMd" }}
        alignItems={{ default: "alignItemsCenter" }}
        role="radiogroup"
        aria-labelledby={labelId}
      >
        <label className="ocs-editor-toggle__label" id={labelId}>
          Configure via:
        </label>
        <Radio
          id={formId}
          name={`${idPrefix}-configure-via`}
          label="Form view"
          value="form"
          isChecked={value === "form"}
          onChange={handleChange}
        />
        <Radio
          id={yamlId}
          name={`${idPrefix}-configure-via`}
          label="YAML view"
          value="yaml"
          isChecked={value === "yaml"}
          onChange={handleChange}
        />
      </Flex>
    </div>
  );
}
