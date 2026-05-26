import { Content, Title } from "@patternfly/react-core";
import type { NodeCondition } from "./nodeConditionsData";

type NodeDetailsConditionsProps = {
  conditions: NodeCondition[];
};

export default function NodeDetailsConditions({ conditions }: NodeDetailsConditionsProps) {
  return (
    <section className="ocs-node-details__panel app-glass-panel" aria-label="Node conditions">
      <Title headingLevel="h2" size="xl" className="ocs-node-conditions__title">
        Node conditions
      </Title>

      <div className="ocs-nodes-list__table-wrap ocs-node-conditions__table-wrap">
        <table className="ocs-nodes-list__table" aria-label="Node conditions">
          <thead>
            <tr>
              <th scope="col">Type</th>
              <th scope="col">Status</th>
              <th scope="col">Reason</th>
              <th scope="col">Updated</th>
              <th scope="col">Changed</th>
            </tr>
          </thead>
          <tbody>
            {conditions.map((condition) => (
              <tr key={condition.type}>
                <td>
                  <Content component="small">{condition.type}</Content>
                </td>
                <td>
                  <Content component="small">{condition.status}</Content>
                </td>
                <td>
                  <Content component="small">{condition.reason}</Content>
                </td>
                <td>
                  <Content component="small">{condition.updated}</Content>
                </td>
                <td>
                  <Content component="small">{condition.changed}</Content>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
