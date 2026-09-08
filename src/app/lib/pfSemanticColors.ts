/**
 * PatternFly 6 semantic color conventions for OpenShift prototypes.
 *
 * - Blue: generic information
 * - Green: good / healthy / success
 * - Orange: warning or notice
 * - Red: critical alert / failure
 * - Purple: informational (in-progress, tech preview, progressing)
 */

export type PfLabelColor = "green" | "blue" | "purple" | "orange" | "red" | "grey";

export type PfSemanticTone = "good" | "info" | "informational" | "warning" | "critical" | "neutral";

export const PF_CHART = {
  good: "var(--pf-t--global--color--status--success--default)",
  warning: "var(--pf-t--global--color--status--warning--default)",
  critical: "var(--pf-t--global--color--status--danger--default)",
  info: "var(--pf-t--global--color--nonstatus--blue--default)",
  informational: "var(--pf-t--global--color--nonstatus--purple--default)",
  neutral: "var(--pf-t--global--icon--status--on-disabled--default)",
} as const;

export const PF_LABEL: Record<PfSemanticTone, PfLabelColor> = {
  good: "green",
  info: "blue",
  informational: "purple",
  warning: "orange",
  critical: "red",
  neutral: "grey",
};

export function labelColorForTone(tone: PfSemanticTone): PfLabelColor {
  return PF_LABEL[tone];
}

export function toneForCount(
  count: number,
  { goodAt = 0, warningAbove = 0 }: { goodAt?: number; warningAbove?: number } = {}
): PfSemanticTone {
  if (count <= goodAt) return "good";
  if (count > warningAbove) return "critical";
  return "warning";
}

export function gitOpsHealthLabelColor(health: string): PfLabelColor {
  if (health === "Healthy") return PF_LABEL.good;
  if (health === "Progressing" || health === "Paused") return PF_LABEL.informational;
  if (health === "Degraded" || health === "Aborting") return PF_LABEL.critical;
  return PF_LABEL.info;
}

export function gitOpsSyncLabelColor(sync: string): PfLabelColor {
  if (sync === "Synced") return PF_LABEL.good;
  if (sync === "OutOfSync") return PF_LABEL.warning;
  return PF_LABEL.info;
}

export function gitOpsHealthChartColor(health: string): string {
  if (health === "Healthy") return PF_CHART.good;
  if (health === "Progressing" || health === "Paused") return PF_CHART.informational;
  if (health === "Degraded" || health === "Aborting") return PF_CHART.critical;
  return PF_CHART.info;
}

export function gitOpsSyncChartColor(sync: string): string {
  if (sync === "Synced") return PF_CHART.good;
  if (sync === "OutOfSync") return PF_CHART.warning;
  return PF_CHART.info;
}

export function promotionStageLabelColor(status: string): PfLabelColor {
  if (status === "succeeded") return PF_LABEL.good;
  if (status === "running") return PF_LABEL.info;
  if (status === "blocked") return PF_LABEL.warning;
  if (status === "failed") return PF_LABEL.critical;
  return PF_LABEL.neutral;
}

export function promotionStatusLabelColor(status: string): PfLabelColor {
  if (status === "Succeeded") return PF_LABEL.good;
  if (status === "Running") return PF_LABEL.info;
  if (status === "Blocked") return PF_LABEL.warning;
  return PF_LABEL.critical;
}

export function operationPhaseLabelColor(phase: string): PfLabelColor {
  if (phase === "Succeeded") return PF_LABEL.good;
  if (phase === "Failed") return PF_LABEL.critical;
  return PF_LABEL.info;
}

export function severityLabelColor(severity: string): PfLabelColor {
  if (severity === "danger") return PF_LABEL.critical;
  if (severity === "warning") return PF_LABEL.warning;
  if (severity === "informational") return PF_LABEL.informational;
  return PF_LABEL.info;
}

export function connectivityLabelColor(connected: number, total: number): PfLabelColor {
  if (total > 0 && connected === total) return PF_LABEL.good;
  if (connected === 0) return PF_LABEL.critical;
  return PF_LABEL.warning;
}
