import { useCallback, useState } from "react";
import type { ParseYamlResult, YamlSchemaField } from "./networkCreateYaml";

export type ConfigureViewMode = "form" | "yaml";

export type SyncedFormYamlConfig<T extends Record<string, unknown>> = {
  toYaml: (state: T) => string;
  fromYaml: (yaml: string) => ParseYamlResult<T>;
  schemaTitle: string;
  schemaFields: YamlSchemaField[];
};

export function useSyncedFormYaml<T extends Record<string, unknown>>(
  config: SyncedFormYamlConfig<T>,
  initialState: T
) {
  const [viewMode, setViewMode] = useState<ConfigureViewMode>("form");
  const [formState, setFormState] = useState<T>(initialState);
  const [yamlText, setYamlText] = useState(() => config.toYaml(initialState));
  const [yamlError, setYamlError] = useState<string | null>(null);
  const [hasUnmappedContent, setHasUnmappedContent] = useState(false);

  const applyYamlParse = useCallback(
    (yaml: string) => {
      const result = config.fromYaml(yaml);
      setYamlError(result.error);
      setHasUnmappedContent(result.hasUnmappedContent);
      if (!result.error && result.partial) {
        setFormState((prev) => ({ ...prev, ...result.partial }));
      }
      return result;
    },
    [config]
  );

  const patchFormState = useCallback(
    (patch: Partial<T>) => {
      setFormState((prev) => {
        const next = { ...prev, ...patch };
        setYamlText(config.toYaml(next));
        setYamlError(null);
        setHasUnmappedContent(false);
        return next;
      });
    },
    [config]
  );

  const handleYamlChange = useCallback(
    (value: string) => {
      setYamlText(value);
      applyYamlParse(value);
    },
    [applyYamlParse]
  );

  const changeViewMode = useCallback(
    (mode: ConfigureViewMode) => {
      if (mode === "yaml") {
        setYamlText(config.toYaml(formState));
        setYamlError(null);
        setHasUnmappedContent(false);
      } else {
        applyYamlParse(yamlText);
      }
      setViewMode(mode);
    },
    [applyYamlParse, config, formState, yamlText]
  );

  const canSubmit = yamlError === null;

  return {
    viewMode,
    setViewMode: changeViewMode,
    formState,
    setFormState,
    patchFormState,
    yamlText,
    yamlError,
    hasUnmappedContent,
    handleYamlChange,
    canSubmit,
    schemaTitle: config.schemaTitle,
    schemaFields: config.schemaFields,
  };
}
