import {
  OLM_MODE_LABELS,
  useOlmOperatingMode,
  type OlmOperatingMode,
} from "../../contexts/OlmOperatingModeContext";
import { DataViewSingleSelectFilter } from "../dataView/DataViewSingleSelectFilter";

const TYPE_OPTIONS: { value: OlmOperatingMode; label: string }[] = [
  { value: "nextgen", label: OLM_MODE_LABELS.nextgen },
  { value: "classic", label: OLM_MODE_LABELS.classic },
];

type OlmOperatorCatalogTypeFilterProps = {
  filterId: string;
  title: string;
  showToolbarItem?: boolean;
};

/**
 * Installed Operators toolbar "Type" facet. Drives OLM Classic vs Next-Gen mode (not row attribute filters).
 * Ignores `value` / `onChange` injected by {@link IoDataViewFiltersWithMidActions}.
 */
export function OlmOperatorCatalogTypeFilter({
  title,
  showToolbarItem,
}: OlmOperatorCatalogTypeFilterProps) {
  const { mode, setMode } = useOlmOperatingMode();

  return (
    <DataViewSingleSelectFilter
      filterId="operatorCatalogType"
      title={title}
      showToolbarItem={showToolbarItem}
      value={mode}
      options={TYPE_OPTIONS}
      placeholder="Choose operator type"
      showIcon
      onChange={(_event, next) => {
        if (next === "classic" || next === "nextgen") {
          setMode(next);
        }
      }}
    />
  );
}
