# Product Analytics — setup

This skill **routes quantitative product questions** to approved sources (primarily **Dataverse** for fleet and **Amplitude** for in-product behavior) and **blocks fabricated metrics**. It does **not** cover Jira or delivery backlogs.

## Team playbook

**[Product Analytics AI Enablement — Team Playbook](https://docs.google.com/document/d/1bT1Z5lylU9TSNcFZdCJUbVItuMNvLT7okPRaxVwBgiQ/edit)** — intentional shared UXD context for onboarding and agent-specific setup notes.

## First-time setup (short)

1. VPN to Red Hat GitLab.
2. Install [Tailwind Domain 0](https://gitlab.cee.redhat.com/tailwind/tailwind-domain0) and run `tailwind lola sync` so **`dataverse-query`** is available next to this skill.
3. Copy this folder to your agent’s skills directory (see [main UXD repo README](https://gitlab.cee.redhat.com/uxd/uxd-productivity-skills)): e.g. `.cursor/skills/`, Claude Code path from installer output, or `~/.codex/skills/`.
4. Register **Dataverse MCP** and **Amplitude MCP** for your host (installer helps; verify with `tailwind mcp list` or host docs).
5. Request **Dataverse consumer** access if `shortlist_tables` returns access errors.

## Triggers

- "How many users / clusters / customers …"
- "Product analytics", "adoption", "fleet", "telemetry", "Amplitude"

## References

- [informing-sources.md](references/informing-sources.md)
- [team-enablement-links.md](references/team-enablement-links.md)
