/**
 * GitOps agentic / OLS access copy (align with HPUX-2424 access-point patterns).
 * Agentic run links navigate to Agentic run details — not OpenShift Lightspeed chat.
 */

/** Primary link and kebab label for an existing agentic run on this resource (GITOPS-11005). */
export const GITOPS_VIEW_AGENTIC_RUN_LABEL = "View AI Recommendation";

/** Explains destination; pair with chat FAB for follow-up questions. */
export const GITOPS_VIEW_AGENTIC_RUN_TOOLTIP =
  "Opens the agentic run for this application: progress, diagnosis, evidence, and proposed remediation. Follow-up questions use OpenShift Lightspeed chat.";

/** Shown on Application detail problem alerts (warning), not a separate info banner. */
export const GITOPS_AGENTIC_RUN_ALERT_ACTION_HINT =
  "Review evidence and proposed remediation on the agentic run details page. This does not open OpenShift Lightspeed chat.";

/** Dashboard needs-attention table intro. */
export const GITOPS_AGENTIC_RUN_DASHBOARD_ATTENTION_HINT =
  "View AI Recommendation appears only when the Application has agentic remediation annotations. Filter the Applications list with AI remediation available to see the full set.";

/** Agentic run details → OLS chat (HPUX-2424 / HPUX-2287 exploratory). Does not replace View AI Recommendation. */
export const GITOPS_ASK_IN_LIGHTSPEED_LABEL = "Ask in OpenShift Lightspeed";

export const GITOPS_ASK_IN_LIGHTSPEED_TOOLTIP =
  "Opens OpenShift Lightspeed chat with context from this agentic run. Review the run details here first.";
