import { Button, Content, Flex, FlexItem, ToggleGroup, ToggleGroupItem } from "@patternfly/react-core";
import {
  OLM_MODE_LABELS,
  type OlmOperatingMode,
  useOlmOperatingMode,
} from "../../contexts/OlmOperatingModeContext";

type OlmOperatingModeToolbarProps = {
  /** Operators managed in the other mode (Installed Operators cross-mode hint). */
  otherModeOperatorCount?: number;
  otherModeLabel?: string;
  /** Optional action shown in Classic mode (e.g. migrate to Next-Gen). */
  classicModeAction?: React.ReactNode;
};

export function OlmOperatingModeToolbar({
  otherModeOperatorCount = 0,
  otherModeLabel,
  classicModeAction,
}: OlmOperatingModeToolbarProps) {
  const { mode, setMode, isClassic } = useOlmOperatingMode();

  const handleSelect = (_event: React.MouseEvent | React.KeyboardEvent, selected: boolean, next: OlmOperatingMode) => {
    if (selected) setMode(next);
  };

  return (
    <Flex
      direction={{ default: "column" }}
      gap={{ default: "gapSm" }}
      className="ocs-olm-mode-toolbar"
    >
      <Flex
        alignItems={{ default: "alignItemsCenter" }}
        justifyContent={{ default: "justifyContentSpaceBetween" }}
        flexWrap={{ default: "wrap" }}
        gap={{ default: "gapMd" }}
      >
        <FlexItem>
          <ToggleGroup aria-label="Operator catalog operating mode" isCompact>
            <ToggleGroupItem
              buttonId="olm-mode-classic"
              isSelected={mode === "classic"}
              onChange={(event, selected) => handleSelect(event, selected, "classic")}
            >
              {OLM_MODE_LABELS.classic}
            </ToggleGroupItem>
            <ToggleGroupItem
              buttonId="olm-mode-nextgen"
              isSelected={mode === "nextgen"}
              onChange={(event, selected) => handleSelect(event, selected, "nextgen")}
            >
              {OLM_MODE_LABELS.nextgen}
            </ToggleGroupItem>
          </ToggleGroup>
        </FlexItem>
        {isClassic && classicModeAction ? <FlexItem>{classicModeAction}</FlexItem> : null}
      </Flex>
      <Content component="small" className="ocs-olm-mode-toolbar-hint">
        {mode === "classic"
          ? "Operators (Legacy) shows OLMv0-managed operators and the legacy catalog. Your preference applies across Software Catalog and Installed Operators."
          : "Operators shows OLMv1 cluster extensions from a separate catalog filtered for cluster compatibility."}
      </Content>
      {otherModeOperatorCount > 0 && otherModeLabel ? (
        <Content component="p" className="ocs-olm-mode-cross-hint">
          {otherModeOperatorCount} {otherModeLabel}{" "}
          <Button
            variant="link"
            isInline
            onClick={() => setMode(isClassic ? "nextgen" : "classic")}
          >
            Switch to {isClassic ? OLM_MODE_LABELS.nextgen : OLM_MODE_LABELS.classic}
          </Button>
        </Content>
      ) : null}
    </Flex>
  );
}
