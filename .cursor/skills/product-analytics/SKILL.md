---
name: product-analytics
description: >
  Answer product analytics questions using approved Red Hat data sources (Dataverse/Snowflake,
  Amplitude, Jira, support cases, Google Workspace exports). Routes each prompt to the
  correct endpoint, enforces access checks, responsible-use and PII rules, and delegates
  fleet/telemetry SQL to dataverse-query. Use when the user asks how many users/clusters/
  customers do X, adoption, usage trends, funnel metrics, or any quantitative product question.
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
allowed-tools: Bash, Read, Write
---

# Product Analytics

Quantitative product questions at Red Hat must use **approved tools and skills**, not guessed
APIs or fabricated numbers. This skill is the router and quality gate; specialized skills
handle execution.

**Setup:** [Team Playbook (Google Doc)](https://docs.google.com/document/d/1bT1Z5lylU9TSNcFZdCJUbVItuMNvLT7okPRaxVwBgiQ/edit) — humans read **Part 1**; Cursor agents follow **Part 2**; Claude Code agents follow **Part 3**. **Sources:** [references/informing-sources.md](references/informing-sources.md).

## When to use

Trigger when the user asks (in any wording):

- How many **users**, **customers**, **clusters**, **accounts**, or **orgs** do or use X
- **Adoption**, **reach**, **penetration**, **trends**, **cohorts**, **funnels**
- **Production vs eval**, **support level**, **fleet** or **telemetry** counts
- Compare metrics across **time**, **version**, **segment**, or **product**
- "Product analytics", "Dataverse", "telemetry", "Amplitude", or `/dataverse-query`

Do **not** use for pure UX design, code changes, or general knowledge without data retrieval.

## Mandatory behavior

1. **Never invent metrics** — if data cannot be fetched, say what blocked access and how to fix it.
2. **Human in the loop** — treat SQL and charts as drafts; state assumptions and date of data.
3. **PII and policy** — follow org MCP policy; do not paste secrets, tokens, or customer-identifying
   exports into tickets or public channels without approval.
4. **Print SQL before run** — for Dataverse, always follow `dataverse-query` checklist (load that skill).
5. **Pick one primary source** per question (table below); use secondary sources only to enrich context.

## Data source router

| Question type | Primary source | Tool / skill | Notes |
|---------------|----------------|--------------|-------|
| OpenShift fleet, operators, CRDs, cluster/customer counts | Dataverse (openshift / telesense / telemetry products) | Dataverse MCP: `identify_dataproducts` → `shortlist_tables` → `get_sql` → `execute_sql` + **`dataverse-query`** | Requires consumer access; ~1 day lag common |
| Console or app **behavioral** events (clicks, flows, funnels) | Amplitude | Amplitude MCP (`get_amplitude_context`, chart/query tools) + **`use_amp_skill`** when needed | Project ID required; event names are project-specific |
| Delivery, backlog, story status | Jira | `scripts/jira-api.sh` or approved Jira REST | issues.redhat.com |
| Support volume, case themes | RH support cases | **`redhat-support-cases`** skill | Evidence for PM decisions |
| Docs, sheets, decks already curated | Google Drive / Docs | **`gws`** CLI skills | Commenter-shared team artifacts |
| PM evidence bundle | Tailwind PM | **`productization-decision`**, **`dataverse-query`**, **`redhat-support-cases`** | Structured decision workflow |

If routing is ambiguous, ask one clarifying question (fleet telemetry vs in-product analytics vs Jira).

## Prerequisites (verify before querying)

Run or infer from `tailwind status`:

| Check | Pass criteria |
|-------|----------------|
| VPN | `gitlab.cee.redhat.com` reachable |
| Tailwind CLI | `tailwind` on PATH; `tailwind lola status` shows modules |
| Cursor MCP | Settings → MCP: **Dataverse** (and Jira if used) present in `~/.cursor/mcp.json` |
| Snowflake consumer roles | `shortlist_tables` does not return `Require access to …` |
| Amplitude | `get_amplitude_context` returns org/projects user can access |

**Access requests (Dataverse):** [Dataverse Console — consumer access](https://ludo-ddis-asteroid--ludo.apps.int.spoke.prod.us-east-1.aws.paas.redhat.com/access-request/consumer-access)

**OpenShift telemetry product:** [openshifttelemetry access](https://ludo-ddis-asteroid--ludo.apps.int.spoke.prod.us-east-1.aws.paas.redhat.com/access-request/consumer-access?products=openshifttelemetry)

**Tailwind Domain 0 install:** [tailwind-domain0](https://gitlab.cee.redhat.com/tailwind/tailwind-domain0) — `bash installer/bootstrap.sh --agent cursor`

## Dataverse workflow (required for fleet / SQL)

1. Read and follow **`~/.cursor/skills/dataverse-query/SKILL.md`** (from Tailwind PM via `tailwind lola sync`; no shortcuts).
2. MCP pipeline:
   - `identify_dataproducts` with the user question + date + filters stated in plain language
   - `shortlist_tables` for the selected data product
   - `get_sql` with the same context
   - Review SQL against the checklist; edit if business rules are missing
   - `execute_sql` only after review
3. On `Require access to PRODUCT` — stop; list the product name and link the access console; do not guess numbers.
4. On empty results — decrement snapshot date per `dataverse-query` date rules; note lag in the answer.

## Amplitude workflow (required for behavioral analytics)

1. Call `get_amplitude_context` (no projectId first) to list accessible projects.
2. Discover **event and property names** for the target project; never assume event strings.
3. Prefer saved charts/search when the question matches an existing definition; otherwise build and run a validated query.
4. Present chart link or table + definition summary + date range.

## Jira / support workflows

- Jira search: workspace `scripts/jira-api.sh` when present; POST `search/jql` per team rules.
- Support cases: load **`redhat-support-cases`** for case search and stats.

## Response format

Always include:

1. **Answer** — number or trend with units (clusters, customers, users, events)
2. **As-of date** or range
3. **Filters** — production vs eval, internal exclusion, dedup strategy
4. **Source** — data product, Amplitude project, or Jira JQL summary
5. **Confidence** — access OK / partial data / blocked
6. **Reproduce** — SQL snippet, chart ID, or JQL (no tokens)

## Example prompts

```
How many production clusters run OpenShift Virtualization as of yesterday?
What is monthly active users for console feature X in Amplitude project Y?
How many HPUX stories shipped networking in Q3?
```

## Related skills and commands

| Artifact | Location |
|----------|----------|
| This skill (UXD repo) | `skills/product-analytics/SKILL.md` in [uxd-productivity-skills](https://gitlab.cee.redhat.com/uxd/uxd-productivity-skills) |
| Dataverse SQL rules | [tailwind-pm dataverse-query](https://gitlab.cee.redhat.com/tailwind/tailwind-pm/-/blob/main/skills/dataverse-query/SKILL.md) |
| Slash command | `/tailwind-pm:dataverse-query` (fleet SQL only) |
| Team setup guide | [Product Analytics AI Enablement — Team Playbook](https://docs.google.com/document/d/1bT1Z5lylU9TSNcFZdCJUbVItuMNvLT7okPRaxVwBgiQ/edit) |

## Escalation

| Topic | Channel / contact |
|-------|-------------------|
| Dataverse access, pipelines | [#help-dataverse-platform](https://redhat.enterprise.slack.com/archives/C08BLE5BKTQ) |
| OpenShift telemetry marts | [#forum-observability-intelligence](https://redhat.enterprise.slack.com/archives/CLABA9CHY) (`@obsint-dataverse`) |
| Tailwind installer / Lola | [tailwind-domain0](https://gitlab.cee.redhat.com/tailwind/tailwind-domain0) |

See [references/team-enablement-links.md](references/team-enablement-links.md) and [references/informing-sources.md](references/informing-sources.md).
