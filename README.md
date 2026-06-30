# OpenShift Platform prototype

Interactive React/TypeScript prototype for **OpenShift Container Platform** Console UX — OLM / operator management, cluster update, networking topology, virtualization, node/GPU metrics, and related stakeholder demos. Built with **Vite**, **PatternFly 6**, and **React Router v7**.

**Live demo:** [https://openshift-platform-prototype.vercel.app](https://openshift-platform-prototype.vercel.app)

| Surface | Link |
|--------|------|
| Installed Operators | [/ecosystem/installed-operators](https://openshift-platform-prototype.vercel.app/ecosystem/installed-operators) |
| Cluster Update | [/administration/cluster-update](https://openshift-platform-prototype.vercel.app/administration/cluster-update) |
| Network Topology | [/networking/topology](https://openshift-platform-prototype.vercel.app/networking/topology) |
| Virtual Machines | [/virtualization/virtualmachines](https://openshift-platform-prototype.vercel.app/virtualization/virtualmachines) |
| Nodes list | [/compute](https://openshift-platform-prototype.vercel.app/compute) |
| GPU node details (sample) | [/compute/nodes/ip-10-0-24-42.us-east-2.compute.internal](https://openshift-platform-prototype.vercel.app/compute/nodes/ip-10-0-24-42.us-east-2.compute.internal) |

**Repository:** [github.com/kevinhatchoua/openshift-platform-prototype](https://github.com/kevinhatchoua/openshift-platform-prototype)

**Legacy URLs** (301 redirect to the live demo):

- `https://ocp5-olm-update-experience.vercel.app`
- `https://node-details-gpu-metrics.vercel.app`

**Related:** [HPUX-1480](https://redhat.atlassian.net/browse/HPUX-1480) (OLM / Operator Management), [CONSOLE-5297](https://issues.redhat.com/browse/CONSOLE-5297) (GPU metrics on Node Details).

---

## OCP 5.x Operator Management & OLM

Interactive prototype for OpenShift Container Platform **5.x** operator catalog, installed operators, and related management flows.

Historical lineage traces to `ocp5-olm-update-experience` and shared UX exploration with `ocp5-cluster-update-experience`.

### Problem statement

Cluster Administrators need a centralized, consistent Operator Management experience. Today, fragmented catalog experiences, limited guidance on updates, and suboptimal table density increase cognitive load and slow decision-making.

### Goals

- Centralize Operator discovery/management by moving to a single catalog API.
- Integrate AI-driven update recommendations to reduce update fatigue and risk.
- Optimize Operator Management tables for efficient scanning and decision-making.

### Definition of Done

- Epic scope and success criteria are approved by UX and Console stakeholders.
- All child stories are created, prioritized, and linked to this Epic.
- Cross-team dependencies are identified (Console, catalog API, AI/insights).
- Plan includes validation checkpoints (design reviews, usability/feedback as needed).

### Strategic reminders

- Link this Epic to the relevant **OCPSTRAT** item for Operator Lifecycle / Operator Management so it appears on leadership dashboards.
- Ensure **Fix Version** is set to **5.0**.

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** 9+

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173/administration/cluster-update](http://localhost:5173/administration/cluster-update) for **Cluster Update**, or [http://localhost:5173/ecosystem/installed-operators](http://localhost:5173/ecosystem/installed-operators) for **Installed Operators**.

### Build for production

```bash
npm run build
npm run preview
```

The production bundle is suitable for static hosting (for example **Vercel**). This repo includes `vercel.json` with SPA rewrites to `index.html` and permanent redirects from legacy deployment URLs.

## Cluster Update (`/administration/cluster-update`)

Primary surface for exploring update planning, history, and (in prototype form) manual versus agent-driven flows.

### Tabs

- **Update plan** — Channel banner, optional **AI Assessment** (OpenShift Lightspeed pre-check entry point), update method or agent-only layout, and supporting sections depending on mode.
- **Update history** — Past update runs with method, outcome, and timing.

### Prototype demo: experience variant (saved in the browser)

Under the page title, a **segmented control** switches between two demo presentations (choice is stored in `localStorage` under `ocp5-cluster-update-demo-variant`):

| Option | Label in UI | Behavior |
|--------|-------------|----------|
| **Manual + Agent** | Manual + Agent **(OCP 5.1)** | Full **Update Method** picker (Manual vs Agent-based). **AI Assessment** is shown. Manual path includes available versions, operators on the cluster, and worker nodes. Agent path shows the **AI Update Agent** experience. |
| **Agent only** | Agent only **(OCP 5.0)** | **Update Method** is hidden. **AI Assessment** is shown with OCP 5.0–oriented copy. Only the agent-driven update plan experience is shown below it. |

This is for **design and stakeholder demos**, not product configuration.

### Manual update path (when Manual + Agent → Manual)

- Channel selection and **Available updates** (version groups, risk, operator issues).
- **Operators on this cluster** — table with compatibility for the selected target version, filters, and links into operator detail flows.
- **Worker nodes** — pool-level summary for the prototype.

### Agent update path (AI Update Agent)

- **Activity summary** metrics and a **current proposed plan** (version jump, maintenance window, step checklist).
- Plan header shows **Prerequisites** (for example, count of required operator updates) instead of a generic “ready for review” label when the plan is still pending.
- **Decision actions** (when the plan is pending): **Approve Plan** (primary), **Pre-check with AI** (opens Lightspeed with cluster pre-check context), **Reject Plan**, and **Schedule for later** as a **link-style** control.

### OpenShift Lightspeed (OLS)

Contextual AI drawer invoked from multiple entry points (AI Assessment **Pre-check with AI**, agent plan actions, Installed Operators assessment, and agent configuration shortcuts). Responses and actions are **prototype simulations** tied to the page context.

### Related routes

- **Version detail** — `/administration/cluster-update/version/:version` — risk and release-style detail for a chosen version.
- **Pre-flight** — `/administration/cluster-update/preflight` — illustrative pre-flight checklist.
- **In progress** — `/administration/cluster-update/in-progress` — progress-style view during an update.

## Installed Operators (`/ecosystem/installed-operators`)

Catalog operators installed on the cluster, aligned with the **Cluster Update** operator table for column names and styling:

- Operator name, Version, Cluster compatibility, Update plan, Support phase, Current phase end date, Status, Last updated, Managed namespaces, and optional row actions (kebab). Support phase labels follow the [OpenShift Operator Life Cycles](https://access.redhat.com/support/policy/updates/openshift_operators) policy (full support, maintenance support, EUS terms).
- **Manage columns** — show or hide data columns; Operator is always shown.
- Legend strip: **Cluster extension (OLM v1 managed)**.
- **AI Assessment** variant for this page with Installed Operators-specific copy and pre-check context.

## Ecosystem (other)

- **Software Catalog** — `/ecosystem/software-catalog`
- **Operator detail, install, update, subscription** — under `/ecosystem/installed-operators/...`

## Project structure

```
src/
  app/
    components/       # Shared UI (Layout, Breadcrumbs, AiAssessmentSection, OlsChatbot, modals, …)
    pages/
      administration/ # Cluster update plan and related admin flows
      ecosystem/      # Catalog and installed operators
      networking/     # Topology, NAD/UDN, node network configuration
      virtualization/ # VMs, templates, migration policies
      workloads/      # Sample workload views
      compute/        # Node-style views
    routes.ts         # React Router configuration
  styles/             # Tailwind CSS, theme, fonts
public/
  assets/             # Static assets
```

## Tech stack

- **React 18** + **TypeScript**
- **Vite** (`@vitejs/plugin-react`, `@tailwindcss/vite`)
- **Tailwind CSS v4**
- **React Router v7**
- **Lucide React** icons
- **Red Hat Display / Red Hat Text / Red Hat Mono** (see `src/styles`)

## External documentation links

In-app links reference OpenShift documentation where appropriate, for example:

- [Release notes](https://docs.openshift.com/container-platform/latest/release_notes/ocp-4-18-release-notes.html)
- [Update channels](https://docs.openshift.com/container-platform/latest/updating/understanding_updates/understanding-update-channels-releases.html)
- [Introduction to updates](https://docs.openshift.com/container-platform/latest/updating/understanding_updates/intro-to-updates.html)
- [Upgrading operators](https://docs.openshift.com/container-platform/latest/operators/admin/olm-upgrading-operators.html)
- [Red Hat Hybrid Cloud Console](https://console.redhat.com/openshift)

---

*This repository is a UX prototype; behavior and data are simulated for exploration and presentation. Product requirements and delivery are tracked in Jira under [HPUX-1480](https://redhat.atlassian.net/browse/HPUX-1480).*
