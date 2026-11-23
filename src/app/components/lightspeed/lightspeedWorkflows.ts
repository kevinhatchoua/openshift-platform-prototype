export type LightspeedWorkflowResponse = {
  content: string;
  suggestions: string[];
  tools?: string[];
  sources?: Array<{ title: string; href: string }>;
  navigate?: string;
};

type Workflow = {
  when: (query: string) => boolean;
  response: LightspeedWorkflowResponse;
};

const DOC = "https://docs.openshift.com/container-platform/latest";

function source(title: string, href: string) {
  return [{ title, href }];
}

const WORKFLOWS: Workflow[] = [
  {
    when: (q) => q.includes("policies that deny") || q.includes("deny ingress"),
    response: {
      content:
        `**NetworkPolicies denying ingress**\n\n` +
        `On this cluster, two policies drop ingress before the Route is involved:\n\n` +
        `• **frontend-deny-all** in \`prod-frontend\` denies every ingress except pods labeled \`app=frontend\`.\n` +
        `• **api-allow-gateway** in \`prod-api\` allows ingress only from \`app=gateway\` on port 8080.\n\n` +
        `A 503 from the router usually means the Service has no ready endpoints. A timeout from inside the cluster usually means a NetworkPolicy dropped the packet.\n\n` +
        `**Next check:** \`oc describe networkpolicy frontend-deny-all -n prod-frontend\``,
      suggestions: ["What are network policies?", "Why is a route returning 503?", "Open NetworkPolicies"],
      tools: ["oc get networkpolicy -A"],
      sources: source("About network policy", `${DOC}/networking/network_policy/about-network-policy.html`),
      navigate: "/networking/networkpolicies",
    },
  },
  {
    when: (q) => q.includes("open networkpolicies"),
    response: {
      content:
        `**NetworkPolicies**\n\n` +
        `Opened **Networking**, **NetworkPolicies**. Review \`frontend-deny-all\` and \`api-allow-gateway\` before you add another allow rule.`,
      suggestions: ["What are network policies?", "Show policies that deny ingress"],
      navigate: "/networking/networkpolicies",
    },
  },
  {
    when: (q) => q.includes("network polic"),
    response: {
      content:
        `**Network policies on this cluster**\n\n` +
        `A NetworkPolicy selects pods and states which traffic may reach them. With no policy, pods accept traffic. After the first policy selects a pod, everything else to that pod is denied.\n\n` +
        `**What I see**\n` +
        `• \`prod-frontend\` has **frontend-deny-all** (ingress limited to the frontend app label).\n` +
        `• \`prod-api\` has **api-allow-gateway** (only the gateway may call port 8080).\n` +
        `• \`openshift-*\` namespaces are managed by the platform and are not a place to add app policies.\n\n` +
        `**How to add one**\n` +
        `1. Open **Networking**, then **NetworkPolicies**.\n` +
        `2. Pick the application namespace, not a platform namespace.\n` +
        `3. Select the app pods by label, then allow only the ports and namespaces that should call them.\n\n` +
        `Policies do not replace Routes. A Route publishes the app. A NetworkPolicy decides who can talk to the pods.`,
      suggestions: ["Show policies that deny ingress", "How do I expose an application?", "Open NetworkPolicies"],
      tools: ["oc get networkpolicy -A"],
      sources: source("About network policy", `${DOC}/networking/network_policy/about-network-policy.html`),
      navigate: "/networking/networkpolicies",
    },
  },
  {
    when: (q) => q.includes("increase the memory limit") || q.includes("memory limit"),
    response: {
      content:
        `**Raise the memory limit for prometheus-adapter**\n\n` +
        `The container is OOMKilled at **256Mi**. A limit of **512Mi** matches the last hour of usage.\n\n` +
        `\`\`\`bash\noc set resources deployment prometheus-adapter -n openshift-monitoring --limits=memory=512Mi\n\`\`\`\n\n` +
        `This is guidance. I will not change the Deployment from chat. After the rollout, the crash loop should stop and the restart count should stay flat.`,
      suggestions: ["Why is a pod crash looping?", "How do I view pod logs?"],
      tools: ["oc set resources deployment prometheus-adapter -n openshift-monitoring --limits=memory=512Mi"],
    },
  },
  {
    when: (q) => q.includes("crash loop") || q.includes("crashloop"),
    response: {
      content:
        `**Pod crash loop**\n\n` +
        `**Pod:** \`prometheus-adapter-6b8f7d5c9-k2x8m\`\n` +
        `**Namespace:** openshift-monitoring\n` +
        `**Restarts:** 4 in the last hour\n` +
        `**Last termination:** OOMKilled, limit 256Mi\n\n` +
        `The process starts, exceeds its memory limit, and kubelet restarts it. That is a crash loop, not a scheduling problem.\n\n` +
        `**What to do**\n` +
        `1. Read the previous container log (not only the current one).\n` +
        `2. Raise the memory limit to 512Mi.\n` +
        `3. Wait for the new pod to stay Running with 0 new restarts.\n\n` +
        `If the previous log shows a config error instead of OOM, fix that before you add memory.`,
      suggestions: ["Increase the memory limit", "How do I view pod logs?", "Show the crashlooping pod"],
      tools: ["oc logs prometheus-adapter-6b8f7d5c9-k2x8m -n openshift-monitoring --previous"],
      sources: source("Pod troubleshooting", `${DOC}/support/troubleshooting/investigating-pod-issues.html`),
      navigate: "/workloads/pods",
    },
  },
  {
    when: (q) => q.includes("reduce the memory request"),
    response: {
      content:
        `**Lower the pending pod memory request**\n\n` +
        `\`data-processor-batch\` requests **4Gi**. The freest worker has **3.2Gi** allocatable. Drop the request to **2Gi** if the job can run in that budget.\n\n` +
        `\`\`\`bash\noc set resources deployment data-processor-batch -n data-pipeline --requests=memory=2Gi\n\`\`\`\n\n` +
        `The pod should leave Pending once a node can satisfy the request. I will not edit the Deployment from chat.`,
      suggestions: ["Why is a pod pending?", "Show pending pod events"],
    },
  },
  {
    when: (q) => q.includes("pending pod events") || q.includes("show pending"),
    response: {
      content:
        `**Pending pod events**\n\n` +
        `\`data-processor-batch-7f8d9-xk2mn\` in \`data-pipeline\`, pending 12 minutes.\n\n` +
        `• FailedScheduling: 0/8 nodes available. 5 insufficient memory, 3 untolerated taint \`node-role.kubernetes.io/master\`.\n` +
        `• No PVC or image error is recorded.\n\n` +
        `This is a fit problem. Reduce the memory request or free a worker.`,
      suggestions: ["Reduce the memory request", "Why is a node NotReady?"],
      tools: ["oc describe pod data-processor-batch-7f8d9-xk2mn -n data-pipeline"],
    },
  },
  {
    when: (q) => q.includes("pod pending") || q.includes("pending pod") || (q.includes("pod") && q.includes("pending")),
    response: {
      content:
        `**Why this pod is Pending**\n\n` +
        `**Pod:** \`data-processor-batch-7f8d9-xk2mn\`\n` +
        `**Namespace:** data-pipeline\n` +
        `**Reason:** Insufficient memory. It requests 4Gi and the largest free worker has 3.2Gi.\n\n` +
        `Control plane nodes are tainted, so they are not candidates.\n\n` +
        `**Options**\n` +
        `1. Lower the memory request to 2Gi.\n` +
        `2. Free memory by scaling an idle workload to 0.\n` +
        `3. Add a worker if this job must keep a 4Gi request.`,
      suggestions: ["Reduce the memory request", "Show pending pod events", "Why is a node NotReady?"],
      tools: ["oc describe pod -n data-pipeline -l app=data-processor-batch"],
      navigate: "/workloads/pods",
    },
  },
  {
    when: (q) => q.includes("readiness probe"),
    response: {
      content:
        `**Readiness probe on frontend**\n\n` +
        `\`frontend\` in \`prod-frontend\` probes \`GET /healthz\` on port 8080. The probe times out at 1s while the app answers in about 2s under load.\n\n` +
        `The Deployment stays unavailable because ready replicas stay at 0. The pods are Running, not crashing.\n\n` +
        `**Change**\n` +
        `Set \`timeoutSeconds: 5\` and \`periodSeconds: 10\` on the readiness probe, then wait for the rollout.\n\n` +
        `Do not remove the probe. Without it, the Service will send traffic to pods that are not ready.`,
      suggestions: ["Why is a deployment not ready?", "Show deployment conditions"],
    },
  },
  {
    when: (q) => q.includes("deployment conditions") || q.includes("show deployment"),
    response: {
      content:
        `**Deployment conditions: frontend**\n\n` +
        `• Available: False. 0 of 2 replicas ready.\n` +
        `• Progressing: True. ReplicaSet \`frontend-7c9f8\` is waiting on readiness.\n` +
        `• ReplicaFailure: False.\n\n` +
        `Pods are Running. The readiness probe is failing, so the Deployment never becomes available.`,
      suggestions: ["Check the readiness probe", "Why is a deployment not ready?"],
      tools: ["oc describe deployment frontend -n prod-frontend"],
    },
  },
  {
    when: (q) => q.includes("deployment") && q.includes("not ready"),
    response: {
      content:
        `**Deployment not ready**\n\n` +
        `**Deployment:** \`frontend\` in \`prod-frontend\`\n` +
        `**Desired:** 2. **Ready:** 0.\n\n` +
        `Pods are scheduled and Running. They fail the readiness probe \`GET /healthz\`, so the Service has no endpoints and the Route can return 503.\n\n` +
        `This is not a crash loop. Check the probe timeout first, then the pod log if /healthz itself is erroring.`,
      suggestions: ["Check the readiness probe", "Show deployment conditions", "Why is a route returning 503?"],
      tools: ["oc get deploy frontend -n prod-frontend", "oc describe deploy frontend -n prod-frontend"],
      navigate: "/workloads/deployments",
    },
  },
  {
    when: (q) => q.includes("service endpoints") || q.includes("check service"),
    response: {
      content:
        `**Service endpoints for frontend**\n\n` +
        `Service \`frontend\` in \`prod-frontend\` selects \`app=frontend\` on port 8080.\n\n` +
        `**Endpoints:** none. Both pods fail readiness, so they are not added.\n\n` +
        `The Route is configured. Traffic has nowhere to go until a pod becomes Ready. Fix the readiness probe, then recheck endpoints.`,
      suggestions: ["Why is a route returning 503?", "Check the readiness probe"],
      tools: ["oc get endpoints frontend -n prod-frontend"],
    },
  },
  {
    when: (q) => q.includes("503") || q.includes("route returning"),
    response: {
      content:
        `**Route returns 503**\n\n` +
        `**Route:** \`frontend\` in \`prod-frontend\`\n` +
        `**Host:** frontend.apps.cluster.example.com\n` +
        `**Service:** frontend:8080\n\n` +
        `The router is healthy. The Service has **no ready endpoints**, so the router answers 503.\n\n` +
        `**Cause:** Deployment \`frontend\` has 0 ready replicas because the readiness probe is failing.\n\n` +
        `A NetworkPolicy is not the first suspect here. Empty endpoints explain the 503.`,
      suggestions: ["Check Service endpoints", "Why is a deployment not ready?", "Explain Services vs Routes"],
      tools: ["oc get route frontend -n prod-frontend", "oc get endpoints frontend -n prod-frontend"],
      sources: source("Route configuration", `${DOC}/networking/routes/route-configuration.html`),
      navigate: "/networking/routes",
    },
  },
  {
    when: (q) => q.includes("show available updates") || q.includes("available updates"),
    response: {
      content:
        `**Available updates**\n\n` +
        `Channel **stable-5.0**.\n\n` +
        `• **5.0 patch:** recommended, still gated by release acceptance.\n` +
        `• **5.1.0:** listed, blocked while ClusterVersion Upgradeable=False.\n\n` +
        `Do not start 5.1 until the credentials secret is restored. Patch updates on 5.0 can continue after preflight.`,
      suggestions: ["Why is the cluster update blocked?", "How do I restore aws-creds?", "What is the cluster version?"],
      navigate: "/administration/cluster-settings",
    },
  },
  {
    when: (q) => q.includes("check for updates") || q.includes("assess readiness"),
    response: {
      content:
        `**Update check**\n\n` +
        `I opened Cluster Settings. This cluster is on the current 5.0 release.\n\n` +
        `• A **5.0 patch** is available.\n` +
        `• **5.1** is visible but **blocked**. Upgradeable=False because the cloud credentials secret is missing.\n` +
        `• **machine-config** is Degraded, which also belongs in the preflight.\n\n` +
        `Run preflight before you start anything. An update cannot be rolled back from the console.`,
      suggestions: ["Why is the cluster update blocked?", "Show available updates", "Why is an operator degraded?"],
      tools: ["oc get clusterversion", "oc get co"],
      navigate: "/administration/cluster-settings",
    },
  },
  {
    when: (q) => q.includes("aws-creds") || q.includes("credentials secret"),
    response: {
      content:
        `**Restore the credentials secret**\n\n` +
        `5.1 stays blocked until the cloud credentials secret is restored in kube-system.\n\n` +
        `1. Confirm it is missing: \`oc get secret aws-creds -n kube-system\`\n` +
        `2. Restore it from your installer credentials or the cloud credential operator.\n` +
        `3. Recheck ClusterVersion. Upgradeable should return to True before you choose 5.1.\n\n` +
        `I cannot restore the secret from chat.`,
      suggestions: ["Why is the cluster update blocked?", "Check for updates", "What is the cluster version?"],
      tools: ["oc get secret aws-creds -n kube-system"],
    },
  },
  {
    when: (q) => (q.includes("update") && q.includes("blocked")) || q.includes("why is 5.1"),
    response: {
      content:
        `**Cluster update is blocked**\n\n` +
        `ClusterVersion is Available, but **Upgradeable=False**.\n\n` +
        `The gate is the missing cloud credentials secret used by the cluster. Until it is restored, 5.1 stays blocked. 5.0 patches can still be evaluated.\n\n` +
        `**machine-config** is also Degraded (registry auth and OS image stream lookup). Treat that as a second preflight item, not the reason 5.1 is hidden.`,
      suggestions: ["How do I restore aws-creds?", "Check for updates", "Why is an operator degraded?"],
      tools: ["oc get clusterversion -o jsonpath='{.status.conditions}'"],
      navigate: "/administration/cluster-update",
    },
  },
  {
    when: (q) => q.includes("show failing builds") || q.includes("failing builds"),
    response: {
      content:
        `**Failing builds**\n\n` +
        `• \`checkout-build-1\` in \`ci\`: CloneFailed. The source secret \`github-credentials\` is missing.\n` +
        `• Other recent builds in \`ci\` completed.\n\n` +
        `Restore the source secret, then start a new build. Retrying the failed build reuses the same missing secret.`,
      suggestions: ["How do I trigger a build?", "Start a build from the console"],
      navigate: "/builds",
    },
  },
  {
    when: (q) => q.includes("build failing") || q.includes("build fail"),
    response: {
      content:
        `**Why the build is failing**\n\n` +
        `**Build:** \`checkout-build-1\` in \`ci\`\n` +
        `**Phase:** Failed\n` +
        `**Reason:** CloneFailed. \`github-credentials\` was not found.\n\n` +
        `The build has not reached compile or image push. Fix the source secret, then start a new build from the BuildConfig.`,
      suggestions: ["Show failing builds", "How do I trigger a build?", "How do I view pod logs?"],
      tools: ["oc logs build/checkout-build-1 -n ci"],
      navigate: "/builds",
    },
  },
  {
    when: (q) => q.includes("start a build"),
    response: {
      content:
        `**Start a build**\n\n` +
        `Opened **Builds**. For \`checkout\` in \`ci\`, use **Start build** on the BuildConfig.\n\n` +
        `Do that only after \`github-credentials\` exists. Otherwise the new build fails at clone again.\n\n` +
        `\`\`\`bash\noc start-build checkout -n ci\n\`\`\``,
      suggestions: ["Why is a build failing?", "Show failing builds"],
      navigate: "/builds",
    },
  },
  {
    when: (q) => q.includes("trigger a build"),
    response: {
      content:
        `**Trigger a build**\n\n` +
        `**From the console:** Builds, open the BuildConfig, **Start build**.\n\n` +
        `**From the CLI:** \`oc start-build <name> -n <namespace>\`\n\n` +
        `**Automatic triggers** on this cluster:\n` +
        `• Config change (a new BuildConfig commit).\n` +
        `• Image change, if an image change trigger is set.\n` +
        `• Webhook, if a generic or GitHub webhook secret is set.\n\n` +
        `\`checkout\` in \`ci\` is manual today. The last run failed at git clone, so a new start will fail the same way until the source secret is restored.`,
      suggestions: ["Start a build from the console", "Why is a build failing?", "Show failing builds"],
      sources: source("Triggering builds", `${DOC}/cicd/builds/triggering-builds-build-hooks.html`),
      navigate: "/builds",
    },
  },
  {
    when: (q) => q.includes("compare route") || q.includes("route and ingress"),
    response: {
      content:
        `**Route and Ingress**\n\n` +
        `Both publish an in-cluster Service outside the cluster.\n\n` +
        `• **Route** is the OpenShift API. It supports edge, passthrough, and reencrypt TLS on the default ingress controller.\n` +
        `• **Ingress** is the Kubernetes API. On OpenShift it is implemented by a Route.\n\n` +
        `Use a Route unless you are moving a Kubernetes Ingress manifest as-is. Neither object selects pods. The Service does that.`,
      suggestions: ["Explain Services vs Routes", "How do I expose an application?"],
    },
  },
  {
    when: (q) => q.includes("services vs routes") || q.includes("explain services"),
    response: {
      content:
        `**Services and Routes**\n\n` +
        `They solve different problems.\n\n` +
        `• A **Service** gives pods a stable in-cluster address and selects ready pods by label.\n` +
        `• A **Route** publishes that Service on the cluster ingress domain so clients outside the cluster can reach it.\n\n` +
        `**On this cluster**\n` +
        `Service \`frontend\` in \`prod-frontend\` targets port 8080. Route \`frontend\` points at that Service. The Route is admitted, but the Service has no ready endpoints, so callers get 503.\n\n` +
        `Create the Service first, confirm endpoints, then add the Route.`,
      suggestions: ["How do I expose an application?", "Compare Route and Ingress", "What are network policies?"],
      sources: source("Routes", `${DOC}/networking/routes/route-configuration.html`),
      navigate: "/networking/routes",
    },
  },
  {
    when: (q) => q.includes("scale frontend") || q.includes("3 replicas"),
    response: {
      content:
        `**Scale frontend to 3**\n\n` +
        `Current desired count is **2**, ready **0** because of the readiness probe. Scaling to 3 adds another unready pod. It does not fix the probe.\n\n` +
        `Fix readiness first. Then:\n\n` +
        `\`\`\`bash\noc scale deployment frontend -n prod-frontend --replicas=3\n\`\`\`\n\n` +
        `I will not scale it from chat while ready replicas are 0.`,
      suggestions: ["Show current replica count", "Why is a deployment not ready?"],
    },
  },
  {
    when: (q) => q.includes("replica count") || q.includes("current replica"),
    response: {
      content:
        `**Replica count**\n\n` +
        `• \`frontend\` (prod-frontend): desired 2, ready 0, available 0.\n` +
        `• \`nginx-deployment\` (prod-frontend): desired 3, ready 3.\n` +
        `• \`data-processor-batch\` (data-pipeline): desired 1, ready 0, pending.\n\n` +
        `Only \`frontend\` is Running but not ready.`,
      suggestions: ["How do I scale a deployment?", "Why is a deployment not ready?"],
      tools: ["oc get deploy -A"],
    },
  },
  {
    when: (q) => q.includes("scale a deployment") || q.includes("scale deployment"),
    response: {
      content:
        `**Scale a Deployment**\n\n` +
        `**Console:** Workloads, Deployments, open the Deployment, edit the replica count.\n\n` +
        `**CLI:** \`oc scale deployment <name> -n <namespace> --replicas=<n>\`\n\n` +
        `\`frontend\` is desired 2 and ready 0. Raising the count will not make it available. Fix the readiness probe, then scale.\n\n` +
        `For traffic spikes, a HorizontalPodAutoscaler is a better fit than a one-time scale.`,
      suggestions: ["Scale frontend to 3 replicas", "Show current replica count", "Why is a deployment not ready?"],
      navigate: "/workloads/deployments",
    },
  },
  {
    when: (q) => q.includes("create a route"),
    response: {
      content:
        `**Create a Route for frontend**\n\n` +
        `A Route named \`frontend\` already targets Service \`frontend\` in \`prod-frontend\`. Creating a second Route will not fix the 503.\n\n` +
        `Opened **Routes** so you can confirm the host and TLS setting. Make the Deployment ready before you change the Route.`,
      suggestions: ["Why is a route returning 503?", "Explain Services vs Routes"],
      navigate: "/networking/routes",
    },
  },
  {
    when: (q) => q.includes("expose an application") || q.includes("expose"),
    response: {
      content:
        `**Expose an application**\n\n` +
        `1. The Deployment pods need a stable label, for example \`app=frontend\`.\n` +
        `2. Create a Service that selects that label and the container port.\n` +
        `3. Create a Route to the Service when clients are outside the cluster.\n` +
        `4. Confirm the Service has endpoints. An admitted Route with no endpoints returns 503.\n\n` +
        `\`frontend\` already has a Service and a Route. Endpoints are empty because the readiness probe is failing.\n\n` +
        `\`\`\`bash\noc expose service frontend -n prod-frontend\n\`\`\``,
      suggestions: ["Create a Route for the frontend", "Explain Services vs Routes", "Why is a route returning 503?"],
      sources: source("Exposing a service", `${DOC}/networking/routes/route-configuration.html`),
      navigate: "/networking/routes",
    },
  },
  {
    when: (q) => q.includes("cluster version") || q.includes("what version"),
    response: {
      content:
        `**Cluster version**\n\n` +
        `• **Installed:** current 5.0 release on channel stable-5.0.\n` +
        `• **ClusterVersion:** Available=True, Failing=False, Upgradeable=False.\n` +
        `• **Upgradeable message:** cloud credentials secret is missing, so 5.1 is blocked.\n\n` +
        `Opened Cluster Settings for the same status the console shows administrators.`,
      suggestions: ["Check for updates", "Why is the cluster update blocked?"],
      tools: ["oc get clusterversion"],
      navigate: "/administration/cluster-settings",
    },
  },
  {
    when: (q) => q.includes("create the demo project") || q.includes("demo project"),
    response: {
      content:
        `**Create a project**\n\n` +
        `Projects are namespaces with OpenShift metadata.\n\n` +
        `**Console:** Home, Projects, **Create Project**. Name it \`demo\`, display name optional.\n\n` +
        `**CLI:** \`oc new-project demo\`\n\n` +
        `I will not create it from chat. After it exists, deploy the app there, then add a Service and Route.`,
      suggestions: ["How do I create a project?", "How do I expose an application?"],
      navigate: "/home/projects",
    },
  },
  {
    when: (q) => q.includes("create a project"),
    response: {
      content:
        `**Create a project**\n\n` +
        `1. Open **Home**, **Projects**.\n` +
        `2. Choose **Create Project**.\n` +
        `3. Set the name (lowercase, DNS-1123). That name is the namespace.\n` +
        `4. Create workloads in that project so they stay off \`openshift-*\` namespaces.\n\n` +
        `You need permission to create project requests. Cluster admins can also run \`oc new-project <name>\`.`,
      suggestions: ["Create the demo project", "How do I expose an application?"],
      navigate: "/home/projects",
    },
  },
  {
    when: (q) => q.includes("degraded operator") || q.includes("operator degraded") || q.includes("operator status") || q.includes("operator health"),
    response: {
      content:
        `**Operator status**\n\n` +
        `**Degraded:** machine-config.\n` +
        `Available=True, Progressing=False, Degraded=True.\n\n` +
        `The controller cannot read the release image stream it expects:\n` +
        `• Registry authentication is required for the lightspeed image stream.\n` +
        `• The RHEL 10 default OS image stream is not in the list it loaded (it sees rhel-9).\n\n` +
        `Other cluster operators are Available and not Degraded. This does not by itself CrashLoop app pods, but it does block a clean update preflight.`,
      suggestions: ["Show degraded operators", "Why is the cluster update blocked?", "Open Installed Operators"],
      tools: ["oc get co", "oc describe co machine-config"],
      navigate: "/ecosystem/installed-operators",
    },
  },
  {
    when: (q) => q.includes("installed operators") || q.includes("open installed"),
    response: {
      content:
        `**Installed Operators**\n\n` +
        `Opened the Installed Operators list. Platform operators such as machine-config are on the cluster operator status, not only in this catalog list.\n\n` +
        `Use this page for OLMv0 and OLMv1 operands. Use **Why is an operator degraded?** for machine-config.`,
      suggestions: ["Why is an operator degraded?", "Show operator status"],
      navigate: "/ecosystem/installed-operators",
    },
  },
  {
    when: (q) => q.includes("filter logs"),
    response: {
      content:
        `**Error lines from the previous adapter log**\n\n` +
        `\`\`\`\nFatal: runtime: out of memory\ncontainer prometheus-adapter exceeded memory limit 256Mi\n\`\`\`\n\n` +
        `No application exception is present. The kubelet killed the process. Raising the limit is the next step, not a config change.`,
      suggestions: ["Increase the memory limit", "How do I view pod logs?"],
    },
  },
  {
    when: (q) => q.includes("tail the") || q.includes("pod log") || q.includes("view pod logs"),
    response: {
      content:
        `**Pod logs**\n\n` +
        `Opened **Workloads**, **Pods**. For the crash-looping adapter, read the **previous** container. The current container may still be starting.\n\n` +
        `\`\`\`bash\noc logs prometheus-adapter-6b8f7d5c9-k2x8m -n openshift-monitoring --previous\n\`\`\`\n\n` +
        `The previous log ends in an out-of-memory kill at 256Mi.`,
      suggestions: ["Filter logs for errors", "Why is a pod crash looping?", "Increase the memory limit"],
      tools: ["oc logs -n openshift-monitoring deploy/prometheus-adapter --previous"],
      navigate: "/workloads/pods",
    },
  },
  {
    when: (q) => q.includes("storage class"),
    response: {
      content:
        `**Storage classes**\n\n` +
        `• **gp3-csi** (default). Used by new PVCs when you do not name a class.\n` +
        `• **gp2-csi**. Older class, still bound by two existing claims.\n\n` +
        `Create application PVCs with gp3-csi unless a workload requires the older class.`,
      suggestions: ["Create a PVC", "How do I add storage?"],
      navigate: "/storage",
    },
  },
  {
    when: (q) => q.includes("create a pvc") || q.includes("add storage"),
    response: {
      content:
        `**Add storage**\n\n` +
        `1. Open **Storage**.\n` +
        `2. Create a PersistentVolumeClaim in the app namespace.\n` +
        `3. Request a size and the default class **gp3-csi**.\n` +
        `4. Mount the claim in the Deployment volume list.\n\n` +
        `A Pending pod on this cluster is waiting on memory, not on a volume. Adding a PVC will not schedule \`data-processor-batch\`.\n\n` +
        `\`\`\`yaml\nkind: PersistentVolumeClaim\nspec:\n  accessModes: [ReadWriteOnce]\n  storageClassName: gp3-csi\n  resources:\n    requests:\n      storage: 10Gi\n\`\`\``,
      suggestions: ["Show storage classes", "Create a PVC", "Why is a pod pending?"],
      sources: source("Persistent storage", `${DOC}/storage/understanding-persistent-storage.html`),
      navigate: "/storage",
    },
  },
  {
    when: (q) => q.includes("pull secret"),
    response: {
      content:
        `**Image pull secret**\n\n` +
        `\`payments-api\` in \`payments\` fails with ImagePullBackOff. The pod spec references secret \`registry-pull\`, and that secret is missing in the namespace.\n\n` +
        `1. Recreate \`registry-pull\` as a \`kubernetes.io/dockerconfigjson\` secret in \`payments\`.\n` +
        `2. Confirm the ServiceAccount \`deployer\` mounts it, or set \`imagePullSecrets\` on the pod template.\n` +
        `3. Delete the pod so the new pull is attempted.\n\n` +
        `I cannot create the secret from chat.`,
      suggestions: ["Why is image pull failing?", "Show ImagePullBackOff pods"],
    },
  },
  {
    when: (q) => q.includes("imagepullbackoff") || q.includes("image pull"),
    response: {
      content:
        `**Image pull is failing**\n\n` +
        `**Pod:** \`payments-api-6f8d9c-abc12\` in \`payments\`\n` +
        `**Status:** ImagePullBackOff\n` +
        `**Image:** registry.example.com/payments-api:1.4.2\n` +
        `**Reason:** secret \`registry-pull\` not found.\n\n` +
        `The image name is valid. The node cannot authenticate. This is not a crash loop and not a readiness failure.`,
      suggestions: ["Check the pull secret", "Show ImagePullBackOff pods", "How do I view pod logs?"],
      tools: ["oc describe pod -n payments -l app=payments-api"],
      navigate: "/workloads/pods",
    },
  },
  {
    when: (q) => q.includes("cordon"),
    response: {
      content:
        `**Cordon worker-node-03**\n\n` +
        `The node is already NotReady, so the scheduler is not placing new pods there. Cordoning is still useful so it stays unschedulable after kubelet returns.\n\n` +
        `\`\`\`bash\noc adm cordon worker-node-03\n\`\`\`\n\n` +
        `Do not drain it until you know which pods still report the node as their host. I will not cordon from chat.`,
      suggestions: ["Show node conditions", "Why is a node NotReady?"],
    },
  },
  {
    when: (q) => q.includes("node conditions") || q.includes("node status") || q.includes("detailed node"),
    response: {
      content:
        `**Node conditions**\n\n` +
        `• **worker-node-03:** Ready=False, reason KubeletNotReady, last heartbeat 9 minutes ago. MemoryPressure=True before the heartbeat stopped.\n` +
        `• Other workers and all control plane nodes: Ready=True.\n\n` +
        `Pods already on worker-node-03 stay unknown until the kubelet heartbeats again. Pending pods are a separate memory-fit issue on the remaining nodes.`,
      suggestions: ["Why is a node NotReady?", "Cordon the NotReady node", "Why is a pod pending?"],
      tools: ["oc get nodes", "oc describe node worker-node-03"],
      navigate: "/compute",
    },
  },
  {
    when: (q) => q.includes("notready") || q.includes("not ready node") || (q.includes("node") && q.includes("not ready")),
    response: {
      content:
        `**Node NotReady**\n\n` +
        `**Node:** worker-node-03\n` +
        `**Condition:** Ready=False for 9 minutes\n` +
        `**Reason:** KubeletNotReady. The last heartbeat stopped after MemoryPressure=True at 92%.\n\n` +
        `**What this does**\n` +
        `• New pods are not scheduled there.\n` +
        `• Existing pods are not deleted yet.\n\n` +
        `**What to do**\n` +
        `1. Check whether the node still answers on the machine network.\n` +
        `2. If kubelet is wedged, restart it on the host.\n` +
        `3. Cordon it so a later Ready does not immediately accept pods.\n\n` +
        `This node is not why \`data-processor-batch\` is Pending. That pod does not fit the memory left on the Ready workers.`,
      suggestions: ["Show node conditions", "Cordon the NotReady node", "Why is a pod pending?"],
      tools: ["oc describe node worker-node-03"],
      navigate: "/compute",
    },
  },
  {
    when: (q) => q.includes("name resolution") || q.includes("test name"),
    response: {
      content:
        `**Name resolution test**\n\n` +
        `From a debug pod:\n\n` +
        `\`\`\`bash\noc debug pod/frontend-7c9f8-aaa -n prod-frontend\nnslookup kubernetes.default\nnslookup frontend.prod-frontend.svc\n\`\`\`\n\n` +
        `On this cluster both names resolve. DNS pods are Running. If an app still fails lookup, the error is in that pod's \`dnsPolicy\` or a NetworkPolicy, not in the default CoreDNS service.`,
      suggestions: ["Check DNS pods", "What are network policies?"],
    },
  },
  {
    when: (q) => q.includes("dns pod") || q.includes("check dns") || (q.includes("dns") && q.includes("fail")),
    response: {
      content:
        `**DNS in the cluster**\n\n` +
        `**Pods:** \`dns-default\` in \`openshift-dns\`, 2 replicas, both Ready.\n` +
        `**Service:** \`dns-default\` ClusterIP is set. CoreDNS is not crash looping.\n\n` +
        `I do not see a cluster-wide DNS outage. A single app that cannot resolve names is more likely a NetworkPolicy, a bad search domain, or \`dnsPolicy: None\`.\n\n` +
        `The frontend 503 is empty Service endpoints, not DNS.`,
      suggestions: ["Test name resolution", "Check DNS pods", "Why is a route returning 503?"],
      tools: ["oc get pods -n openshift-dns", "oc get svc dns-default -n openshift-dns"],
    },
  },
  {
    when: (q) => q.includes("restart the failing"),
    response: {
      content:
        `**Restart the failing Deployment**\n\n` +
        `Restarting \`frontend\` recycles pods that fail readiness. It does not change the probe, so the new pods fail the same way.\n\n` +
        `Change the readiness timeout first. Use a restart only after that rollout:\n\n` +
        `\`\`\`bash\noc rollout restart deployment frontend -n prod-frontend\n\`\`\`\n\n` +
        `I will not restart it from chat.`,
      suggestions: ["Check the readiness probe", "Why is a deployment not ready?"],
    },
  },
  {
    when: (q) => q.includes("diagnose") || q.includes("failing workload"),
    response: {
      content:
        `**Failing workloads**\n\n` +
        `Three different failures are active. They are not one incident.\n\n` +
        `1. **prometheus-adapter** (openshift-monitoring) is crash looping. OOMKilled at 256Mi.\n` +
        `2. **frontend** (prod-frontend) is Running but not ready. The readiness probe times out, so the Route returns 503.\n` +
        `3. **payments-api** (payments) is ImagePullBackOff. Secret \`registry-pull\` is missing.\n\n` +
        `**Order:** pull secret (no running app), then frontend probe (user-facing 503), then adapter memory (monitoring).`,
      suggestions: ["Why is a pod crash looping?", "Why is a deployment not ready?", "Why is image pull failing?"],
      tools: ["oc get pods -A --field-selector=status.phase!=Running"],
      navigate: "/workloads/pods",
    },
  },
  {
    when: (q) => q.includes("view alerts") || q.includes("active alert"),
    response: {
      content:
        `**Active alerts**\n\n` +
        `• **ClusterNotUpgradeable** (warning). Credentials secret missing. Blocks 5.1.\n` +
        `• **ClusterOperatorDegraded** (critical). machine-config.\n` +
        `• **KubePodCrashLooping** (warning). prometheus-adapter.\n` +
        `• **KubeNodeNotReady** (warning). worker-node-03.\n\n` +
        `No firing alert is the direct cause of the frontend 503. That one shows up as unavailable replicas, not as a page-level alert.`,
      suggestions: ["Why is the cluster update blocked?", "Why is an operator degraded?", "Why is a pod crash looping?"],
    },
  },
  {
    when: (q) => q.includes("cluster health") || q.includes("show cluster health"),
    response: {
      content:
        `**Cluster health**\n\n` +
        `**Control plane:** 3 nodes Ready. API, etcd, and DNS are up.\n\n` +
        `**Needs attention**\n` +
        `• Upgradeable=False. 5.1 is blocked on the credentials secret.\n` +
        `• machine-config is Degraded.\n` +
        `• worker-node-03 is NotReady.\n` +
        `• prometheus-adapter is crash looping (OOM).\n` +
        `• frontend has 0 ready replicas, so its Route returns 503.\n\n` +
        `The cluster serves traffic, but it is not healthy enough to update.`,
      suggestions: ["Show operator status", "Check for updates", "Why is a node NotReady?"],
      tools: ["oc get nodes", "oc get co", "oc get clusterversion"],
      navigate: "/",
    },
  },
];

/** First matching recommended workflow for a user prompt or follow-up chip. */
export function matchPromptWorkflow(input: string): LightspeedWorkflowResponse | null {
  const query = input.trim().toLowerCase();
  if (!query) return null;
  for (const workflow of WORKFLOWS) {
    if (workflow.when(query)) return workflow.response;
  }
  return null;
}

/** Suggestions emitted by workflows that do not themselves match a workflow. */
export function uncoveredWorkflowSuggestions(): string[] {
  const missing: string[] = [];
  for (const workflow of WORKFLOWS) {
    for (const suggestion of workflow.response.suggestions) {
      if (!matchPromptWorkflow(suggestion)) missing.push(suggestion);
    }
  }
  return [...new Set(missing)];
}
