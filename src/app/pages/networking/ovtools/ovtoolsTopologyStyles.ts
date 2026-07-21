import type { StylesheetStyle } from "cytoscape";

export const OVTOOLS_CY_STYLES: StylesheetStyle[] = [
  {
    selector: "core",
    style: {
      "active-bg-opacity": 0,
    },
  },
  {
    selector: "node",
    style: {
      label: "data(label)",
      "text-valign": "center",
      "text-halign": "center",
      "font-size": 11,
      "font-family": "RedHatText, Overpass, system-ui, sans-serif",
      color: "#e8eaed",
      "text-outline-width": 2,
      "text-outline-color": "#14171c",
      "text-wrap": "wrap",
      "text-max-width": 88,
      "background-color": "#2a3140",
      "border-width": 2,
      "border-color": "#4a5568",
      width: 72,
      height: 72,
      shape: "round-rectangle",
      "transition-property": "background-color, border-color, border-width, opacity",
      "transition-duration": 180,
    },
  },
  {
    selector: "node[kind = 'node']",
    style: {
      "background-color": "#1e3a5f",
      "border-color": "#3b82f6",
      width: 120,
      height: 88,
      "font-size": 12,
      "font-weight": 600,
    },
  },
  {
    selector: "node[kind = 'vm']",
    style: {
      "background-color": "#3b2d5c",
      "border-color": "#a78bfa",
      width: 80,
      height: 64,
    },
  },
  {
    selector: "node[kind = 'nad']",
    style: {
      "background-color": "#134e4a",
      "border-color": "#2dd4bf",
      shape: "hexagon",
      width: 76,
      height: 76,
    },
  },
  {
    selector: "node[kind = 'udn']",
    style: {
      "background-color": "#1e3a2f",
      "border-color": "#34d399",
      shape: "diamond",
      width: 80,
      height: 80,
    },
  },
  {
    selector: "node[kind = 'storageclass']",
    style: {
      "background-color": "#4a3728",
      "border-color": "#f59e0b",
      width: 96,
      height: 72,
    },
  },
  {
    selector: "node[kind = 'pvc']",
    style: {
      "background-color": "#3f3f46",
      "border-color": "#fbbf24",
      width: 72,
      height: 56,
    },
  },
  {
    selector: "node[kind = 'cluster']",
    style: {
      "background-color": "#1e293b",
      "border-color": "#64748b",
      width: 140,
      height: 96,
      shape: "round-rectangle",
      "font-weight": 600,
    },
  },
  {
    selector: "node[statusProfile = 'available']",
    style: {
      "background-color": "#14532d",
      "border-color": "#22c55e",
    },
  },
  {
    selector: "node[statusProfile = 'pending']",
    style: {
      "background-color": "#78350f",
      "border-color": "#f97316",
    },
  },
  {
    selector: "node[statusProfile = 'critical']",
    style: {
      "background-color": "#7f1d1d",
      "border-color": "#ef4444",
    },
  },
  {
    selector: ":parent",
    style: {
      "background-opacity": 0.12,
      "background-color": "#3b82f6",
      "border-color": "#2563eb",
      "border-width": 2,
      "border-style": "dashed",
      "text-valign": "top",
      "text-halign": "center",
      "text-margin-y": -6,
      padding: 120,
    },
  },
  {
    selector: "edge",
    style: {
      width: 2,
      "line-color": "#64748b",
      "target-arrow-color": "#64748b",
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
      opacity: 0.85,
      "transition-property": "line-color, width, opacity",
      "transition-duration": 180,
    },
  },
  {
    selector: "edge[kind = 'network']",
    style: {
      "line-color": "#2dd4bf",
      "target-arrow-color": "#2dd4bf",
    },
  },
  {
    selector: "edge[kind = 'storage']",
    style: {
      "line-color": "#fbbf24",
      "target-arrow-color": "#fbbf24",
    },
  },
  {
    selector: "edge[kind = 'placement']",
    style: {
      "line-style": "dashed",
      "line-color": "#94a3b8",
      "target-arrow-color": "#94a3b8",
    },
  },
  {
    selector: "edge[edgeHealth = 'healthy']",
    style: {
      "line-color": "#34d399",
      "target-arrow-color": "#34d399",
    },
  },
  {
    selector: "edge[edgeHealth = 'degraded']",
    style: {
      "line-color": "#fb923c",
      "target-arrow-color": "#fb923c",
      "line-style": "dashed",
    },
  },
  {
    selector: "edge[edgeHealth = 'failed']",
    style: {
      "line-color": "#f87171",
      "target-arrow-color": "#f87171",
      width: 3,
    },
  },
  {
    selector: "edge[kind = 'validation-failed']",
    style: {
      "line-color": "#ef4444",
      "target-arrow-color": "#ef4444",
      width: 3,
      "line-style": "dotted",
    },
  },
  {
    selector: "node[atCapacity = 'true']",
    style: {
      "background-color": "#713f12",
      "border-color": "#facc15",
      "border-width": 4,
    },
  },
  {
    selector: "node[faultDomain = 'nad']",
    style: {
      "border-color": "#f472b6",
      "border-style": "dashed",
      "border-width": 3,
    },
  },
  {
    selector: "node[faultDomain = 'vm']",
    style: {
      "border-color": "#c4b5fd",
      "border-style": "dotted",
      "border-width": 3,
    },
  },
  {
    selector: "node[faultDomain = 'storage']",
    style: {
      "border-color": "#fb923c",
      "border-style": "double",
      "border-width": 3,
    },
  },
  {
    selector: "node.label-hidden",
    style: {
      "text-opacity": 0,
    },
  },
  {
    selector: "node.cluster-hidden",
    style: {
      display: "none",
    },
  },
  {
    selector: "node.cluster-collapsed",
    style: {
      "border-width": 3,
      "border-style": "double",
    },
  },
  {
    selector: "node:selected",
    style: {
      "border-width": 3,
      "border-color": "#60a5fa",
      "background-color": "#334155",
    },
  },
  {
    selector: "edge:selected",
    style: {
      width: 3,
      "line-color": "#60a5fa",
      "target-arrow-color": "#60a5fa",
    },
  },
  {
    selector: "node.highlighted",
    style: {
      "border-width": 3,
      "border-color": "#f472b6",
      opacity: 1,
    },
  },
  {
    selector: "node.faded",
    style: {
      opacity: 0.25,
    },
  },
  {
    selector: "edge.faded",
    style: {
      opacity: 0.15,
    },
  },
  {
    selector: "node.hover",
    style: {
      "border-width": 3,
      "border-color": "#e2e8f0",
    },
  },
];
