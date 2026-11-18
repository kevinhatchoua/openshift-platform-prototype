/** Classic operators that need approval to become Cluster extensions during an update (prototype). */
export const CLASSIC_TO_EXTENSION_APPROVALS = [
  { name: "Cert Manager", version: "1.14.0", from: "Classic operator", to: "Cluster extension" },
  { name: "Kiali Operator", version: "1.73.0", from: "Classic operator", to: "Cluster extension" },
] as const;

export type OperatorClusterVersionGate = {
  name: string;
  operatorVersion: string;
  requiredClusterVersion: string;
};

export function gatesFromOperators(
  operators: Array<{ name: string; clusterVersionGate?: OperatorClusterVersionGate | { operatorVersion: string; requiredClusterVersion: string } }>,
): OperatorClusterVersionGate[] {
  return operators.flatMap((op) =>
    op.clusterVersionGate
      ? [
          {
            name: op.name,
            operatorVersion: op.clusterVersionGate.operatorVersion,
            requiredClusterVersion: op.clusterVersionGate.requiredClusterVersion,
          },
        ]
      : [],
  );
}
