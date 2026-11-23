export type LightspeedChatMode = "ask" | "troubleshooting";

export const LIGHTSPEED_CHAT_MODES: Record<
  LightspeedChatMode,
  { label: string; description: string; placeholder: string; barPlaceholder: string }
> = {
  ask: {
    label: "Chat",
    description: "Expert guidance and clear answers on OpenShift topics",
    placeholder: "Ask about deployments, best practices, or cluster tasks…",
    barPlaceholder: "Chat with OpenShift Lightspeed about this cluster…",
  },
  troubleshooting: {
    label: "Troubleshooting",
    description: "Diagnose issues and get step-by-step remediation",
    placeholder: "Describe the issue, error, or unexpected behavior…",
    barPlaceholder: "Describe an issue for OpenShift Lightspeed to troubleshoot…",
  },
};

export const LIGHTSPEED_BAR_PLACEHOLDER = "Ask OpenShift Lightspeed about this cluster…";

export const CHAT_PROMPTS = [
  "Show cluster health",
  "Check for updates",
  "How do I trigger a build?",
  "Explain Services vs Routes",
  "How do I scale a deployment?",
  "How do I expose an application?",
  "What is the cluster version?",
  "How do I create a project?",
  "Show operator status",
  "How do I view pod logs?",
  "What are network policies?",
  "How do I add storage?",
];

export const TROUBLESHOOT_PROMPTS = [
  "Why is a pod crash looping?",
  "Why is a pod pending?",
  "Why is a deployment not ready?",
  "Why is a route returning 503?",
  "Why is the cluster update blocked?",
  "How do I restore aws-creds?",
  "Why is an operator degraded?",
  "Why is a build failing?",
  "Why is a node NotReady?",
  "Why is image pull failing?",
  "Why is DNS failing in the cluster?",
  "Diagnose a failing workload",
];

/** Up to `limit` prompts for the active mode that contain the typed query. Empty query returns none. */
export function lightspeedPromptSuggestions(
  mode: LightspeedChatMode,
  query: string,
  limit = 5,
): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const source = mode === "troubleshooting" ? TROUBLESHOOT_PROMPTS : CHAT_PROMPTS;
  return source
    .filter((prompt) => prompt.toLowerCase().includes(needle))
    .sort((a, b) => {
      const aIndex = a.toLowerCase().indexOf(needle);
      const bIndex = b.toLowerCase().indexOf(needle);
      return aIndex - bIndex || a.length - b.length;
    })
    .slice(0, limit);
}
