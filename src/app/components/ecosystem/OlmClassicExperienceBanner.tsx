import { Link } from "react-router";
import { Alert, AlertActionLink, Content } from "@patternfly/react-core";
import {
  OLM_MODE_LABELS,
  useOlmOperatingMode,
} from "../../contexts/OlmOperatingModeContext";
import { NEXT_GEN_CATALOG_PATH } from "./olmCatalogRoutes";

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
      title="Viewing legacy operators"
      className="ocs-olm-classic-experience-banner pf-v6-u-mb-md"
    >
      <Content component="p" className="pf-v6-u-mb-sm">
        New cluster extensions must be installed from the Operators catalog.
      </Content>
      <AlertActionLink
        component={Link}
        to={NEXT_GEN_CATALOG_PATH}
        onClick={() => setMode("nextgen")}
      >
        Go to Operators catalog
      </AlertActionLink>
    </Alert>
  );
}
