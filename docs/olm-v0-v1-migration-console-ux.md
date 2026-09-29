# OLMv0 → OLMv1 console migration — engineering integration (prototype)

**STRAT:** [OCPSTRAT-2692](https://issues.redhat.com/browse/OCPSTRAT-2692)  
**Design / prototype:** [HPUX-2195](https://issues.redhat.com/browse/HPUX-2195)  
**Live path:** `/ecosystem/installed-operators` → **Classic Operators** tab

## Console touchpoints

| Location | Action | Component |
|----------|--------|-----------|
| Installed Operators list (Classic) | Primary **Migrate** | Opens select/confirm modal; on approve, modal closes and migration runs in background |
| Row selection + toolbar **Actions** | Bulk update / migrate | Dropdown beside pagination; items enabled from selection |
| Row kebab → **Migrate to Next-Gen Operators** | Single-operator path | Select/confirm only; progress on list |
| **Migration status** column | In-table progress | Queued / Migrating (spinner) / Failed (rolled back) / Error / Incomplete |
| Toast notifications | Per-operator + batch summary | Success, danger, warning variants |
| Row kebab → **View migration blockers** | Ineligible / conflict | Blockers panel + resolution links |
| Installed Operators list (Next-Gen Operators) | **Roll back to Classic Operators** | Double-confirmation rollback modal |

## Modal phases (migration)

1. **Select** — Eligibility table (eligible, ineligible, already migrated, conflict) with structured blockers  
2. **Confirm** — Single vs bulk copy; lists operators in bulk run  
3. **Blocked** — When selection cannot proceed (ineligible-only flow)

After **Confirm**, the modal closes immediately. Long-running work continues on the list: **Migration status** column + toasts.

**Prototype migration scenario** (banner control) only changes simulated outcomes when the user confirms a migration—it does not auto-run migrations or toasts on page load.

## Background run (list + toasts)

- **Queued** → **Migrating** (spinner) → outcome label on the row  
- Per-operator toast on each outcome; optional batch summary toast when n > 1  
- **Success** removes the row from Classic tab (operator moves to Next-Gen catalog management)  

## Outcome behavior (UX contract)

| Outcome | User message | System behavior (expected backend) | Next steps in UI |
|---------|--------------|-----------------------------------|------------------|
| **Success** | Migrated to OLMv1; version unchanged | Operator appears under OLMv1 management | Link to Operators tab / detail |
| **Failed** | Failed — automatically rolled back | Per-operator rollback; bulk run continues | View details, update, retry |
| **Error** | Unexpected error | No partial management change | Subscription / details |
| **Incomplete** | Did not finish | Operator may need manual review | Details, subscription, retry |
| **Skipped** | Not in run | Ineligible / already migrated | Blocker-specific links |

## Manual rollback (post-success)

Two-step modal: warning → checkbox acknowledgment + type operator name → **Roll back operator** (danger).  
Distinct from **automatic rollback on migration failure** (no user confirmation).

## Prototype demo data

Fixture operators simulate outcomes via `olmMigrationDemoResult` on eligible rows (e.g. Cert Manager → incomplete, Kiali → failed).

## Related files

- `src/app/components/ecosystem/OlmOperatorMigrationModal.tsx`
- `src/app/components/ecosystem/olmMigrationBackgroundRun.ts`
- `src/app/components/ecosystem/OlmOperatorRollbackModal.tsx`
- `src/app/components/ecosystem/olmMigrationEligibility.tsx`
- `src/app/components/ecosystem/olmMigrationRemediations.ts`
- `src/app/pages/ecosystem/InstalledOperatorsPage.tsx`
