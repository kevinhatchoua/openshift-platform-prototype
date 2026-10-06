# OLMv0 → OLMv1 console migration — engineering integration (prototype)

**STRAT:** [OCPSTRAT-2692](https://issues.redhat.com/browse/OCPSTRAT-2692)  
**Design / prototype:** [HPUX-2195](https://issues.redhat.com/browse/HPUX-2195)  
**Live path:** `/ecosystem/installed-operators` → **Classic Operators** tab

## Console touchpoints

| Location | Action | Component |
|----------|--------|-----------|
| Classic IO info notice | Wizard overview | `OlmMigrationStrategyNotice` |
| Installed Operators list (Classic) | Primary **Migrate** | Opens migration wizard |
| Row selection + toolbar **Actions** | Bulk migrate | Same wizard (pre-selected rows) |
| Row kebab → **Migrate to Next-Gen Operators** | Single-operator path | Wizard with operator pre-selected |
| **Migration status** column | In-table progress | Queued / Migrating / Migrated / Failed (rolled back) / Failed (manual action required) / Error / Incomplete |
| Toast notifications | Per-operator + batch summary | Success, danger, warning variants |
| Row kebab → **View migration blockers** | Ineligible / conflict | Blockers panel + resolution links |
| Installed Operators list (Next-Gen Operators) | **Roll back to Classic Operators** | Double-confirmation rollback modal |

## Migration wizard (modal)

1. **Select** — Eligibility table (eligible, ineligible, already migrated, conflict) with structured blockers; scope note for out-of-scope cases (catalog-source migration, namespace deletion, dependency operators).
2. **Run migration dry run** — Single dynamic table (operator metadata; dry run status updates Pending → Running → Pass/Blocked; planned action and target catalog columns fill as each operator completes). Short “what is a dry run” copy. User clicks **Run dry run** (not auto-run). JSONL log streams during run; **Download debug logs** saves `.jsonl`. Expandable per-operator details (`kind_counts`, `cleanup_actions`). **Rerun** (secondary) is the only control that resets dry-run state; Back or nav does not. Advance via **Review and execute migration** when all pass.
3. **Review and execute** — Point-of-no-return alerts; operator summary; three **required** acknowledgments (dry run reviewed, PONR / manual recovery, backup/recovery plan). **Start migration** (danger) disabled until all are checked and dry run passed.

After **Start migration**, the modal closes. Long-running work continues on the list: **Migration status** column + toasts.

**Prototype migration scenario** (banner control) only changes simulated outcomes when the user confirms migration—it does not auto-run migrations or toasts on page load.

## Outcome behavior (UX contract)

| Outcome | List label | User message | System behavior (expected backend) |
|---------|------------|--------------|-----------------------------------|
| **Success** | Migrated | Migrated to Next-Gen; version unchanged | Operator under OLMv1 management |
| **Failed (pre-PONR)** | Failed (rolled back) | Auto-rolled back to Classic | Per-operator rollback; bulk run continues |
| **Failed (post-PONR)** | Failed (manual action required) | Manual recovery may be required | No auto-rollback; CRD/data risk |
| **Error** | Error | Unexpected error | No partial management change |
| **Incomplete** | Incomplete | Did not finish cleanly | Review before retry |

Demo: **Cert Manager** simulates **failed_ponr** under preview scenarios; **Kiali Operator** simulates pre-PONR **failed** rollback.

## Manual rollback (post-success)

Two-step modal: warning → checkbox acknowledgment + type operator name → **Roll back operator** (danger).  
Distinct from **automatic rollback on migration failure** (no user confirmation).

## Related files

- `src/app/components/ecosystem/OlmOperatorMigrationModal.tsx`
- `src/app/components/ecosystem/olmMigrationDryRun.ts`
- `src/app/components/ecosystem/olmMigrationBackgroundRun.ts`
- `src/app/components/ecosystem/OlmOperatorRollbackModal.tsx`
- `src/app/components/ecosystem/olmMigrationEligibility.tsx`
- `src/app/components/ecosystem/olmMigrationRemediations.ts`
- `src/app/components/ecosystem/OlmMigrationStrategyNotice.tsx`
- `src/app/pages/ecosystem/InstalledOperatorsPage.tsx`
