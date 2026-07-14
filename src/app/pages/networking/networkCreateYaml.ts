import { PROTOTYPE_NS } from "./networkingMockData";

export type YamlSchemaField = {
  name: string;
  type: string;
  description: string;
};

export type NadFormState = { name: string; namespace: string; type: string };
export type UdnFormState = { project: string; name: string; cidr: string };
export type CudnFormState = { name: string; cidr: string; matchLabels: string };
export type NncpFormState = { name: string };
/** Ports as one entry per line: `port:targetPort/PROTOCOL` (e.g. `80:9376/TCP`). */
export type ServiceFormState = {
  name: string;
  namespace: string;
  type: string;
  selector: string;
  ports: string;
};

export type ParseYamlResult<T> = {
  partial: Partial<T> | null;
  error: string | null;
  hasUnmappedContent: boolean;
};

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, "").trim();
}

function yamlStructureError(yaml: string): string | null {
  const text = yaml.trim();
  if (!text) return "YAML cannot be empty.";
  if (!/^apiVersion:/m.test(text)) return "Missing apiVersion field.";
  if (!/^kind:/m.test(text)) return "Missing kind field.";
  return null;
}

function readScalar(yaml: string, key: string): string | undefined {
  const match = yaml.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, "m"));
  return match ? stripQuotes(match[1]) : undefined;
}

function readMetadataField(yaml: string, key: string): string | undefined {
  const metadata = yaml.match(/^metadata:\s*\n([\s\S]*?)(?=^\S|\s*$)/m)?.[1] ?? "";
  return readScalar(metadata, key);
}

function readSpecScalar(yaml: string, key: string): string | undefined {
  const spec = yaml.match(/^spec:\s*\n([\s\S]*?)(?=^\S|\s*$)/m)?.[1] ?? "";
  return readScalar(spec, key);
}

function matchLabelsFromYaml(yaml: string): string | undefined {
  const block =
    yaml.match(/matchLabels:\s*\n((?:\s+.+\n?)+)/)?.[1] ??
    yaml.match(/matchLabels:\s*\{([^}]+)\}/)?.[1];
  if (!block) return undefined;
  const pairs: string[] = [];
  block.split("\n").forEach((line) => {
    const match = line.match(/^\s*([^:]+):\s*(.+)$/);
    if (match) pairs.push(`${match[1].trim()}=${stripQuotes(match[2])}`);
  });
  if (pairs.length === 0 && block.includes("=")) return block.trim();
  return pairs.length > 0 ? pairs.join("\n") : undefined;
}

function matchLabelsToYaml(text: string): string {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return "    {}";
  const rows = lines.map((line) => {
    const [key, ...rest] = line.split("=");
    return `      ${key.trim()}: ${rest.join("=").trim()}`;
  });
  return `    matchLabels:\n${rows.join("\n")}`;
}

function parseResult<T>(yaml: string, partial: Partial<T>, hasUnmappedContent = false): ParseYamlResult<T> {
  const error = yamlStructureError(yaml);
  if (error) return { partial: null, error, hasUnmappedContent: false };
  return { partial, error: null, hasUnmappedContent };
}

export function nadFormToYaml(state: NadFormState): string {
  const cniType = (state.type ?? "").toLowerCase().includes("bridge") ? "bridge" : "overlay";
  return `apiVersion: k8s.cni.cncf.io/v1
kind: NetworkAttachmentDefinition
metadata:
  name: ${state.name}
  namespace: ${state.namespace}
spec:
  config: |
    {
      "cniVersion": "0.3.1",
      "type": "${cniType}",
      "bridge": "${state.name}"
    }`;
}

export function nadYamlToForm(yaml: string): ParseYamlResult<NadFormState> {
  const partial: Partial<NadFormState> = {
    name: readMetadataField(yaml, "name"),
    namespace: readMetadataField(yaml, "namespace"),
    type: /"type":\s*"bridge"/.test(yaml) || /linux-bridge/i.test(yaml) ? "Linux bridge" : "Linux bridge",
  };
  return parseResult(yaml, partial, /desiredState:|nodeSelector:/m.test(yaml));
}

export const NAD_YAML_SCHEMA: YamlSchemaField[] = [
  { name: "apiVersion", type: "string", description: "API version for NetworkAttachmentDefinition resources." },
  { name: "kind", type: "string", description: "Must be NetworkAttachmentDefinition." },
  { name: "metadata.name", type: "string", description: "Unique name of the NAD within the namespace." },
  { name: "metadata.namespace", type: "string", description: "Target namespace for the attachment definition." },
  { name: "spec.config", type: "string", description: "CNI plugin JSON configuration (bridge, macvlan, etc.)." },
];

export function udnFormToYaml(state: UdnFormState): string {
  return `apiVersion: k8s.ovn.org/v1
kind: UserDefinedNetwork
metadata:
  name: ${state.name}
  namespace: ${state.project}
spec:
  topology: Layer3
  subnet: ${state.cidr}`;
}

export function udnYamlToForm(yaml: string): ParseYamlResult<UdnFormState> {
  return parseResult(
    yaml,
    {
      name: readMetadataField(yaml, "name"),
      project: readMetadataField(yaml, "namespace") ?? PROTOTYPE_NS,
      cidr: readSpecScalar(yaml, "subnet") ?? readSpecScalar(yaml, "cidr") ?? "10.128.0.0/24",
    },
    /joinSubnet:|role:/m.test(yaml)
  );
}

export const UDN_YAML_SCHEMA: YamlSchemaField[] = [
  { name: "metadata.name", type: "string", description: "UserDefinedNetwork resource name." },
  { name: "metadata.namespace", type: "string", description: "Project namespace for the network." },
  { name: "spec.subnet", type: "string", description: "IPv4/IPv6 CIDR for the network (e.g. 10.128.0.0/24)." },
  { name: "spec.topology", type: "string", description: "Layer2 or Layer3 network topology." },
];

export function cudnFormToYaml(state: CudnFormState): string {
  return `apiVersion: k8s.ovn.org/v1
kind: ClusterUserDefinedNetwork
metadata:
  name: ${state.name}
spec:
  topology: Layer2
  subnet: ${state.cidr}
  namespaceSelector:
${matchLabelsToYaml(state.matchLabels)}`;
}

export function cudnYamlToForm(yaml: string): ParseYamlResult<CudnFormState> {
  return parseResult(
    yaml,
    {
      name: readMetadataField(yaml, "name"),
      cidr: readSpecScalar(yaml, "subnet") ?? "10.132.0.0/16",
      matchLabels: matchLabelsFromYaml(yaml) ?? "app=frontend",
    },
    /physicalNetworkName:/m.test(yaml)
  );
}

export const CUDN_YAML_SCHEMA: YamlSchemaField[] = [
  { name: "metadata.name", type: "string", description: "Cluster-scoped network name." },
  { name: "spec.subnet", type: "string", description: "Cluster subnet CIDR." },
  { name: "spec.namespaceSelector.matchLabels", type: "object", description: "Namespaces that receive this network." },
];

export function nncpFormToYaml(state: NncpFormState): string {
  return `apiVersion: nmstate.io/v1
kind: NodeNetworkConfigurationPolicy
metadata:
  name: ${state.name}
spec:
  nodeSelector:
    node-role.kubernetes.io/worker: ""
  desiredState:
    interfaces:
      - name: br-localnet
        type: linux-bridge
        state: up`;
}

export function nncpYamlToForm(yaml: string): ParseYamlResult<NncpFormState> {
  return parseResult(
    yaml,
    { name: readMetadataField(yaml, "name") },
    /capture:/m.test(yaml) || /routes:/m.test(yaml)
  );
}

export const NNCP_YAML_SCHEMA: YamlSchemaField[] = [
  { name: "metadata.name", type: "string", description: "Policy name applied to selected nodes." },
  { name: "spec.nodeSelector", type: "object", description: "Label query matching target nodes." },
  { name: "spec.desiredState", type: "object", description: "Nmstate interfaces and routes to enforce." },
];

function selectorFromYaml(yaml: string): string | undefined {
  const block =
    yaml.match(/^\s*selector:\s*\n((?:\s+.+\n?)+)/m)?.[1] ??
    yaml.match(/^\s*selector:\s*\{([^}]+)\}/m)?.[1];
  if (!block) return undefined;
  const pairs: string[] = [];
  block.split("\n").forEach((line) => {
    const match = line.match(/^\s*([^:{}]+):\s*(.+)$/);
    if (match) pairs.push(`${match[1].trim()}=${stripQuotes(match[2])}`);
  });
  if (pairs.length === 0 && block.includes("=")) return block.trim();
  return pairs.length > 0 ? pairs.join("\n") : undefined;
}

function selectorToYaml(text: string): string {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return "    {}";
  const rows = lines.map((line) => {
    const [key, ...rest] = line.split("=");
    return `    ${key.trim()}: ${rest.join("=").trim()}`;
  });
  return rows.join("\n");
}

function portsFromYaml(yaml: string): string | undefined {
  const portsBlock = yaml.match(/^\s*ports:\s*\n((?:\s+-.+\n?(?:\s+[^\n-].+\n?)*)+)/m)?.[1];
  if (!portsBlock) return undefined;
  const entries = portsBlock.split(/^\s*-\s+/m).map((e) => e.trim()).filter(Boolean);
  const lines = entries.map((entry) => {
    const port = entry.match(/port:\s*(\d+)/)?.[1] ?? "80";
    const target = entry.match(/targetPort:\s*(\d+)/)?.[1] ?? port;
    const protocol = entry.match(/protocol:\s*(\w+)/)?.[1] ?? "TCP";
    return `${port}:${target}/${protocol}`;
  });
  return lines.length > 0 ? lines.join("\n") : undefined;
}

function portsToYaml(text: string): string {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return `  - protocol: TCP
    port: 80
    targetPort: 80`;
  }
  return lines
    .map((line) => {
      const match = line.match(/^(\d+)\s*:\s*(\d+)\s*\/\s*(\w+)$/i) ?? line.match(/^(\d+)\s*\/\s*(\w+)$/i);
      if (match && match[3]) {
        return `  - protocol: ${match[3].toUpperCase()}
    port: ${match[1]}
    targetPort: ${match[2]}`;
      }
      if (match) {
        return `  - protocol: ${match[2].toUpperCase()}
    port: ${match[1]}
    targetPort: ${match[1]}`;
      }
      const portOnly = line.match(/^(\d+)$/);
      if (portOnly) {
        return `  - protocol: TCP
    port: ${portOnly[1]}
    targetPort: ${portOnly[1]}`;
      }
      return `  - protocol: TCP
    port: 80
    targetPort: 80`;
    })
    .join("\n");
}

export function serviceFormToYaml(state: ServiceFormState): string {
  const type = (state.type || "ClusterIP").trim() || "ClusterIP";
  return `apiVersion: v1
kind: Service
metadata:
  name: ${state.name}
  namespace: ${state.namespace}
spec:
  type: ${type}
  selector:
${selectorToYaml(state.selector)}
  ports:
${portsToYaml(state.ports)}`;
}

export function serviceYamlToForm(yaml: string): ParseYamlResult<ServiceFormState> {
  return parseResult(
    yaml,
    {
      name: readMetadataField(yaml, "name"),
      namespace: readMetadataField(yaml, "namespace") ?? "default",
      type: readSpecScalar(yaml, "type") ?? "ClusterIP",
      selector: selectorFromYaml(yaml) ?? "app=MyApp",
      ports: portsFromYaml(yaml) ?? "80:9376/TCP",
    },
    /sessionAffinity:|externalTrafficPolicy:|ipFamilyPolicy:/m.test(yaml)
  );
}

export const SERVICE_YAML_SCHEMA: YamlSchemaField[] = [
  { name: "apiVersion", type: "string", description: "API version for core Service resources (v1)." },
  { name: "kind", type: "string", description: "Must be Service." },
  { name: "metadata.name", type: "string", description: "Unique name of the Service within the namespace." },
  { name: "metadata.namespace", type: "string", description: "Target project/namespace for the Service." },
  {
    name: "spec.type",
    type: "string",
    description: "How the Service is exposed. Allowed values: ClusterIP, NodePort, LoadBalancer, ExternalName.",
  },
  {
    name: "spec.selector",
    type: "object",
    description: "Label selector matching the pods that back this Service.",
  },
  {
    name: "spec.ports",
    type: "array",
    description: "List of ports exposed by this Service (port, targetPort, protocol).",
  },
];
