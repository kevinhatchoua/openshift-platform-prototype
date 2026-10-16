export function prototypeResourceYaml({
  apiVersion = "v1",
  kind,
  name,
  namespace,
  extra = "",
}: {
  apiVersion?: string;
  kind: string;
  name: string;
  namespace?: string;
  extra?: string;
}): string {
  const nsLine = namespace ? `  namespace: ${namespace}\n` : "";
  const body = `apiVersion: ${apiVersion}
kind: ${kind}
metadata:
  name: ${name}
${nsLine}${extra}`;
  return body.trimEnd();
}
