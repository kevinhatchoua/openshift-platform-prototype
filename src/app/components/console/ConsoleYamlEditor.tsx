import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Flex,
  TextArea,
} from "@patternfly/react-core";
import CogIcon from "@patternfly/react-icons/dist/esm/icons/cog-icon";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";
import ExpandIcon from "@patternfly/react-icons/dist/esm/icons/expand-icon";
import FileIcon from "@patternfly/react-icons/dist/esm/icons/file-icon";
import OutlinedQuestionCircleIcon from "@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon";

export type ConsoleYamlEditorActions = {
  save?: boolean;
  reload?: boolean;
  cancel?: boolean;
  download?: boolean;
};

export const CONSOLE_YAML_ACTIONS_RESOURCE: ConsoleYamlEditorActions = {
  save: true,
  reload: true,
  cancel: true,
  download: true,
};

/** Create / import flows: page-level Create submits; editor offers download only. */
export const CONSOLE_YAML_ACTIONS_CREATE: ConsoleYamlEditorActions = {
  download: true,
};

export const CONSOLE_YAML_ACTIONS_DOWNLOAD_ONLY: ConsoleYamlEditorActions = {
  download: true,
};

export type ConsoleYamlEditorProps = {
  initialYaml: string;
  /** Controlled value; when set, `initialYaml` is only used for first paint / external resets. */
  yaml?: string;
  onChange?: (yaml: string) => void;
  editable?: boolean;
  actions?: ConsoleYamlEditorActions;
  downloadFileName?: string;
  ariaLabel?: string;
  className?: string;
  onSave?: (yaml: string) => void;
  onCancel?: () => void;
  showToolbar?: boolean;
};

function resolveActions(
  editable: boolean,
  actions?: ConsoleYamlEditorActions,
): ConsoleYamlEditorActions {
  if (actions) return actions;
  return editable ? CONSOLE_YAML_ACTIONS_RESOURCE : CONSOLE_YAML_ACTIONS_DOWNLOAD_ONLY;
}

export function ConsoleYamlEditor({
  initialYaml,
  yaml: yamlProp,
  onChange,
  editable = true,
  actions,
  downloadFileName = "resource.yaml",
  ariaLabel = "YAML",
  className,
  onSave,
  onCancel,
  showToolbar = true,
}: ConsoleYamlEditorProps) {
  const [internalYaml, setInternalYaml] = useState(initialYaml);
  const [savedYaml, setSavedYaml] = useState(initialYaml);

  const isControlled = yamlProp !== undefined;
  const yaml = isControlled ? yamlProp : internalYaml;

  useEffect(() => {
    setInternalYaml(initialYaml);
    setSavedYaml(initialYaml);
  }, [initialYaml]);

  const setYaml = useCallback(
    (next: string) => {
      if (!isControlled) setInternalYaml(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  const actionFlags = useMemo(() => resolveActions(editable, actions), [editable, actions]);

  const reload = useCallback(() => setYaml(savedYaml), [savedYaml, setYaml]);
  const cancel = useCallback(() => {
    setYaml(savedYaml);
    onCancel?.();
  }, [onCancel, savedYaml, setYaml]);

  const save = useCallback(() => {
    setSavedYaml(yaml);
    onSave?.(yaml);
  }, [onSave, yaml]);

  const download = useCallback(() => {
    const blob = new Blob([yaml], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = downloadFileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [downloadFileName, yaml]);

  const showFooter =
    actionFlags.save || actionFlags.reload || actionFlags.cancel || actionFlags.download;

  return (
    <Flex
      direction={{ default: "column" }}
      className={["ocs-console-yaml-editor", "ocs-io-yaml-panel", className].filter(Boolean).join(" ")}
    >
      {showToolbar ? (
        <Flex
          className="ocs-console-yaml-editor__toolbar ocs-io-yaml-panel__toolbar"
          alignItems={{ default: "alignItemsCenter" }}
          justifyContent={{ default: "justifyContentSpaceBetween" }}
        >
          <Flex gap={{ default: "gapSm" }}>
            <Button variant="plain" aria-label="View YAML file">
              <FileIcon aria-hidden />
            </Button>
            <Button variant="plain" aria-label="YAML editor settings">
              <CogIcon aria-hidden />
            </Button>
            <Button variant="plain" aria-label="Expand editor">
              <ExpandIcon aria-hidden />
            </Button>
          </Flex>
          <Button variant="link" isInline icon={<OutlinedQuestionCircleIcon aria-hidden />}>
            Shortcuts
          </Button>
        </Flex>
      ) : null}

      <TextArea
        className="ocs-console-yaml-editor__editor ocs-io-yaml-panel__editor"
        aria-label={ariaLabel}
        value={yaml}
        onChange={(_e, v) => setYaml(v)}
        resizeOrientation="vertical"
        isReadOnly={!editable}
      />

      {showFooter ? (
        <Flex
          className="ocs-console-yaml-editor__footer ocs-io-yaml-panel__footer"
          alignItems={{ default: "alignItemsCenter" }}
          justifyContent={{ default: "justifyContentSpaceBetween" }}
        >
          <Flex gap={{ default: "gapSm" }}>
            {actionFlags.save ? (
              <Button variant="primary" onClick={save} isDisabled={!editable}>Save</Button>
            ) : null}
            {actionFlags.reload ? (
              <Button variant="secondary" onClick={reload} isDisabled={!editable}>Reload</Button>
            ) : null}
            {actionFlags.cancel ? (
              <Button variant="secondary" onClick={cancel} isDisabled={!editable}>Cancel</Button>
            ) : null}
          </Flex>
          {actionFlags.download ? (
            <Button variant="secondary" icon={<DownloadIcon aria-hidden />} onClick={download}>
              Download
            </Button>
          ) : null}
        </Flex>
      ) : null}
    </Flex>
  );
}
