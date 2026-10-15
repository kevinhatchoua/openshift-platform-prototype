import { useCallback, useState } from "react";
import { Alert, AlertActionCloseButton, Content } from "@patternfly/react-core";
import { OLM_MODE_LABELS } from "../../contexts/OlmOperatingModeContext";

const STORAGE_KEY = "ocp-prototype-olm-mode-intro-dismissed";

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** One-time explainer for legacy vs cluster-extension operator views (design review feedback). */
export function OlmOperatingModeIntroAlert() {
  const [dismissed, setDismissed] = useState(() => readDismissed());

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  if (dismissed) {
    return null;
  }

  return (
    <Alert
      variant="info"
      isInline
      title="Two operator catalogs"
      actionClose={<AlertActionCloseButton onClose={dismiss} />}
      className="pf-v6-u-mb-md"
    >
      <Content component="p">
        <strong>{OLM_MODE_LABELS.nextgen}</strong> lists cluster extensions installed with OLM v1.{" "}
        <strong>{OLM_MODE_LABELS.classic}</strong> lists subscriptions managed with the classic Operator Lifecycle
        Manager. New cluster extensions install from the Operators software catalog.
      </Content>
    </Alert>
  );
}
