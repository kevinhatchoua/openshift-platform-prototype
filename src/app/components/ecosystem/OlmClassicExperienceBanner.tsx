import { Link } from "react-router";
import { Alert, AlertActionLink, Content } from "@patternfly/react-core";
import {
  OLM_MODE_LABELS,
  useOlmOperatingMode,
} from "../../contexts/OlmOperatingModeContext";

/**
 * Shown on Classic (OLMv0) ecosystem surfaces per OCPSTRAT-3644 sync — identifies the
 * classic experience and routes admins toward the Next-Gen operator catalog.
 */
export function OlmClassicExperienceBanner() {
  const { isClassic, setMode } = useOlmOperatingMode();

  if (!isClassic) {
    return null;
  }

  return (
    <Alert
      variant="warning"
      isInline
      title="Classic operator experience"
      className="ocs-olm-classic-experience-banner pf-v6-u-mb-md"
    >
      <Content component="p" className="pf-v6-u-mb-sm">
        You are viewing operators and catalog entries managed with the classic Operator Lifecycle
        Manager model. New cluster extensions install from the {OLM_MODE_LABELS.nextgen} catalog.
      </Content>
      <AlertActionLink
        component={Link}
        to="/ecosystem/software-catalog"
        onClick={() => setMode("nextgen")}
      >
        Open {OLM_MODE_LABELS.nextgen} in Software Catalog
      </AlertActionLink>
    </Alert>
  );
}
