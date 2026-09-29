import { useState } from "react";
import { Alert, AlertActionCloseButton, Content } from "@patternfly/react-core";
import { useOlmOperatingMode } from "../../contexts/OlmOperatingModeContext";

const DISMISS_KEY = "ocs-olm-migration-strategy-notice-dismissed";

/**
 * Prototype / design-only notice — eng sync (Sep 28, 2026): migration UI depends on OLM team
 * defining cluster workflows (CSV vs ClusterExtension, manual vs automated).
 */
export function OlmMigrationStrategyNotice() {
  const { isClassic } = useOlmOperatingMode();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (!isClassic || dismissed) {
    return null;
  }

  return (
    <Alert
      variant="info"
      isInline
      title="Migration workflows pending OLM strategy"
      className="ocs-olm-migration-strategy-notice pf-v6-u-mb-md"
      actionClose={
        <AlertActionCloseButton
          onClose={() => {
            setDismissed(true);
            try {
              sessionStorage.setItem(DISMISS_KEY, "1");
            } catch {
              /* ignore */
            }
          }}
        />
      }
    >
      <Content component="p" className="pf-v6-u-mb-0">
        Bulk migrate and automatic rollback in this prototype explore target UX only. Console
        implementation stays blocked until the Operator Lifecycle Manager team confirms how
        OLMv0→v1 migration runs on-cluster (for example manual extension creation vs automated
        migration). Expect possible shift to a guided wizard rather than a single bulk action.
      </Content>
    </Alert>
  );
}
