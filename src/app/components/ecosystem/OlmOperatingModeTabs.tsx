import { Tab, Tabs, TabTitleText } from "@patternfly/react-core";
import {
  OLM_MODE_LABELS,
  type OlmOperatingMode,
  useOlmOperatingMode,
} from "../../contexts/OlmOperatingModeContext";

type OlmOperatingModeTabsProps = {
  /** Optional id prefix when multiple tab sets exist on one page. */
  id?: string;
};

export function OlmOperatingModeTabs({ id = "olm-operating-mode" }: OlmOperatingModeTabsProps) {
  const { mode, setMode } = useOlmOperatingMode();

  return (
    <Tabs
      id={id}
      aria-label="Operator catalog type"
      activeKey={mode}
      onSelect={(_event, eventKey) => {
        if (eventKey === "classic" || eventKey === "nextgen") {
          setMode(eventKey as OlmOperatingMode);
        }
      }}
      variant="secondary"
      className="ocs-olm-mode-tabs"
    >
      <Tab
        eventKey="classic"
        title={<TabTitleText>{OLM_MODE_LABELS.classic}</TabTitleText>}
        ouiaId="olm-mode-tab-classic"
      />
      <Tab
        eventKey="nextgen"
        title={<TabTitleText>{OLM_MODE_LABELS.nextgen}</TabTitleText>}
        ouiaId="olm-mode-tab-nextgen"
      />
    </Tabs>
  );
}
