# Evidence it works

Sanitized from a real product-analytics run (November 2026). No customer identifiers. The fleet question was blocked, which is a valid result for this skill: it must not invent a count.

## Prompt

How many production clusters run OpenShift Virtualization as of 2026-10-27?

## Source / tool

- Router: `product-analytics` (fleet question → Dataverse, not Amplitude)
- Skill: Tailwind PM `dataverse-query` (schema discovery and SQL review before execution)
- MCP: Dataverse `shortlist_tables` on data product `openshift`, then `execute_sql`
- Tables checked: `OPENSHIFT_DB.MARTS.CLUSTERS_DAILY`, `OPENSHIFT_DB.MARTS.OLM_OPERATORS_DAILY`

## Resulting output (blocked access)

Probe:

```sql
SELECT MAX("COLLECTED_ON") AS "MAX_DATE", COUNT(*) AS "ROWS"
FROM "OPENSHIFT_DB"."MARTS"."CLUSTERS_DAILY"
```

Returned **0 rows** and a null `MAX(COLLECTED_ON)`. The same probe on `OLM_OPERATORS_DAILY` also returned **0 rows**. SQL executed. The empty mart is an entitlement gap for this consumer role, not a fleet count of zero.

A follow-up on data product `lightspeedopenshift` (`shortlist_tables`) returned:

```text
Require access to LIGHTSPEEDOPENSHIFT
```

The skill stopped, named the products, and pointed at the Dataverse consumer access console. No cluster count was reported.
