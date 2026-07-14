import { Flex, Tooltip } from "@patternfly/react-core";
import CheckCircleIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import ExclamationTriangleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon";
import QuestionCircleIcon from "@patternfly/react-icons/dist/esm/icons/question-circle-icon";

/** Aggregated endpoint readiness for Services / Routes list health columns (RFE-9483 / HPUX-1868). */
export type EndpointHealthStatus = "healthy" | "degraded" | "down" | "unknown";

export type EndpointHealth = {
  status: EndpointHealthStatus;
  ready: number;
  total: number;
};

export function deriveEndpointHealth(ready: number, total: number, loaded = true): EndpointHealth {
  if (!loaded) return { status: "unknown", ready: 0, total: 0 };
  if (total <= 0 || ready <= 0) return { status: "down", ready: Math.max(0, ready), total: Math.max(0, total) };
  if (ready < total) return { status: "degraded", ready, total };
  return { status: "healthy", ready, total };
}

const STATUS_LABEL: Record<EndpointHealthStatus, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  down: "Down",
  unknown: "Unknown",
};

function HealthIcon({ status }: { status: EndpointHealthStatus }) {
  switch (status) {
    case "healthy":
      return <CheckCircleIcon className="ocs-endpoint-health__icon ocs-endpoint-health__icon--healthy" aria-hidden />;
    case "degraded":
      return (
        <ExclamationTriangleIcon className="ocs-endpoint-health__icon ocs-endpoint-health__icon--degraded" aria-hidden />
      );
    case "down":
      return <ExclamationCircleIcon className="ocs-endpoint-health__icon ocs-endpoint-health__icon--down" aria-hidden />;
    default:
      return (
        <QuestionCircleIcon className="ocs-endpoint-health__icon ocs-endpoint-health__icon--unknown" aria-hidden />
      );
  }
}

export function EndpointHealthCell({
  health,
  label = "Health",
}: {
  health: EndpointHealth;
  /** Accessible name prefix for the cell */
  label?: string;
}) {
  const count = health.status === "unknown" ? null : `${health.ready}/${health.total}`;
  const tooltip =
    health.status === "unknown"
      ? `${STATUS_LABEL.unknown}: endpoint readiness not loaded`
      : `${STATUS_LABEL[health.status]}: ${health.ready} of ${health.total} endpoints ready`;

  return (
    <Tooltip content={tooltip}>
      <Flex
        className={`ocs-endpoint-health ocs-endpoint-health--${health.status}`}
        alignItems={{ default: "alignItemsCenter" }}
        gap={{ default: "gapXs" }}
        aria-label={
          count
            ? `${label}: ${STATUS_LABEL[health.status]}, ${count}`
            : `${label}: ${STATUS_LABEL[health.status]}`
        }
      >
        <HealthIcon status={health.status} />
        <span className="ocs-endpoint-health__count">{count ?? STATUS_LABEL.unknown}</span>
      </Flex>
    </Tooltip>
  );
}

export function healthSortKey(health: EndpointHealth): number {
  switch (health.status) {
    case "down":
      return 0;
    case "degraded":
      return 1;
    case "unknown":
      return 2;
    case "healthy":
      return 3;
    default:
      return 4;
  }
}
