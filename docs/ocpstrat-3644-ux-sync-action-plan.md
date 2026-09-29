# OCPSTRAT-3644 UX sync — action plan (Sep 28, 2026)

**Meeting:** OCPSTRAT-3644 UX Sync (Kevin, Jon Jackson, Jackson Lee, Nolan Brubaker)  
**Prototype:** https://openshift-platform-prototype.vercel.app  
**Migration design doc:** https://docs.google.com/document/d/1PyYKTW1acSokVzi2jXwaYkUTieeDT2a_fDEeRpoLD2o/edit  
**Coexistence design doc:** https://docs.google.com/document/d/1cMpXzY45Q_Wdom8w_3CVU0GFg0jCcSfF9rtqBsVSce8/edit  

## Notes accuracy (Gemini summary)

| Topic | Summary claim | Assessment |
|-------|----------------|------------|
| Option B coexistence | Dedicated spaces / separate catalogs | **Accurate** — prototype uses separated Classic vs Next-Gen contexts; Software Catalog now also shows **unified operator list** with Classic sorted last (relevance). |
| Terminology | Use **Classic**, not “Legacy” in UI | **Accurate** — aligned in prototype labels (RH UX guideline). |
| Installed Operators MVP | **Tabbed** Classic / Next-Gen | **Accurate** — keep tabs for MVP; separate pages deferred. |
| Catalog | Single catalog, Classic at bottom, enabled by default | **In prototype** — unified operator packages + relevance sort; banner CTA deep-links to `?catalog=nextgen`; admin cluster toggle for disabling Classic is **future** (cluster setting). |
| Migration UI | Blocked pending OLM API/strategy | **Accurate** — prototype explores UX; info notice added; eng blocked on OLM team. |
| Data view / column mgmt | Jackson migrates IO table to DataView | **Accurate for eng** — prototype already uses `@patternfly/react-data-view` on Installed Operators; console-core migration is Jackson’s track. |

## Decisions to reflect in design docs + Jira

1. **Classic Operators** / **Next-Gen Operators** tab labels (no “Legacy” in UI).  
2. **Software Catalog:** unified operator packages; **Deprecated** badge on Classic (v0) tiles; relevance sort deprioritizes Classic.  
3. **Classic experience banner** on Classic ecosystem surfaces + link to Next-Gen catalog.  
4. **Installed Operators:** tabbed MVP; migration column + Actions menu remain **design exploration** until OLM defines migration.  
5. **Option B** navigation: separate catalog facets / tabs — not a single blended OperatorHub list with only a “deprecated” tag (Option A rejected).

## Owner matrix

| Action | Owner | Status |
|--------|--------|--------|
| Update coexistence + migration Google Docs; screenshots; Slack link | Kevin | **In progress** — migration doc updated; run `update_olm_coexistence_design_doc.py` for coexistence doc |
| Update Jira (HPUX-2188 family, HPUX-2193/2195, OCPSTRAT-3644/2692) | Kevin | **Partial** — refresh for Classic terminology + unified catalog |
| Migrate Installed Operators to DataView (console-core) | Jackson Lee | Eng — not prototype |
| Consult OLM on v0→v1 migration (CSV, ClusterExtension, wizard vs bulk) | Group + Jordan/Leo | **Blocking** migration implementation |
| Prototype UX alignment (terminology, banner, catalog sort, migration notice) | Kevin / UX | **Implemented** — banner deep-link `?catalog=nextgen`; catalog URL sync |

## Recommended next steps (Kevin)

1. **Slack:** Post links to updated migration doc + prototype `/ecosystem/installed-operators` and `/ecosystem/software-catalog`; ask for feedback on Classic banner and unified catalog sort.  
2. **Google Docs:** Append Sep 28 decisions to coexistence doc (`1cMpXzY…`); re-capture catalog unified view + Classic banner screenshots.  
3. **Jira:** Comment on **OCPSTRAT-2692** that UI is exploratory until OLM sync; link migration doc. Update **OCPSTRAT-3644** / **HPUX-2188** descriptions with Classic terminology + unified catalog note.  
4. **OLM sync:** Schedule with OLM — bring prototype flows (Actions migrate, status column, rollback) as **questions**, not commitments.  
5. **Push prototype** to Vercel after review of Classic banner copy with Jon/Jackson.

## Out of scope (prototype)

- Cluster admin setting to disable Classic catalog (discussed; post-MVP).  
- Console-core DataView migration (Jackson).  
- Production migration API or wizard implementation.
