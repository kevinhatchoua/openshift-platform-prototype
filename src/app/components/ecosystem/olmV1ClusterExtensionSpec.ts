/** OLMv1 ClusterExtension targeting fields (5.1: manual text; no catalogd-backed selectors). */

export type OlmV1ClusterExtensionSpec = {
  channel: string;
  version: string;
  versionRange: string;
};

export const DEFAULT_OLM_V1_VERSION_RANGE = ">=1.12.0 <1.14.0";

export function defaultClusterExtensionSpec(partial?: Partial<OlmV1ClusterExtensionSpec>): OlmV1ClusterExtensionSpec {
  return {
    channel: partial?.channel ?? "stable",
    version: partial?.version ?? "1.12.0",
    versionRange: partial?.versionRange ?? DEFAULT_OLM_V1_VERSION_RANGE,
  };
}

export function buildClusterExtensionYaml(input: {
  name: string;
  packageName: string;
  namespace: string;
  serviceAccountName: string;
  spec: OlmV1ClusterExtensionSpec;
}): string {
  const { name, packageName, namespace, serviceAccountName, spec } = input;
  return `apiVersion: olm.operatorframework.io/v1
kind: ClusterExtension
metadata:
  name: ${name}
  namespace: ${namespace}
spec:
  packageName: ${packageName}
  channel: ${spec.channel}
  version: ${spec.version}
  versionRange: ${spec.versionRange}
  serviceAccountName: ${serviceAccountName}
`;
}
