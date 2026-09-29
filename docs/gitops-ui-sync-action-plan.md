# GitOps UI Sync — action plan (Sep 29, 2026)

**Meeting:** GitOps UI Sync (Kevin, Keith, Ali, Sho, William, Bill, Jann, Swati)  
**Prototype:** https://openshift-platform-prototype.vercel.app/gitops/overview  
**Design doc:** https://docs.google.com/document/d/1qTpmxYJBwIMAVDg2ZHaB4R0l6r7GuMiJx-ChkiYf_Rg/edit  

## Gemini notes — accuracy

| Topic | Claim | Assessment |
|-------|--------|------------|
| PatternFly compliance | Revert Argo-mirror colors; use PF tokens | **Accurate** — Kevin/Sho flagged debt; Keith agreed to revert. Prototype dashboard uses `pfSemanticColors` / PF chart tokens. |
| Dashboard filtering | Drop instance filter; use project selector only | **Accurate** — consensus on project dropdown + RBAC. Prototype: instance picker removed from Overview; scope follows **Project** bar. |
| Reconciliation chart axis | Negative time confused users; use 24h window left→Now | **Accurate** — Ali/Kevin feedback. Prototype chart labels **24h ago → Now**. |
| P1 priorities | Dashboard, 3 app enhancements, rollouts (+ experiments + analysis runs tabs) | **Accurate** — Sho’s P1 list; Keith to update plan docs. |
| P1.5 | Items below rollouts moved to P1.5 | **Accurate** — Ali to create category in Jira (eng/process). |
| Empty states | Use PatternFly empty state patterns | **Accurate** — Kevin cited PF; prototype Overview shows PF **EmptyState** when project has no apps. |
| AI / LightSpeed | Agentic runs links; in-plugin notifications vs hub redirect | **Accurate** — William/Kevin/Ali; Kevin to sync with Peter + Ali (out of prototype scope here). |
| Jira split / chaiibbot sizing | Split dashboard epic; Slack bot sizing | **Accurate** — process, not UX prototype. |

## Prototype alignment (Kevin / UX)

| Decision | Prototype change |
|----------|------------------|
| Project-scoped dashboard | `ConsoleProjectContext` + Overview filters apps by **Project** |
| No instance picker on Overview | Removed `GitOpsInstancePicker` from dashboard; info alert explains scope |
| PF chart timeline | Reconciliation activity X-axis: past on the left, **Now** on the right |
| Rollouts P1 tabs | Separate **Experiments** and **Analysis runs** tabs on rollout detail |
| Empty Overview | PF EmptyState when selected project has zero applications |

## Owner matrix (from meeting)

| Action | Owner | Prototype / doc |
|--------|--------|-----------------|
| P1.5 Jira category | Ali | Jira — not prototype |
| Revert PF overrides (product) | Keith | Align eng plugin with PF; prototype already token-based |
| Rollout plan tabs in docs | Keith | Prototype tabs updated |
| Dashboard screenshots → Slack | Keith (+ Kevin review) | Captures in `public/gitops-design-shots/` + Google doc |
| Review with Gerald + Keith | Kevin | Schedule |
| AI sync with Peter + Ali | Kevin | Schedule |

## Out of scope (this pass)

- chaiibbot Jira sizing automation  
- Native console-core GitOps plugin code (Keith)  
- LightSpeed / agentic runs integration UX  
- Full removal of instance picker from non-Overview GitOps pages (still used on Applications, Rollouts, etc.)
