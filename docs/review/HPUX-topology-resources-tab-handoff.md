# Topology Resources tab: Parthiv handoff (review before commit / Jira / GDoc)

**Status:** Prototype changes are **local only** (not committed). Jira and Google Doc are **drafts below** for your approval.

**Prototype review URLs**

- NMState installed (default banner): https://openshift-platform-prototype.vercel.app/networking/topology (after deploy) or local `/networking/topology`
- NMState missing: banner **NMState dependency → Missing**, open a **localnet** logical network → **Resources** tab
- UDN/CUDN: select a logical UDN/CUDN → **Resources** tab (informational alert, no host-bridge checkboxes)

---

## 1. Slack reply to Parthiv (send after you approve wording)

Hey Parthiv, thanks for flagging this. Here is the UX direction we are aligning to for Phase 1.

**Worker checkboxes (Resources tab)**  
Phase 1 treats this as **read-only discovery** (which workers are attached), not add/remove in the drawer. If we add in-topology editing later, changes must flow through NNCP/NAD with the cluster as source of truth. The prototype now reflects read-only checkboxes for localnet-style networks.

**Choosing the target bridge**  
No bridge dropdown in the drawer for v1. Canvas drag network → bridge remains the visual for *future* edit; drawer shows **read-only** bridge/mapping summary. Multi-bridge picker only if we later surface multiple eligible bridges on one worker.

**Which network types**  
**Localnet / host-managed attachment:** worker list + read-only mapping summary.  
**UDN/CUDN:** workers listed for reachability only; info alert that br-int is OVN-managed and host bridge mapping does not apply.

**No Kubernetes NMState Operator**  
**Alert + disabled controls**, not hiding the section (UXDR-6745 / HPUX-2437). Inline alert with install CTA; worker checkboxes disabled when NMState is missing.

I captured this in a new story under HPUX-2196 (draft below) and updated the prototype on master after your review.

Happy to walk through bridge eligibility if you have eng constraints to fold in.

Kevin

---

## 2. New Jira story (create after approval)

| Field | Value |
|-------|--------|
| **Project** | HPUX |
| **Parent** | HPUX-2196 |
| **Type** | Story |
| **Summary** | Topology drawer Resources tab: worker mapping rules, network types, NMState gating |
| **Activity type** | Make |
| **Story points** | 3 |
| **Priority** | Normal |
| **Labels** | `networking`, `problem-statement-data-driven`, `prototype` |
| **Component** | OCP |

### Description (Markdown for Jira)

```markdown
## Background

Engineering asked for clarity on the topology drawer **Resources** tab (Parthiv Krishnan, 19 Nov 2025): worker checkboxes, bridge selection, network-type scope, and behavior when Kubernetes NMState is not installed.

Nov 18 UX/Eng sync: errors and path realism before full Resources composition ([HPUX-2198](https://issues.redhat.com/browse/HPUX-2198)). NMState missing-operator pattern: [HPUX-2437](https://issues.redhat.com/browse/HPUX-2437), [UXDR-6745](https://issues.redhat.com/browse/UXDR-6745).

## Problem statement

Cluster administrators reviewing topology cannot tell whether worker controls are editable mapping, read-only status, or blocked without NMState. UDN/CUDN may be confused with host bridge mapping.

## Goals

- Document Phase 1 rules: discovery-only worker attachment in drawer for host-managed networks.
- Split UX for UDN/CUDN (informational only, no host bridge mapping affordances).
- NMState missing: inline alert + disabled assignment, not hidden section.
- Bridge selection: read-only summary in drawer; canvas drag reserved for future edit patterns.

## Acceptance criteria

- [ ] Resources tab spec documented on HPUX-2196 design doc with screenshots (installed vs missing NMState, localnet vs UDN).
- [ ] Prototype matches: read-only worker checkboxes (Phase 1), NMState alert on logical network Resources, UDN/CUDN informational pattern.
- [ ] Eng handoff: network-type matrix and bridge rules reviewed with networking console team.

## Definition of done

- [ ] Design doc updated (Pageless, redhat.com commenter).
- [ ] Design artifacts on this story and Epic HPUX-2196.
- [ ] Prototype URLs on story.
```

---

## 3. Comment drafts (paste after story exists)

### On [HPUX-2198](https://issues.redhat.com/browse/HPUX-2198)

Resources tab **composition** (worker mapping semantics, bridge picker) is sequenced after error/path realism on this story. Tracking rules in the new Resources-tab story under HPUX-2196 (Parthiv 19 Nov questions).

### On [HPUX-2196](https://issues.redhat.com/browse/HPUX-2196) Epic

Added story for topology drawer Resources tab: worker mapping read-only Phase 1, UDN/CUDN split, NMState gating. Prototype PR pending Kevin review.

### On [HPUX-2437](https://issues.redhat.com/browse/HPUX-2437) (optional)

Extended NMState pattern to logical-network **worker assignment** in topology drawer Resources tab (not only host interface assign/unassign).

---

## 4. HPUX-2196 Google Doc section (paste into pageless doc)

### Resources tab — worker mapping (19 Nov 2025, Parthiv)

**Phase 1 intent:** Discovery only in the topology drawer. Worker checkboxes reflect cluster state; they are not the control surface for add/remove.

| Network type | Resources tab: workers | Bridge / mapping |
|--------------|------------------------|------------------|
| Localnet / host-managed NAD path | Read-only checkboxes (or list) | Read-only summary; link to NNCP/NAD |
| UDN / CUDN | Read-only worker/workload context | Info: OVN br-int is infrastructure-managed; no host bridge mapping |

**NMState not installed**

- Show **Resources** section; do not hide.
- Inline alert: title *Kubernetes NMState Operator is not installed*; body explains read-only discovery; **Install operator** returns to Topology.
- Disable worker assignment controls.

**Future (post Phase 1)**

- In-topology edit (checkboxes or drag-to-bridge) only with NMState + explicit eng agreement on NNCP write path.
- Bridge picker when multiple eligible host bridges exist on one worker.

**Prototype**

- Policy: `src/app/pages/networking/topology/topologyWorkerMappingPolicy.ts`
- UI: `TopologyDetailPanel.tsx` Resources tab

**Screenshots to add when capturing:** localnet Resources (NMState installed); same with NMState missing; UDN Resources with informational alert.

---

## 5. Code changes (for your review)

| File | Change |
|------|--------|
| `topologyWorkerMappingPolicy.ts` | Phase 1 read-only flag, host-bridge vs UDN/CUDN split, bridge summary strings |
| `TopologyDetailPanel.tsx` | Resources tab: NMState alerts, disabled checkboxes, UDN/CUDN alert + DL |
| `createTopologyConnection.ts` | Block canvas assign when read-only or UDN/CUDN |
| `topologyActionHandlers.ts` | `workerMappingMutationsAllowed` flag |
| `NetworkTopologyView.tsx` | Wire NMState + policy into action handlers |

**Toggle for demos:** `PHASE1_TOPOLOGY_WORKER_MAPPING_READ_ONLY` in `topologyWorkerMappingPolicy.ts` (set `false` only to prototype editable assignment again).

---

## 6. Your checklist after approval

| # | Action |
|---|--------|
| 1 | Review prototype locally: localnet + UDN + NMState Missing on `/networking/topology` |
| 2 | Approve or edit Slack in section 1 → send to Parthiv |
| 3 | Create Jira story from section 2; assign, link UXDR-6745 |
| 4 | Post comments from section 3 |
| 5 | Add section 4 to HPUX-2196 Pageless GDoc + screenshots (`hpux-design-doc` skill) |
| 6 | Update Design artifacts on epic + new story |
| 7 | `git commit` + `git push` prototype |
| 8 | Optional: ask Phillip/Ron for +1 on UDN/CUDN vs localnet split |

**Not done in this pass (by your request):** git commit, Jira create, Google Doc create, Slack send.