import { Content, Title } from "@patternfly/react-core";
import { InnerScrollContainer, Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import {
  OCS_PROTOTYPE_TABLE_CLASS,
  PlainTableHeader,
} from "../../components/dataView/OcsPrototypeListTable";
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

      <div className="ocs-node-conditions__table-wrap">
        <InnerScrollContainer>
          <Table aria-label="Node conditions" borders variant="compact" className={OCS_PROTOTYPE_TABLE_CLASS}>
            <Thead>
              <Tr>
                <Th dataLabel="Type">
                  <PlainTableHeader label="Type" />
                </Th>
                <Th dataLabel="Status">
                  <PlainTableHeader label="Status" />
                </Th>
                <Th dataLabel="Reason">
                  <PlainTableHeader label="Reason" />
                </Th>
                <Th dataLabel="Updated">
                  <PlainTableHeader label="Updated" />
                </Th>
                <Th dataLabel="Changed">
                  <PlainTableHeader label="Changed" />
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {conditions.map((condition) => (
                <Tr key={condition.type}>
                  <Td dataLabel="Type">
                    <Content component="small">{condition.type}</Content>
                  </Td>
                  <Td dataLabel="Status">
                    <Content component="small">{condition.status}</Content>
                  </Td>
                  <Td dataLabel="Reason">
                    <Content component="small">{condition.reason}</Content>
                  </Td>
                  <Td dataLabel="Updated">
                    <Content component="small">{condition.updated}</Content>
                  </Td>
                  <Td dataLabel="Changed">
                    <Content component="small">{condition.changed}</Content>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </InnerScrollContainer>
      </div>
    </section>
  );
}
