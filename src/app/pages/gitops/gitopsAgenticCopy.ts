/**
 * GitOps agentic / OLS access copy (align with HPUX-2424 access-point patterns).
 * Agentic run links navigate to Agentic run details — not OpenShift Lightspeed chat.
 */

/** Primary link and kebab label for an existing agentic run on this resource (GITOPS-11005). */
export const GITOPS_VIEW_AGENTIC_RUN_LABEL = "View AI Recommendation";

/** Explains destination; pair with chat FAB for follow-up questions. */
export const GITOPS_VIEW_AGENTIC_RUN_TOOLTIP =
  "Opens the agentic run for this application: progress, diagnosis, evidence, and proposed remediation. Follow-up questions use OpenShift Lightspeed chat.";

/** Application detail info banner (GITOPS-11005 / tech preview). */
export const GITOPS_AI_REMEDIATION_BANNER_TITLE = "AI-assisted recommendation available";

export const GITOPS_AI_REMEDIATION_BANNER_BODY =
  "OpenShift Lightspeed analyzed this Application and published a remediation recommendation. Use View AI Recommendation to review diagnosis, evidence, and proposed next steps.";

export const GITOPS_AI_REMEDIATION_BANNER_DISCLAIMER =
  "This feature uses AI technology. Always review AI-generated recommendations before applying changes.";

/** Warning alert on detail stays problem-focused; AI entry is the info banner above. */
export const GITOPS_AGENTIC_RUN_ALERT_ACTION_HINT =
  "Use the AI-assisted recommendation banner above to review diagnosis and remediation options.";

/** Dashboard needs-attention table intro. */
export const GITOPS_AGENTIC_RUN_DASHBOARD_ATTENTION_HINT =
  "View AI Recommendation appears only when the Application has agentic remediation annotations. Filter the Applications list with AI remediation available to see the full set.";

/** Agentic run details → OLS chat (HPUX-2424 / HPUX-2287 exploratory). Does not replace View AI Recommendation. */
export const GITOPS_ASK_IN_LIGHTSPEED_LABEL = "Ask in OpenShift Lightspeed";

export const GITOPS_ASK_IN_LIGHTSPEED_TOOLTIP =
  "Opens OpenShift Lightspeed chat with context from this agentic run. Review the run details here first.";
