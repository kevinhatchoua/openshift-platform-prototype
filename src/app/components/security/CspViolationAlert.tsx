import { Alert, Button, Content, Flex, Stack, StackItem } from "@patternfly/react-core";
import { Link } from "react-router";
import type { CspViolationScenario } from "../../lib/cspEnforcementDemo";

type CspViolationAlertProps = {
  scenario: CspViolationScenario;
  /** SSAR: user may edit ConsoleOperator CSP settings */
  canRemediate: boolean;
  enforcementMode: "observing" | "enforcing";
  /** Prototype: simulate toast vs inline */
  variant?: "inline" | "toast-style";
};

const DIRECTIVE_LABELS: Record<CspViolationScenario["directive"], string> = {
  "connect-src": "Browser connect-src",
  "helm-server": "Server-side Helm fetch",
  "object-src": "Object-src (plugin)",
  "media-src": "Media-src (plugin)",
};

/**
 * Role-aware blocked-connection pattern (CCSIG Q8): what / why / who can fix.
 */
export function CspViolationAlert({
  scenario,
  canRemediate,
  enforcementMode,
  variant = "inline",
}: CspViolationAlertProps) {
  const isWarn = enforcementMode === "observing";
  const title = isWarn
    ? `Connection would be blocked (${DIRECTIVE_LABELS[scenario.directive]})`
    : `Connection blocked (${DIRECTIVE_LABELS[scenario.directive]})`;

  return (
    <Alert
      variant={isWarn ? "warning" : "danger"}
      title={title}
      isInline={variant === "inline"}
      className={variant === "toast-style" ? "ocs-csp-violation-alert--toast" : undefined}
      actionLinks={
        canRemediate ? (
          <Flex gap={{ default: "gapSm" }}>
            <Button variant="link" isInline component={Link} to="/administration/content-security-policy">
              Review allow-list
            </Button>
            <Button variant="link" isInline component={Link} to="/administration/content-security-policy#cr-docs">
              ConsoleOperator CR
            </Button>
          </Flex>
        ) : undefined
      }
    >
      <Stack hasGutter>
        <StackItem>
          <Content component="p">
            <strong>Task:</strong> {scenario.task}
          </Content>
        </StackItem>
        <StackItem>
          <Content component="p">
            <strong>Blocked target:</strong> <code>{scenario.blockedUrl}</code>
          </Content>
        </StackItem>
        <StackItem>
          <Content component="small">{scenario.summary}</Content>
        </StackItem>
        {!canRemediate ? (
          <StackItem>
            <Content component="small">
              You do not have permission to change cluster CSP settings. Contact your cluster administrator and share
              the blocked URL and directive above.
            </Content>
          </StackItem>
        ) : null}
      </Stack>
    </Alert>
  );
}
