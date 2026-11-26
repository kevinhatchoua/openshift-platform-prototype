import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Form, FormGroup, FormHelperText, FormSelect, FormSelectOption, TextInput } from "@patternfly/react-core";
import { ResourceCreatePageShell } from "../../components/prototype/ResourceCreatePageShell";
import { usePrototypeDemo } from "../../contexts/PrototypeDemoContext";
import { useToast } from "../../contexts/ToastContext";
import PrototypeGenericCreatePage from "../PrototypeGenericCreatePage";
import { DualModeCreateLayout } from "./DualModeCreateLayout";
import { NETWORKING_CRUMB } from "./networkingShared";
import {
  findNetworkPolicy,
  POLICY_TEMPLATES,
  policyDetailPath,
  saveNetworkPolicy,
  type NetworkPolicyRecord,
  type PolicyKind,
} from "./networkPolicyCatalog";
import { useSyncedFormYaml } from "./useSyncedFormYaml";
import type { ParseYamlResult, YamlSchemaField } from "./networkCreateYaml";

type PolicyFormState = {
  name: string;
  namespace: string;
  kind: PolicyKind;
  podSelector: string;
  matchExpression: string;
  policyTypes: string;
  nad: string;
  ingressPeer: string;
  ingressPorts: string;
  egressPeer: string;
  egressPorts: string;
  templateId: string;
};

const SCHEMA: YamlSchemaField[] = [
  { name: "metadata.name", type: "string", description: "Policy name." },
  { name: "metadata.namespace", type: "string", description: "Namespace." },
  { name: "spec.podSelector", type: "string", description: "Pods this policy selects." },
  { name: "spec.podSelector.matchExpressions", type: "string", description: "key operator values" },
  { name: "spec.policyTypes", type: "string", description: "Ingress, Egress, or both." },
];

function kindFromQuery(value: string | null): PolicyKind {
  return value === "multinetworkpolicy" ? "MultiNetworkPolicy" : "NetworkPolicy";
}

function expressionToString(policy: NetworkPolicyRecord): string {
  const first = policy.matchExpressions[0];
  return first ? `${first.key} ${first.operator} ${first.values}` : "";
}

function formFromPolicy(policy: NetworkPolicyRecord): PolicyFormState {
  const ingress = policy.rules.find((rule) => rule.direction === "Ingress");
  const egress = policy.rules.find((rule) => rule.direction === "Egress");
  return {
    name: policy.name,
    namespace: policy.namespace,
    kind: policy.kind,
    podSelector: policy.podSelector,
    matchExpression: expressionToString(policy),
    policyTypes: policy.policyTypes.join(","),
    nad: policy.nads[0] ? `${policy.nads[0].namespace}/${policy.nads[0].name}` : "",
    ingressPeer: ingress?.peer ?? "",
    ingressPorts: ingress?.ports ?? "",
    egressPeer: egress?.peer ?? "",
    egressPorts: egress?.ports ?? "",
    templateId: "",
  };
}

function blankForm(kind: PolicyKind): PolicyFormState {
  return {
    name: kind === "NetworkPolicy" ? "allow-example" : "secondary-allow",
    namespace: kind === "NetworkPolicy" ? "default" : "tenant-a",
    kind,
    podSelector: "app=example",
    matchExpression: "",
    policyTypes: "Ingress",
    nad: kind === "MultiNetworkPolicy" ? "tenant-a/localnet-secondary" : "",
    ingressPeer: "same namespace",
    ingressPorts: "TCP/8080",
    egressPeer: "",
    egressPorts: "",
    templateId: "",
  };
}

function parseExpression(value: string): NetworkPolicyRecord["matchExpressions"] {
  const parts = value.trim().split(/\s+/);
  if (parts.length < 3) return [];
  return [{ key: parts[0], operator: parts[1], values: parts.slice(2).join(" ") }];
}

function toRecord(state: PolicyFormState, existing?: NetworkPolicyRecord): NetworkPolicyRecord {
  const types = state.policyTypes
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is "Ingress" | "Egress" => item === "Ingress" || item === "Egress");
  const rules: NetworkPolicyRecord["rules"] = [];
  if (state.ingressPeer.trim()) {
    rules.push({
      direction: "Ingress",
      peer: state.ingressPeer.trim(),
      ports: state.ingressPorts.trim() || "all",
      effect: state.ingressPeer.trim() === "no peers" ? "Deny" : "Allow",
    });
  }
  if (state.egressPeer.trim()) {
    rules.push({
      direction: "Egress",
      peer: state.egressPeer.trim(),
      ports: state.egressPorts.trim() || "all",
      effect: "Allow",
    });
  }
  const nadParts = state.nad.split("/").map((part) => part.trim());
  const nads =
    state.kind === "MultiNetworkPolicy" && nadParts.length === 2 && nadParts[0] && nadParts[1]
      ? [{ namespace: nadParts[0], name: nadParts[1] }]
      : [];
  return {
    id: existing?.id ?? `${state.kind === "NetworkPolicy" ? "np" : "mnp"}:${state.namespace}:${state.name}`,
    name: state.name.trim(),
    namespace: state.namespace.trim() || "default",
    kind: state.kind,
    podSelector: state.podSelector.trim() || "all pods",
    matchExpressions: parseExpression(state.matchExpression),
    policyTypes: types.length > 0 ? types : ["Ingress"],
    affectedPods: existing?.affectedPods ?? 0,
    nads,
    conditions: existing?.conditions ?? [
      {
        type: "Accepted",
        status: "True",
        reason: "Prototype",
        message: "Saved in this prototype session. The cluster has not applied it.",
      },
    ],
    rules,
    trafficMbps: existing?.trafficMbps ?? 0,
    source: existing?.source ?? "Manual",
    chain: existing?.chain ?? (nads[0] ? [`NAD ${nads[0].name}`] : []),
    mismatch: existing?.mismatch,
  };
}

function formToYaml(state: PolicyFormState): string {
  const record = toRecord(state);
  const apiVersion = record.kind === "NetworkPolicy" ? "networking.k8s.io/v1" : "k8s.ovn.org/v1";
  return `apiVersion: ${apiVersion}
kind: ${record.kind}
metadata:
  name: ${record.name}
  namespace: ${record.namespace}
spec:
  podSelector: ${record.podSelector}
  matchExpressions: ${state.matchExpression || "none"}
  policyTypes: [${record.policyTypes.join(", ")}]
  nad: ${state.nad || "primary"}
  ingress: ${state.ingressPeer || "none"} ${state.ingressPorts}
  egress: ${state.egressPeer || "none"} ${state.egressPorts}`;
}

function yamlToForm(yaml: string): ParseYamlResult<PolicyFormState> {
  if (!yaml.trim()) return { partial: null, error: "YAML cannot be empty.", hasUnmappedContent: false };
  const name = yaml.match(/^\s*name:\s*(.+)$/m)?.[1]?.trim() ?? "";
  const namespace = yaml.match(/^\s*namespace:\s*(.+)$/m)?.[1]?.trim() ?? "default";
  const kind = yaml.includes("MultiNetworkPolicy") ? "MultiNetworkPolicy" : "NetworkPolicy";
  return {
    partial: { name, namespace, kind },
    error: null,
    hasUnmappedContent: true,
  };
}

export default function NetworkPolicyFormPage() {
  const { networkingRelease } = usePrototypeDemo();
  const { namespace, name } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const isEdit = Boolean(namespace && name);
  const existing = isEdit
    ? findNetworkPolicy(decodeURIComponent(namespace ?? ""), decodeURIComponent(name ?? ""))
    : undefined;

  if (networkingRelease !== "5.2" && !isEdit) {
    return <PrototypeGenericCreatePage forcedKind="NetworkPolicy" />;
  }

  return (
    <PolicyForm
      key={existing?.id ?? searchParams.get("kind") ?? "create"}
      existing={existing}
      initialKind={kindFromQuery(searchParams.get("kind"))}
      onSave={(policy, mode) => {
        saveNetworkPolicy(policy);
        pushToast({
          variant: "success",
          title: mode === "edit" ? `Updated ${policy.name}.` : `Created ${policy.kind} ${policy.name}.`,
        });
        navigate(policyDetailPath(policy));
      }}
    />
  );
}

function PolicyForm({
  existing,
  initialKind,
  onSave,
}: {
  existing?: NetworkPolicyRecord;
  initialKind: PolicyKind;
  onSave: (policy: NetworkPolicyRecord, mode: "edit" | "create") => void;
}) {
  const initialState = useMemo(
    () => (existing ? formFromPolicy(existing) : blankForm(initialKind)),
    [existing, initialKind]
  );
  const sync = useSyncedFormYaml(
    {
      toYaml: formToYaml,
      fromYaml: yamlToForm,
      schemaTitle: initialState.kind,
      schemaFields: SCHEMA,
    },
    initialState
  );
  const state = sync.formState;
  const title = existing ? `Edit ${existing.kind}` : `Create ${state.kind}`;

  const applyTemplate = (templateId: string) => {
    const template = POLICY_TEMPLATES.find((item) => item.id === templateId);
    if (!template) {
      sync.patchFormState({ templateId });
      return;
    }
    const next = formFromPolicy({ ...template.policy, id: "template" });
    sync.patchFormState({ ...next, templateId });
  };

  return (
    <ResourceCreatePageShell
      breadcrumbs={[
        { label: "Home", path: "/" },
        NETWORKING_CRUMB,
        { label: "NetworkPolicies", path: "/networking/networkpolicies" },
        { label: title },
      ]}
      title={title}
      description="The same form edits an existing policy or creates one from a template. YAML stays available for fields the form does not map."
      listPath="/networking/networkpolicies"
      canCreate={sync.canSubmit && state.name.trim().length > 0}
      submitLabel={existing ? "Save" : "Create"}
      onCreate={() => onSave(toRecord(state, existing), existing ? "edit" : "create")}
    >
      <Form>
        <DualModeCreateLayout
          viewMode={sync.viewMode}
          onViewModeChange={sync.setViewMode}
          yamlText={sync.yamlText}
          onYamlChange={sync.handleYamlChange}
          yamlError={sync.yamlError}
          hasUnmappedContent={sync.hasUnmappedContent}
          schemaTitle={sync.schemaTitle}
          schemaFields={sync.schemaFields}
        >
          {!existing ? (
            <FormGroup label="Template" fieldId="policy-template">
              <FormSelect
                id="policy-template"
                value={state.templateId}
                onChange={(_event, value) => applyTemplate(value)}
              >
                <FormSelectOption label="Start from scratch" value="" />
                {POLICY_TEMPLATES.map((template) => (
                  <FormSelectOption key={template.id} label={template.label} value={template.id} />
                ))}
              </FormSelect>
            </FormGroup>
          ) : null}
          <FormGroup label="Kind" fieldId="policy-kind" isRequired>
            <FormSelect
              id="policy-kind"
              value={state.kind}
              onChange={(_event, value) => sync.patchFormState({ kind: value as PolicyKind })}
            >
              <FormSelectOption label="NetworkPolicy" value="NetworkPolicy" />
              <FormSelectOption label="MultiNetworkPolicy" value="MultiNetworkPolicy" />
            </FormSelect>
          </FormGroup>
          <FormGroup label="Name" isRequired fieldId="policy-name">
            <TextInput
              id="policy-name"
              value={state.name}
              onChange={(_event, value) => sync.patchFormState({ name: value })}
            />
          </FormGroup>
          <FormGroup label="Namespace" isRequired fieldId="policy-namespace">
            <TextInput
              id="policy-namespace"
              value={state.namespace}
              onChange={(_event, value) => sync.patchFormState({ namespace: value })}
            />
          </FormGroup>
          <FormGroup label="Pod selector" fieldId="policy-selector">
            <TextInput
              id="policy-selector"
              value={state.podSelector}
              onChange={(_event, value) => sync.patchFormState({ podSelector: value })}
            />
          </FormGroup>
          <FormGroup label="matchExpressions" fieldId="policy-expression">
            <TextInput
              id="policy-expression"
              value={state.matchExpression}
              onChange={(_event, value) => sync.patchFormState({ matchExpression: value })}
            />
            <FormHelperText>Format: key operator values. Example: tier In web</FormHelperText>
          </FormGroup>
          <FormGroup label="Policy types" fieldId="policy-types">
            <TextInput
              id="policy-types"
              value={state.policyTypes}
              onChange={(_event, value) => sync.patchFormState({ policyTypes: value })}
            />
            <FormHelperText>Ingress, Egress, or Ingress,Egress</FormHelperText>
          </FormGroup>
          {state.kind === "MultiNetworkPolicy" ? (
            <FormGroup label="Target NAD" fieldId="policy-nad">
              <TextInput
                id="policy-nad"
                value={state.nad}
                onChange={(_event, value) => sync.patchFormState({ nad: value })}
              />
              <FormHelperText>namespace/name</FormHelperText>
            </FormGroup>
          ) : null}
          <FormGroup label="Ingress peer" fieldId="policy-ingress-peer">
            <TextInput
              id="policy-ingress-peer"
              value={state.ingressPeer}
              onChange={(_event, value) => sync.patchFormState({ ingressPeer: value })}
            />
          </FormGroup>
          <FormGroup label="Ingress ports" fieldId="policy-ingress-ports">
            <TextInput
              id="policy-ingress-ports"
              value={state.ingressPorts}
              onChange={(_event, value) => sync.patchFormState({ ingressPorts: value })}
            />
          </FormGroup>
          <FormGroup label="Egress peer" fieldId="policy-egress-peer">
            <TextInput
              id="policy-egress-peer"
              value={state.egressPeer}
              onChange={(_event, value) => sync.patchFormState({ egressPeer: value })}
            />
          </FormGroup>
          <FormGroup label="Egress ports" fieldId="policy-egress-ports">
            <TextInput
              id="policy-egress-ports"
              value={state.egressPorts}
              onChange={(_event, value) => sync.patchFormState({ egressPorts: value })}
            />
          </FormGroup>
        </DualModeCreateLayout>
      </Form>
    </ResourceCreatePageShell>
  );
}
