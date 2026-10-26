# Product Analytics — setup

Routes quantitative product questions to **Dataverse**, **Amplitude**, **Jira**, and related approved sources. Fleet/telemetry SQL always delegates to Tailwind PM **`dataverse-query`** (install via `tailwind lola sync`).

## Team playbook (read this first)

**[Product Analytics AI Enablement — Team Playbook](https://docs.google.com/document/d/1bT1Z5lylU9TSNcFZdCJUbVItuMNvLT7okPRaxVwBgiQ/edit)** — formatted team playbook: **Part 1** for humans, **Part 2** for Cursor, **Part 3** for Claude Code.

To hand off setup, paste the copy-paste prompt in **Part 2** (Cursor) or **Part 3** (Claude) of that Doc.

## First-time setup (short)

1. Follow the playbook **Phase 0–5** (Tailwind Domain 0, Dataverse access, this skill, Jira token, verification).
2. Copy this folder to `~/.cursor/skills/product-analytics/` (or use your project's `.cursor/skills/product-analytics/`).
3. Optional: add `product-analytics.mdc` under `~/.cursor/rules/` (see playbook Phase 3).

## Triggers

- "How many users/customers/clusters …"
- "Product analytics", "adoption", "fleet telemetry", "Amplitude funnel"
- `/tailwind-pm:dataverse-query` for fleet-only SQL (still load this skill first for routing)

## References

- [informing-sources.md](references/informing-sources.md)
- [team-enablement-links.md](references/team-enablement-links.md)
