import { Link } from "react-router";
import { Alert, AlertActionLink, Content } from "@patternfly/react-core";
import { OLM_MODE_LABELS, useOlmOperatingMode } from "../../contexts/OlmOperatingModeContext";
import { NEXT_GEN_CATALOG_PATH } from "./olmCatalogRoutes";

/** Shown on Classic ecosystem surfaces — deprecation notice and path to cluster extensions catalog. */
export function OlmClassicExperienceBanner() {
  const { isClassic, setMode } = useOlmOperatingMode();

  if (!isClassic) {
    return null;
  }

  return (
    <Alert
      variant="warning"
      isInline
      title="Classic operators are deprecated for new installs"
      className="ocs-olm-classic-experience-banner pf-v6-u-mb-md"
    >
      <Content component="p" className="pf-v6-u-mb-sm">
        Install new software as cluster extensions from the Software Catalog. Use this view to manage existing
        Classic operators and to migrate them when you are ready.
      </Content>
      <AlertActionLink
        component={Link}
        to={NEXT_GEN_CATALOG_PATH}
        onClick={() => setMode("nextgen")}
      >
        Go to {OLM_MODE_LABELS.nextgen} in Software Catalog
      </AlertActionLink>
    </Alert>
  );
}
