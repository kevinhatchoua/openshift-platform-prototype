---
name: product-analytics
description: >
  Answer quantitative product questions using approved Red Hat sources: fleet and telemetry
  via Dataverse, in-product behavior via Amplitude, and supporting evidence via support cases,
  curated Drive artifacts, and PM evidence skills. Routes each prompt to the right source,
  blocks fabricated numbers, and delegates fleet SQL to Tailwind PM dataverse-query. Use when
  the user asks adoption, usage, funnels, fleet counts, telemetry, or "how many" product questions.
author: "khatchou"
triggers:
  - "product analytics"
  - "how many users"
  - "how many clusters"
  - "how many customers"
  - "adoption"
  - "fleet telemetry"
  - "dataverse"
metadata:
  user-invocable: "true"
  allowed-tools: "Bash, Read, Write"
---

# Product Analytics

## Why this skill exists

Product and UX decisions need **real numbers**, not plausible guesses. Fleet data, product usage, and behavioral analytics each live in different **approved** systems with different access rules and freshness. Without a single router, agents invent metrics, run unreviewed SQL, or cite the wrong source.

This skill gives agents a **stable workflow**: pick the right source, refuse to fabricate when access fails, keep humans in the loop for SQL and interpretation, and align with the team playbook below.

**Team playbook (shared UXD context):** [Product Analytics AI Enablement — Team Playbook](https://docs.google.com/document/d/1bT1Z5lylU9TSNcFZdCJUbVItuMNvLT7okPRaxVwBgiQ/edit). This Doc is **intentional team context** (setup, phases, Cursor vs Claude sections). Contributors and maintainers assume readers with Red Hat SSO can access it. If you cannot open it, request access through your manager or the playbook owner.

**Deeper link lists:** [references/informing-sources.md](references/informing-sources.md), [references/team-enablement-links.md](references/team-enablement-links.md).

## When to use

Trigger when the user asks (in any wording):

- How many **users**, **customers**, **clusters**, **accounts**, or **orgs** do or use X
- **Adoption**, **reach**, **penetration**, **trends**, **cohorts**, **funnels**
- **Production vs eval**, **fleet** or **telemetry** counts
- Compare metrics across **time**, **version**, **segment**, or **product**
- "Product analytics", "Dataverse", "telemetry", "Amplitude", or fleet SQL topics

Do **not** use for pure UX design, code changes, or opinions without data retrieval.

## Mandatory behavior

1. **Never invent metrics** — if data cannot be fetched, state the blocker and how to fix it (access, VPN, wrong project).
2. **Human in the loop** — treat SQL, charts, and interpretations as drafts; call out assumptions and snapshot dates.
3. **PII and policy** — follow org MCP policy; do not paste secrets or customer-identifying exports into public channels.
4. **Fleet SQL** — always load **`dataverse-query`** first; print and review SQL before execution (no shortcuts).
5. **One primary source** per answer; add secondary sources only to add context, not to mix incompatible definitions.

## MCP servers and skills (required vs optional)

| Required for | Capability | Notes |
|--------------|------------|--------|
| Fleet / SQL | **Dataverse MCP** (from Tailwind Domain 0) | `identify_dataproducts` → `shortlist_tables` → `get_sql` → `execute_sql` |
| Fleet / SQL | **`dataverse-query`** (Tailwind PM skill) | Schema discovery, date rules, responsible use; install via `tailwind lola sync` |
| Fleet / SQL | **Tailwind CLI + Domain 0** | VPN; installer unlocks MCP and Lola skill sync |
| Behavioral | **Amplitude MCP** | Discover projects and event names; never assume event strings |
| This router | **This skill** (`product-analytics`) | Source routing and safeguards |

| Optional | Capability | When to load |
|----------|------------|--------------|
| Support themes | **`redhat-support-cases`** | Questions about case volume, themes, or field trends |
| PM evidence bundles | **`productization-decision`** | Structured productization workflows that pull Dataverse + cases together |
| Curated exports | **Google Workspace (`gws`)** | Reading team Sheets/Docs that already contain agreed metrics |

Routing is intentionally narrow: **Jira and delivery backlogs are out of scope** for this skill (use PM or delivery skills instead).

## Install paths by agent (agent-neutral)

| Host | Where to copy this skill | MCP registration |
|------|-------------------------|------------------|
| **Cursor** | Project `.cursor/skills/product-analytics/` or `~/.cursor/skills/product-analytics/` | Cursor Settings → MCP, or generated config under `~/.cursor/mcp.json` after Domain 0 bootstrap |
| **Claude Code** | Follow [Tailwind Domain 0](https://gitlab.cee.redhat.com/tailwind/tailwind-domain0) skill paths for Claude | Same installer; MCP list in host output of `tailwind mcp list` |
| **Codex** | e.g. `~/.codex/skills/product-analytics/` (see [uxd-productivity-skills README](https://gitlab.cee.redhat.com/uxd/uxd-productivity-skills/-/blob/main/README.md) “How to use a skill”) | Configure MCP per Codex docs; Dataverse and Amplitude must still be registered |

**Tailwind bootstrap (any agent):** `bash installer/bootstrap.sh --agent <cursor|claude|codex>` from [tailwind-domain0](https://gitlab.cee.redhat.com/tailwind/tailwind-domain0). Then `tailwind lola sync` so **`dataverse-query`** appears next to this skill.

**Resolve `dataverse-query` location:** after sync, open the file from your host skills directory (for example `.cursor/skills/dataverse-query/SKILL.md` or the path `tailwind lola status` prints). Do not hardcode a single absolute path in answers.

## Data source router

| Question type | Primary source | Tool / skill |
|---------------|----------------|--------------|
| OpenShift fleet, operators, CRDs, cluster/customer counts | Dataverse (openshift / telesense / telemetry products) | Dataverse MCP + **`dataverse-query`** |
| Console or app **behavior** (clicks, flows, funnels) | Amplitude | Amplitude MCP; discover event names per project |
| Support volume, case themes | Red Hat support cases | **`redhat-support-cases`** (optional) |
| PM evidence bundle | Tailwind PM | **`productization-decision`** + Dataverse + optional cases (optional) |
| Curated team metrics in Drive/Sheets | Google Drive | **`gws`** when the artifact is already the source of truth (optional) |

If routing is ambiguous, ask one question (fleet vs in-product behavior vs support evidence).

## Prerequisites (verify before answering)

| Check | Pass criteria |
|-------|----------------|
| VPN | `gitlab.cee.redhat.com` reachable |
| Tailwind | `tailwind` on PATH; `tailwind lola status` shows modules |
| MCP | Dataverse and (if needed) Amplitude show as registered for your host |
| Dataverse | `shortlist_tables` does not return `Require access to …` for the target product |
| Amplitude | `get_amplitude_context` lists projects you can use |

**Dataverse access:** [Dataverse consumer access console](https://ludo-ddis-asteroid--ludo.apps.int.spoke.prod.us-east-1.aws.paas.redhat.com/access-request/consumer-access) — **OpenShift telemetry:** add product filter if marts require it.

## Dataverse workflow (fleet / SQL)

1. Read **`dataverse-query`** from your synced skills directory.
2. Run the MCP pipeline; review SQL against that skill checklist; then execute.
3. On `Require access to PRODUCT` — stop; name the product and link the access console; do not guess numbers.
4. On empty results — follow `dataverse-query` date/lag rules and say so in the answer.

## Amplitude workflow (behavioral)

1. `get_amplitude_context` (discover projects).
2. Discover **event and property names** for the target project.
3. Prefer saved charts when they match the question; otherwise build a validated query.
4. Respond with chart link or table, definition summary, and date range.

## Response format

Always include:

1. **Answer** — number or trend with units
2. **As-of date** or range
3. **Filters** — prod vs eval, segments, dedup strategy if known
4. **Source** — data product or Amplitude project
5. **Confidence** — access OK / partial / blocked
6. **Reproduce** — SQL snippet or chart id as appropriate (no secrets)

## Example prompts

```
How many production clusters run OpenShift Virtualization as of yesterday?
What is monthly actives for console feature X in Amplitude project Y?
```

## Related skills

| Artifact | Location |
|----------|----------|
| Dataverse SQL rules | [tailwind-pm dataverse-query](https://gitlab.cee.redhat.com/tailwind/tailwind-pm/-/blob/main/skills/dataverse-query/SKILL.md) |
| Slash command (fleet SQL helper) | `/tailwind-pm:dataverse-query` (still load this skill first for routing) |

## Escalation (optional)

Slack links below are **common support paths** as of skill publication; channels may change. Prefer the Dataverse console and Tailwind docs first.

| Topic | Channel |
|-------|---------|
| Dataverse access, pipelines | [#help-dataverse-platform](https://redhat.enterprise.slack.com/archives/C08BLE5BKTQ) |
| OpenShift telemetry marts | [#forum-observability-intelligence](https://redhat.enterprise.slack.com/archives/CLABA9CHY) |
| Tailwind installer | [tailwind-domain0](https://gitlab.cee.redhat.com/tailwind/tailwind-domain0) |

See [references/team-enablement-links.md](references/team-enablement-links.md).
