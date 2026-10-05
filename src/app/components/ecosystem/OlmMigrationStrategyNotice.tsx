import { useState } from "react";
import { Alert, AlertActionCloseButton, Content } from "@patternfly/react-core";
import { useOlmOperatingMode } from "../../contexts/OlmOperatingModeContext";

const DISMISS_KEY = "ocs-olm-migration-strategy-notice-dismissed-v2";

/**
 * Classic Installed Operators — migration wizard entry notice (OCPSTRAT-2692 prototype).
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
      title="Operator migration uses dry run, review, then execute"
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
        Select operators, run a <strong>dry run</strong> (no cluster changes), then confirm at the{" "}
        <strong>point of no return</strong> before migration executes. Track progress in the Migration
        status column.{" "}
        <a
          href="https://docs.openshift.com"
          target="_blank"
          rel="noopener noreferrer"
          className="pf-v6-u-font-weight-bold"
        >
          Learn about migration risks
        </a>
      </Content>
    </Alert>
  );
}
