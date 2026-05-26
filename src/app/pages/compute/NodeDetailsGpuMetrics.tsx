import {
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Title,
} from "@patternfly/react-core";
import type { NodeGpuMetrics } from "./nodeGpuMetricsData";

type NodeDetailsGpuMetricsProps = {
  metrics: NodeGpuMetrics;
};

export default function NodeDetailsGpuMetrics({ metrics }: NodeDetailsGpuMetricsProps) {
  const hasLeftSummary = Boolean(metrics.count || metrics.model);
  const hasRightSummary = Boolean(metrics.capacity || metrics.allocatable);

  return (
    <section className="ocs-node-details__panel app-glass-panel" aria-label="GPU metrics">
      <Title headingLevel="h2" size="xl" className="ocs-node-gpu-metrics__title">
        GPU metrics
      </Title>

      {(hasLeftSummary || hasRightSummary) && (
        <div className="ocs-node-details__columns ocs-node-gpu-metrics__summary">
          {hasLeftSummary && (
            <div className="ocs-node-details__column">
              <DescriptionList isHorizontal isCompact className="ocs-node-details__dl" aria-label="GPU summary">
                {metrics.count && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>GPU count</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Content component="small">{metrics.count}</Content>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
                {metrics.model && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>GPU model</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Content component="small">{metrics.model}</Content>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </DescriptionList>
            </div>
          )}
          {hasRightSummary && (
            <div className="ocs-node-details__column">
              <DescriptionList isHorizontal isCompact className="ocs-node-details__dl" aria-label="GPU capacity summary">
                {metrics.capacity && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>GPU capacity</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Content component="small">{metrics.capacity}</Content>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
                {metrics.allocatable && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>GPU allocatable</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Content component="small">{metrics.allocatable}</Content>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </DescriptionList>
            </div>
          )}
        </div>
      )}

      {metrics.devices.length > 0 && (
        <div className="ocs-nodes-list__table-wrap ocs-node-gpu-metrics__table-wrap">
          <table className="ocs-nodes-list__table" aria-label="GPU metrics per device">
            <thead>
              <tr>
                <th scope="col">GPU device</th>
                <th scope="col">Utilization</th>
                <th scope="col">Temperature</th>
                <th scope="col">Power usage</th>
                <th scope="col">FB memory used</th>
                <th scope="col">FB memory free</th>
              </tr>
            </thead>
            <tbody>
              {metrics.devices.map((device) => (
                <tr key={device.id}>
                  <td>
                    <Content component="small">{device.label}</Content>
                  </td>
                  <td>
                    <Content component="small">{device.utilization}</Content>
                  </td>
                  <td>
                    <Content component="small">{device.temperature}</Content>
                  </td>
                  <td>
                    <Content component="small">{device.power}</Content>
                  </td>
                  <td>
                    <Content component="small">{device.fbUsed}</Content>
                  </td>
                  <td>
                    <Content component="small">{device.fbFree}</Content>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
