export type NodeNetworkViewMode = "topology" | "table";

export const NODE_NETWORK_VIEW_STORAGE_KEY = "ocs.node-network.view-mode";

export function readNodeNetworkViewMode(): NodeNetworkViewMode {
  if (typeof window === "undefined") return "topology";

  const params = new URLSearchParams(window.location.search);
  const queryView = params.get("view");
  if (queryView === "table" || queryView === "topology") {
    return queryView;
  }

  const stored = window.localStorage.getItem(NODE_NETWORK_VIEW_STORAGE_KEY);
  if (stored === "table" || stored === "topology") {
    return stored;
  }

  return "topology";
}

export function writeNodeNetworkViewMode(mode: NodeNetworkViewMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NODE_NETWORK_VIEW_STORAGE_KEY, mode);
}
