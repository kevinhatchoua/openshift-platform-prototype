import { Link } from "react-router";
import { Alert, AlertActionLink, Content } from "@patternfly/react-core";
import { useOlmOperatingMode } from "../../contexts/OlmOperatingModeContext";
import { NEXT_GEN_CATALOG_PATH } from "./olmCatalogRoutes";

/**
 * Shown on OLM (Classic) ecosystem surfaces — deprecation notice and path to OLM v1 catalog.
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
      title="OLM (Classic) is deprecated for new installs"
      className="ocs-olm-classic-experience-banner pf-v6-u-mb-md"
    >
      <Content component="p" className="pf-v6-u-mb-sm">
        Install new operators as OLM v1 cluster extensions from the Software Catalog. Use this view to manage
        existing OLM (Classic) operators and to migrate them when you are ready.
      </Content>
      <AlertActionLink
        component={Link}
        to={NEXT_GEN_CATALOG_PATH}
        onClick={() => setMode("nextgen")}
      >
        Go to OLM v1 catalog in Software Catalog
      </AlertActionLink>
    </Alert>
  );
}
