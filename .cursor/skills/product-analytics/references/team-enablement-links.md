# Product analytics enablement — reference links

## Team playbook (canonical process doc)

- Google Doc: https://docs.google.com/document/d/1bT1Z5lylU9TSNcFZdCJUbVItuMNvLT7okPRaxVwBgiQ/edit (**shared UXD context**)

## Informing sources (full list)

- See [informing-sources.md](informing-sources.md)

## Tailwind (Domain 0)

- Domain 0 repository: https://gitlab.cee.redhat.com/tailwind/tailwind-domain0
- Bootstrap: `git clone git@gitlab.cee.redhat.com:tailwind/tailwind-domain0.git && bash installer/bootstrap.sh --agent <cursor|claude|codex>`
- CLI reference: `tailwind --help`, `tailwind status`, `tailwind lola sync`, `tailwind mcp list`

## Dataverse

- Consumer access console: https://ludo-ddis-asteroid--ludo.apps.int.spoke.prod.us-east-1.aws.paas.redhat.com/access-request/consumer-access
- OpenShift telemetry product access: https://ludo-ddis-asteroid--ludo.apps.int.spoke.prod.us-east-1.aws.paas.redhat.com/access-request/consumer-access?products=openshifttelemetry
- Slack (support; verify): [#help-dataverse-platform](https://redhat.enterprise.slack.com/archives/C08BLE5BKTQ)
- Slack (Observability / OpenShift telemetry): [#forum-observability-intelligence](https://redhat.enterprise.slack.com/archives/CLABA9CHY)

## Tailwind PM skills (evidence)

- tailwind-pm repo: https://gitlab.cee.redhat.com/tailwind/tailwind-pm
- dataverse-query skill: https://gitlab.cee.redhat.com/tailwind/tailwind-pm/-/blob/main/skills/dataverse-query/SKILL.md

## Amplitude

- Use Amplitude MCP after org SSO; discover projects via `get_amplitude_context`

## Responsible use

- Tailwind PM responsible use: https://gitlab.cee.redhat.com/tailwind/tailwind-pm/-/blob/main/docs/responsible-use.md
