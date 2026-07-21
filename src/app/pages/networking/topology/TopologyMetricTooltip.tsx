import { Content, DescriptionList, DescriptionListDescription, DescriptionListGroup, DescriptionListTerm } from "@patternfly/react-core";
import type { TopologyMetricSnapshot } from "./topologyMetricsService";

type TopologyMetricTooltipProps = {
  metrics: TopologyMetricSnapshot;
  x: number;
  y: number;
};

export function TopologyMetricTooltip({ metrics, x, y }: TopologyMetricTooltipProps) {
  return (
    <div
      className="ocs-topology-metric-tooltip"
      style={{ left: x, top: y }}
      role="tooltip"
      aria-live="polite"
    >
      <Content component="p" className="ocs-topology-metric-tooltip__title">
        {metrics.label}
      </Content>
      <DescriptionList isCompact className="ocs-topology-metric-tooltip__list">
        <DescriptionListGroup>
          <DescriptionListTerm>CPU</DescriptionListTerm>
          <DescriptionListDescription>{metrics.cpuPercent}%</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Memory</DescriptionListTerm>
          <DescriptionListDescription>{metrics.memoryPercent}%</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>IOPS</DescriptionListTerm>
          <DescriptionListDescription>{metrics.iops.toLocaleString()}</DescriptionListDescription>
        </DescriptionListGroup>
        {metrics.storageUtilPercent != null ? (
          <DescriptionListGroup>
            <DescriptionListTerm>Storage</DescriptionListTerm>
            <DescriptionListDescription>{metrics.storageUtilPercent}% utilized</DescriptionListDescription>
          </DescriptionListGroup>
        ) : null}
        {metrics.atCapacity ? (
          <DescriptionListGroup>
            <DescriptionListTerm>Capacity</DescriptionListTerm>
            <DescriptionListDescription>At 100% — consider provisioning</DescriptionListDescription>
          </DescriptionListGroup>
        ) : null}
        {metrics.macAddress ? (
          <DescriptionListGroup>
            <DescriptionListTerm>MAC</DescriptionListTerm>
            <DescriptionListDescription>{metrics.macAddress}</DescriptionListDescription>
          </DescriptionListGroup>
        ) : null}
        {metrics.rxMbps != null ? (
          <DescriptionListGroup>
            <DescriptionListTerm>Throughput</DescriptionListTerm>
            <DescriptionListDescription>
              ↓ {metrics.rxMbps} Mbps · ↑ {metrics.txMbps} Mbps
            </DescriptionListDescription>
          </DescriptionListGroup>
        ) : null}
      </DescriptionList>
      <Content component="small" className="ocs-topology-metric-tooltip__source">
        {metrics.source === "mock" ? "Developer mock metrics" : "Live cluster metrics"}
      </Content>
    </div>
  );
}
