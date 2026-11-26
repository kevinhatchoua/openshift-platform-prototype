import { Link, useNavigate, useParams } from "react-router";
import {
  Alert,
  Button,
  Content,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
} from "@patternfly/react-core";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { OcsPrototypeListTable } from "../../components/dataView/OcsPrototypeListTable";
import { useToast } from "../../contexts/ToastContext";
import NetworkResourceDetailShell, { DetailMetadataSection } from "./NetworkResourceDetailShell";
import { MetadataGrid, NamespaceValue, YamlPanel } from "./networkingDetailFields";
import {
  cloneNetworkPolicy,
  findNetworkPolicy,
  policyDetailPath,
  policyEditPath,
  policyYaml,
  useNetworkPolicies,
} from "./networkPolicyCatalog";

export default function NetworkPolicyDetailPage() {
  const { namespace = "default", name = "" } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const decodedNs = decodeURIComponent(namespace);
  const decodedName = decodeURIComponent(name);
  useNetworkPolicies();
  const policy = findNetworkPolicy(decodedNs, decodedName);

  if (!policy) {
    return (
      <div className="ocs-app-page-outer">
        <Content component="p">No policy named {decodedName} in {decodedNs}.</Content>
        <Link to="/networking/networkpolicies">Back to NetworkPolicies</Link>
      </div>
    );
  }

  const detailPath = policyDetailPath(policy);

  return (
    <NetworkResourceDetailShell
      kindAbbr={policy.kind === "NetworkPolicy" ? "NP" : "MNP"}
      kindLabel={policy.kind}
      listTitle="NetworkPolicies"
      listPath="/networking/networkpolicies"
      detailCrumbLabel={`${policy.kind} details`}
      name={policy.name}
      detailPath={detailPath}
      headerExtra={
        <>
          <Link className="pf-v6-c-button pf-m-primary" to={policyEditPath(policy)}>
            Edit policy
          </Link>
          <Button
            variant="secondary"
            onClick={() => {
              const clone = cloneNetworkPolicy(policy);
              pushToast({ variant: "success", title: `Cloned ${policy.name} as ${clone.name}.` });
              navigate(policyDetailPath(clone));
            }}
          >
            Clone
          </Button>
        </>
      }
      tabs={[
        {
          eventKey: "details",
          title: "Details",
          content: (
            <>
              {policy.mismatch ? (
                <Alert variant="danger" isInline title={policy.mismatch.title} className="pf-v6-u-mb-md">
                  <Content component="p">
                    {policy.mismatch.object} ({policy.mismatch.layer}). Expected {policy.mismatch.expected}. Actual{" "}
                    {policy.mismatch.actual}.
                  </Content>
                </Alert>
              ) : null}
              <DetailMetadataSection title={`${policy.kind} details`}>
                <MetadataGrid
                  left={
                    <>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Name</DescriptionListTerm>
                        <DescriptionListDescription>{policy.name}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Namespace</DescriptionListTerm>
                        <DescriptionListDescription>
                          <NamespaceValue namespace={policy.namespace} />
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Pod selector</DescriptionListTerm>
                        <DescriptionListDescription>{policy.podSelector}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>matchExpressions</DescriptionListTerm>
                        <DescriptionListDescription>
                          {policy.matchExpressions.length === 0
                            ? "None"
                            : policy.matchExpressions
                                .map((expression) => `${expression.key} ${expression.operator} ${expression.values}`)
                                .join("; ")}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Affected pods</DescriptionListTerm>
                        <DescriptionListDescription>{policy.affectedPods}</DescriptionListDescription>
                      </DescriptionListGroup>
                    </>
                  }
                  right={
                    <>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Source</DescriptionListTerm>
                        <DescriptionListDescription>
                          <Label color={policy.source === "NSX-T migration" ? "blue" : "grey"} isCompact>
                            {policy.source}
                          </Label>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Policy types</DescriptionListTerm>
                        <DescriptionListDescription>{policy.policyTypes.join(", ")}</DescriptionListDescription>
                      </DescriptionListGroup>
                      {policy.kind === "MultiNetworkPolicy" ? (
                        <DescriptionListGroup>
                          <DescriptionListTerm>Target networks</DescriptionListTerm>
                          <DescriptionListDescription>
                            {policy.nads.length === 0
                              ? "No NAD annotation"
                              : policy.nads.map((nad) => (
                                  <div key={`${nad.namespace}/${nad.name}`}>
                                    <Link
                                      to={`/networking/networkattachmentdefinitions/${encodeURIComponent(nad.namespace)}/${encodeURIComponent(nad.name)}`}
                                    >
                                      {nad.namespace}/{nad.name}
                                    </Link>
                                  </div>
                                ))}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      ) : (
                        <DescriptionListGroup>
                          <DescriptionListTerm>Network</DescriptionListTerm>
                          <DescriptionListDescription>Primary cluster network</DescriptionListDescription>
                        </DescriptionListGroup>
                      )}
                    </>
                  }
                />
              </DetailMetadataSection>
              <DetailMetadataSection title="Rules">
                <Content component="p" className="pf-v6-u-mb-md pf-v6-u-color-200">
                  Ingress and egress use the same table. An empty peer list on an ingress policy denies traffic that
                  no later rule allows.
                </Content>
                <OcsPrototypeListTable ariaLabel="Policy rules">
                  <Thead>
                    <Tr>
                      <Th>Direction</Th>
                      <Th>Peer</Th>
                      <Th>Ports</Th>
                      <Th>Effect</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {policy.rules.map((rule) => (
                      <Tr key={`${rule.direction}-${rule.peer}-${rule.ports}`}>
                        <Td dataLabel="Direction">{rule.direction}</Td>
                        <Td dataLabel="Peer">{rule.peer}</Td>
                        <Td dataLabel="Ports">{rule.ports}</Td>
                        <Td dataLabel="Effect">
                          <Label color={rule.effect === "Allow" ? "green" : "red"} isCompact>
                            {rule.effect}
                          </Label>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </OcsPrototypeListTable>
              </DetailMetadataSection>
              <DetailMetadataSection title="Conditions">
                {policy.conditions.length === 0 ? (
                  <Content component="p">No status conditions yet.</Content>
                ) : (
                  <OcsPrototypeListTable ariaLabel="Policy conditions">
                    <Thead>
                      <Tr>
                        <Th>Type</Th>
                        <Th>Status</Th>
                        <Th>Reason</Th>
                        <Th>Message</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {policy.conditions.map((condition) => (
                        <Tr key={condition.type}>
                          <Td dataLabel="Type">{condition.type}</Td>
                          <Td dataLabel="Status">{condition.status}</Td>
                          <Td dataLabel="Reason">{condition.reason}</Td>
                          <Td dataLabel="Message">{condition.message}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </OcsPrototypeListTable>
                )}
              </DetailMetadataSection>
              <DetailMetadataSection title="Path">
                <Content component="p">
                  {policy.chain.length > 0
                    ? policy.chain.join(" → ")
                    : "This policy is not placed on a network configuration path yet."}
                </Content>
              </DetailMetadataSection>
            </>
          ),
        },
        { eventKey: "yaml", title: "YAML", content: <YamlPanel yaml={policyYaml(policy)} /> },
      ]}
    />
  );
}
