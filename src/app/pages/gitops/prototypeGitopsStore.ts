import type { ApplicationSetRecord } from "./gitopsData";

const LS_KEY = "gitops-prototype-created";

type StoredApplicationSet = { ns: string; name: string; record: ApplicationSetRecord };

type StoreShape = {
  applicationsets: StoredApplicationSet[];
};

function readStore(): StoreShape {
  try {
    const raw = sessionStorage.getItem(LS_KEY);
    if (!raw) return { applicationsets: [] };
    const parsed = JSON.parse(raw) as StoreShape;
    return { applicationsets: parsed.applicationsets ?? [] };
  } catch {
    return { applicationsets: [] };
  }
}

function writeStore(store: StoreShape) {
  try {
    sessionStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota errors in prototype */
  }
}

export function registerPrototypeApplicationSet(ns: string, name: string, record: ApplicationSetRecord) {
  const store = readStore();
  const next = store.applicationsets.filter((item) => !(item.ns === ns && item.name === name));
  next.push({ ns, name, record });
  writeStore({ applicationsets: next });
}

export function findPrototypeApplicationSet(ns: string, name: string): ApplicationSetRecord | undefined {
  return readStore().applicationsets.find((item) => item.ns === ns && item.name === name)?.record;
}

export function createStubApplicationSet(ns: string, name: string): ApplicationSetRecord {
  return {
    name,
    ns,
    generators: "git",
    generatorTree: [{ type: "git", label: `Git — prototype resource ${name}` }],
    apps: "0",
    age: "just now",
    repo: "https://github.com/demo/tenant-workloads.git",
    path: "applicationsets/tenants",
    status: "Healthy",
  };
}
