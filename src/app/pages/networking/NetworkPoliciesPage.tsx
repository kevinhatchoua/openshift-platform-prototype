import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  Label,
  MenuToggle,
  Tab,
  Tabs,
  TabTitleText,
} from "@patternfly/react-core";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import { Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { Link } from "react-router";
import { OcsPrototypeListTable } from "../../components/dataView/OcsPrototypeListTable";
import { usePrototypeDemo } from "../../contexts/PrototypeDemoContext";
import { useToast } from "../../contexts/ToastContext";
import {
  cloneNetworkPolicy,
  deleteNetworkPolicy,
  policyDetailPath,
  policyEditPath,
  useNetworkPolicies,
  type NetworkPolicyRecord,
  type PolicyKind,
} from "./networkPolicyCatalog";
import { NetworkingEmptyState, NetworkingPageShell } from "./networkingShared";

function PolicyActions({ policy }: { policy: NetworkPolicyRecord }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pushToast } = useToast();

  return (
    <Dropdown
      isOpen={open}
      onOpenChange={setOpen}
      onSelect={() => setOpen(false)}
      popperProps={{ position: "right" }}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          variant="plain"
          aria-label={`Actions for ${policy.name}`}
          onClick={() => setOpen((current) => !current)}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem itemId="edit" onClick={() => navigate(policyEditPath(policy))}>
          Edit policy
        </DropdownItem>
        <DropdownItem
          itemId="clone"
          onClick={() => {
            const clone = cloneNetworkPolicy(policy);
            pushToast({ variant: "success", title: `Cloned ${policy.name} as ${clone.name}.` });
            navigate(policyDetailPath(clone));
          }}
        >
          Clone
        </DropdownItem>
        <DropdownItem
          itemId="delete"
          isDanger
          onClick={() => {
            deleteNetworkPolicy(policy.id);
            pushToast({ variant: "info", title: `Deleted ${policy.name} from this prototype session.` });
          }}
        >
          Delete
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
}

function PolicyTable({ policies }: { policies: NetworkPolicyRecord[] }) {
  if (policies.length === 0) {
    return (
      <Content component="p" className="pf-v6-u-color-200">
        No policies on this tab. Create one or switch tabs.
      </Content>
    );
  }

  return (
    <OcsPrototypeListTable ariaLabel="Network policies">
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Namespace</Th>
          <Th>Pod selector</Th>
          <Th>Policy types</Th>
          <Th>Affected pods</Th>
          <Th>Networks</Th>
          <Th>Source</Th>
          <Th aria-label="Actions" />
        </Tr>
      </Thead>
      <Tbody>
        {policies.map((policy) => (
          <Tr key={policy.id}>
            <Td dataLabel="Name">
              <Link to={policyDetailPath(policy)}>{policy.name}</Link>
              {policy.mismatch ? (
                <Label color="red" isCompact className="pf-v6-u-ml-sm">
                  Needs attention
                </Label>
              ) : null}
            </Td>
            <Td dataLabel="Namespace">{policy.namespace}</Td>
            <Td dataLabel="Pod selector">{policy.podSelector}</Td>
            <Td dataLabel="Policy types">{policy.policyTypes.join(", ")}</Td>
            <Td dataLabel="Affected pods">{policy.affectedPods}</Td>
            <Td dataLabel="Networks">
              {policy.nads.length > 0 ? policy.nads.map((nad) => nad.name).join(", ") : "Primary"}
            </Td>
            <Td dataLabel="Source">{policy.source}</Td>
            <Td isActionCell>
              <PolicyActions policy={policy} />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </OcsPrototypeListTable>
  );
}

export default function NetworkPoliciesPage() {
  const { networkingRelease } = usePrototypeDemo();
  const policies = useNetworkPolicies();
  const [activeTab, setActiveTab] = useState<PolicyKind>("NetworkPolicy");
  const visible = useMemo(
    () => policies.filter((policy) => policy.kind === activeTab),
    [policies, activeTab]
  );
  const createKind = activeTab === "MultiNetworkPolicy" ? "multinetworkpolicy" : "networkpolicy";

  if (networkingRelease !== "5.2") {
    return (
      <NetworkingPageShell
        title="NetworkPolicies"
        path="/networking/networkpolicies"
        createLabel="Create NetworkPolicy"
        createTo="/networking/networkpolicies/create"
        extraHeader={
          <Tabs activeKey="networkpolicies" aria-label="Network policy types">
            <Tab eventKey="networkpolicies" title={<TabTitleText>NetworkPolicies</TabTitleText>} />
            <Tab eventKey="multinetworkpolicies" title={<TabTitleText>MultiNetworkPolicies</TabTitleText>} />
          </Tabs>
        }
      >
        <NetworkingEmptyState
          title="No NetworkPolicy found"
          description="Click Create NetworkPolicy to create your first NetworkPolicy"
          createLabel="Create NetworkPolicy"
          learnMoreHref="https://docs.openshift.com/container-platform/latest/networking/network_policy/about-network-policy.html"
          learnMoreLabel="Learn more about NetworkPolicy"
        />
      </NetworkingPageShell>
    );
  }

  return (
    <NetworkingPageShell
      title="NetworkPolicies"
      path="/networking/networkpolicies"
      createLabel={activeTab === "NetworkPolicy" ? "Create NetworkPolicy" : "Create MultiNetworkPolicy"}
      createTo={`/networking/networkpolicies/create?kind=${createKind}`}
      extraHeader={
        <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
          <Content component="p" className="pf-v6-u-color-200">
            Manage primary-network policies and secondary-network policies in one place. MultiNetworkPolicies
            translated from NSX-T stay editable after migration.
          </Content>
          <Tabs
            activeKey={activeTab}
            onSelect={(_event, key) => setActiveTab(key as PolicyKind)}
            aria-label="Network policy types"
          >
            <Tab eventKey="NetworkPolicy" title={<TabTitleText>NetworkPolicies</TabTitleText>} />
            <Tab eventKey="MultiNetworkPolicy" title={<TabTitleText>MultiNetworkPolicies</TabTitleText>} />
          </Tabs>
        </Flex>
      }
    >
      <PolicyTable policies={visible} />
    </NetworkingPageShell>
  );
}
