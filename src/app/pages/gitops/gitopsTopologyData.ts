import type { ApplicationRecord, ApplicationSetRecord } from "./gitopsData";
import { GITOPS_APPLICATIONS, gitopsDetailPath } from "./gitopsData";

export type GitOpsTopoNode = {
  id: string;
  kind: string;
  name: string;
  ns?: string;
  sync?: "Synced" | "OutOfSync" | string;
  health?: string;
  parentId?: string | null;
  grouped?: boolean;
  detail?: string;
  linkTo?: string | null;
};

export type GitOpsTopoGraph = {
  rootId: string;
  nodes: Record<string, GitOpsTopoNode>;
};

function nodeId(kind: string, name: string, ns?: string) {
  return `${kind}/${ns ?? "cluster"}/${name}`;
}

export function buildApplicationResourceGraph(app: ApplicationRecord): GitOpsTopoGraph {
  const destNs = app.destination.split(" / ").pop() ?? app.ns;
  const root: GitOpsTopoNode = {
    id: nodeId("Application", app.name, app.ns),
    kind: "Application",
    name: app.name,
    ns: app.ns,
    sync: app.sync,
    health: app.health,
    parentId: null,
    linkTo: gitopsDetailPath("applications", app.ns, app.name),
    detail: `${app.repo} @ ${app.revision}`,
  };
  const deploy: GitOpsTopoNode = {
    id: nodeId("Deployment", app.name, destNs),
    kind: "Deployment",
    name: app.name,
    ns: destNs,
    sync: app.sync,
    health: app.health,
    parentId: root.id,
  };
  const rs: GitOpsTopoNode = {
    id: nodeId("ReplicaSet", `${app.name}-6f8d9`, destNs),
    kind: "ReplicaSet",
    name: `${app.name}-6f8d9`,
    ns: destNs,
    sync: "Synced",
    health: "Healthy",
    parentId: deploy.id,
  };
  const pod: GitOpsTopoNode = {
    id: nodeId("Pod", `${app.name}-6f8d9-abc12`, destNs),
    kind: "Pod",
    name: `${app.name}-6f8d9-abc12`,
    ns: destNs,
    sync: "Synced",
    health: app.health === "Degraded" ? "Degraded" : "Healthy",
    parentId: rs.id,
  };
  const svc: GitOpsTopoNode = {
    id: nodeId("Service", app.name, destNs),
    kind: "Service",
    name: app.name,
    ns: destNs,
    sync: "Synced",
    health: "Healthy",
    parentId: root.id,
  };
  const cm: GitOpsTopoNode = {
    id: nodeId("ConfigMap", `${app.name}-config`, destNs),
    kind: "ConfigMap",
    name: `${app.name}-config`,
    ns: destNs,
    sync: app.sync,
    health: "Healthy",
    parentId: root.id,
    grouped: true,
  };
  const nodes: Record<string, GitOpsTopoNode> = {
    [root.id]: root,
    [deploy.id]: deploy,
    [rs.id]: rs,
    [pod.id]: pod,
    [svc.id]: svc,
    [cm.id]: cm,
  };
  return { rootId: root.id, nodes };
}

export function applicationsForAppSet(appset: ApplicationSetRecord): ApplicationRecord[] {
  return GITOPS_APPLICATIONS.filter((app) =>
    app.ownerReferences.some((ref) => ref.kind === "ApplicationSet" && ref.name === appset.name)
  );
}

export function buildApplicationSetGraph(appset: ApplicationSetRecord): GitOpsTopoGraph {
  const root: GitOpsTopoNode = {
    id: nodeId("ApplicationSet", appset.name, appset.ns),
    kind: "ApplicationSet",
    name: appset.name,
    ns: appset.ns,
    health: appset.status,
    parentId: null,
    linkTo: gitopsDetailPath("applicationsets", appset.ns, appset.name),
    detail: `${appset.generators} generator · ${appset.apps} apps`,
  };
  const nodes: Record<string, GitOpsTopoNode> = { [root.id]: root };
  const managed = applicationsForAppSet(appset);
  const childApps =
    managed.length > 0
      ? managed
      : [
          {
            name: `${appset.name}-sample`,
            ns: appset.ns,
            sync: "Synced" as const,
            health: "Healthy" as const,
          },
        ];
  childApps.forEach((app, index) => {
    const name = typeof app === "object" && "name" in app ? app.name : String(app);
    const ns = typeof app === "object" && "ns" in app ? app.ns : appset.ns;
    const sync = "sync" in app ? app.sync : "Synced";
    const health = "health" in app ? app.health : "Healthy";
    const id = nodeId("Application", name, ns);
    nodes[id] = {
      id,
      kind: "Application",
      name,
      ns,
      sync,
      health,
      parentId: root.id,
      grouped: index > 2,
      linkTo: gitopsDetailPath("applications", ns, name),
    };
  });
  return { rootId: root.id, nodes };
}

export function childrenOf(graph: GitOpsTopoGraph, nodeId: string): GitOpsTopoNode[] {
  return Object.values(graph.nodes).filter((n) => n.parentId === nodeId);
}

export function layoutTree(graph: GitOpsTopoGraph): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const NODE_W = 148;
  const NODE_H = 72;
  const H_GAP = 24;
  const V_GAP = 56;

  function subtreeWidth(id: string): number {
    const kids = childrenOf(graph, id);
    if (kids.length === 0) return NODE_W;
    return kids.reduce((sum, kid) => sum + subtreeWidth(kid.id) + H_GAP, -H_GAP);
  }

  function place(id: string, depth: number, left: number) {
    const width = subtreeWidth(id);
    positions.set(id, { x: left + width / 2 - NODE_W / 2, y: depth * (NODE_H + V_GAP) });
    let cursor = left;
    childrenOf(graph, id).forEach((kid) => {
      const kidWidth = subtreeWidth(kid.id);
      place(kid.id, depth + 1, cursor);
      cursor += kidWidth + H_GAP;
    });
  }

  place(graph.rootId, 0, 0);
  return positions;
}

export function graphBounds(positions: Map<string, { x: number; y: number }>) {
  let minX = 0;
  let minY = 0;
  let maxX = 400;
  let maxY = 320;
  positions.forEach(({ x, y }) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + 148);
    maxY = Math.max(maxY, y + 72);
  });
  return { minX, minY, width: maxX - minX + 48, height: maxY - minY + 48 };
}
