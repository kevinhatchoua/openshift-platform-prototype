import { type ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Alert,
  AlertActionCloseButton,
  AlertActionLink,
  AlertGroup,
  Content,
} from "@patternfly/react-core";
import {
  Search,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Globe,
  X,
} from "@/lib/pfIcons";
import Breadcrumbs from "../../components/Breadcrumbs";
import { CatalogBrandLogo } from "./CatalogBrandLogo";
import type { LogoCatalogType } from "./catalogLogos";

/** Facet / tile type for Software Catalog entries (operators + other catalog resources). */
type CatalogItemKind =
  | "builderImages"
  | "devfiles"
  | "helmCharts"
  | "operators"
  | "templates"
  | "event-sources"
  | "knative-serving"
  | "samples"
  | "shared-resources"
  | "cluster-addons"
  | "pipelines";

interface CatalogItem {
  id: string;
  name: string;
  provider: string;
  providerType: "Red Hat" | "Community" | "Certified";
  description: string;
  installed: boolean;
  hasUpdate?: boolean;
  newVersion?: string;
  currentVersion?: string;
  categories: string[];
  olmVersion?: "v0" | "v1";
  catalogType: CatalogItemKind;
}

const PROVIDER_ROTATION = [
  "Red Hat",
  "Apache",
  "IBM",
  "MongoDB",
  "Elastic",
  "Grafana Labs",
  "Couchbase",
  "CrunchyData",
  "Dynatrace",
  "Oracle",
  "Strimzi",
  "Spotahome",
  "Fluent",
  "Sysdig",
  "HashiCorp",
  "Red Hat",
] as const;

const SOURCE_ROTATION: Array<"Red Hat" | "Community" | "Certified"> = [
  "Red Hat",
  "Community",
  "Certified",
  "Community",
  "Certified",
  "Community",
  "Certified",
  "Red Hat",
];

function makeCatalogItems(
  catalogType: CatalogItemKind,
  count: number,
  namePrefix: string,
): CatalogItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${catalogType}-${i + 1}`,
    name: `${namePrefix} ${i + 1}`,
    provider: PROVIDER_ROTATION[i % PROVIDER_ROTATION.length],
    providerType: SOURCE_ROTATION[i % SOURCE_ROTATION.length],
    description: `Prototype ${catalogType.replace(/-/g, " ")} catalog entry for design reviews and demos.`,
    installed: false,
    categories: [],
    catalogType,
  }));
}

/** Shown only after “Show all” under Type; illustrative counts (prototype). */
const EXTRA_TYPE_FACETS: { id: string; label: string; count: number }[] = [
  { id: "event-sources", label: "Event Sources", count: 54 },
  { id: "knative-serving", label: "Knative Services", count: 51 },
  { id: "samples", label: "Samples", count: 58 },
  { id: "shared-resources", label: "Shared Resources", count: 62 },
  { id: "cluster-addons", label: "Cluster add-ons", count: 55 },
  { id: "pipelines", label: "Pipelines", count: 67 },
];

const MIN_TYPE_FACET_DISPLAY = 50;

const STATIC_TYPE_COUNTS = {
  builderImages: 62,
  devfiles: 55,
  helmCharts: 124,
  templates: 73,
} as const;

const SUBSCRIPTION_FACETS: { id: string; label: string; count: number }[] = [
  { id: "openshift-k8s-engine", label: "OpenShift Kubernetes Engine", count: 49 },
  { id: "openshift-virt-engine", label: "OpenShift Virtualization Engine", count: 49 },
  { id: "openshift-container-platform", label: "OpenShift Container Platform", count: 90 },
  { id: "openshift-platform-plus", label: "OpenShift Platform Plus", count: 105 },
  { id: "separate-subscription", label: "Requires separate subscription", count: 70 },
];

const PROVIDER_FACET_PAGE_SIZE = 4;

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-sm bg-[#ececec] px-1.5 py-0.5 font-mono text-[13px] text-[#151515] dark:bg-[#3c3f42] dark:text-[#e8eaed]">
      {children}
    </code>
  );
}

const CATALOG_TYPE_LABEL: Record<CatalogItemKind, string> = {
  builderImages: "Builder image",
  devfiles: "Devfile",
  helmCharts: "Helm chart",
  operators: "Operator",
  templates: "Template",
  "event-sources": "Event source",
  "knative-serving": "Knative service",
  samples: "Sample",
  "shared-resources": "Shared resource",
  "cluster-addons": "Cluster add-on",
  pipelines: "Pipeline",
};

/** Single top-right pill on catalog cards (matches console “All items” tile pattern). */
function catalogCardPillLabel(item: CatalogItem): string {
  switch (item.catalogType) {
    case "helmCharts":
      return "Helm Charts";
    case "devfiles":
      return "Devfiles";
    case "templates":
      return "Templates";
    case "builderImages":
      return "Builder Images";
    case "operators":
      if (item.providerType === "Red Hat") return "Red Hat";
      if (item.providerType === "Certified") return "Certified";
      return "Community";
    default:
      return CATALOG_TYPE_LABEL[item.catalogType];
  }
}

export default function SoftwareCatalogPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogSort, setCatalogSort] = useState<"relevance" | "name">("relevance");
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "Type",
    "Catalog",
    "Capabilities",
    "Source",
    "Provider",
    "Valid subscription",
  ]);
  /** Faceted “Catalog” filter: OLMv0 vs OLMv1. Both unchecked = show all (no OLM version filter). */
  const [catalogOlmFilters, setCatalogOlmFilters] = useState({
    legacyOlmv0: false,
    clusterExtensionOlmv1: false,
  });
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  /** Type facets filter tiles; each catalog item has a matching `catalogType`. */
  const [typeFacet, setTypeFacet] = useState({
    builderImages: false,
    devfiles: false,
    helmCharts: false,
    operators: false,
    templates: false,
  });
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [showAllProviders, setShowAllProviders] = useState(false);
  /** Extra type rows revealed by “Show all”. */
  const [extraTypeFacet, setExtraTypeFacet] = useState<Record<string, boolean>>({});
  const [subscriptionFacet, setSubscriptionFacet] = useState<Record<string, boolean>>({});

  const [filters, setFilters] = useState({
    source: [] as string[],
    provider: [] as string[],
  });

  const RAW_OPERATORS: Array<Omit<CatalogItem, "catalogType">> = [
    // OLMv0 Operators (default set - large catalog)
    {
      id: "abot-operator",
      name: "Abot Operator",
      provider: "Refactz Technologies",
      providerType: "Certified",
      description: "The Abot Test Bench is a test automation tool for 4G, 5G and ORAN Telecom networks",
      installed: true,
      hasUpdate: true,
      newVersion: "3.1.0",
      currentVersion: "3.0.0",
      categories: ["Operators", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "airflow-helm",
      name: "Airflow Helm Operator",
      provider: "Apache",
      providerType: "Community",
      description: "An experimental operator that installs Apache Airflow for workflow orchestration",
      installed: true,
      hasUpdate: true,
      newVersion: "5.7.3",
      currentVersion: "5.7.2",
      categories: ["Operators", "Community"],
      olmVersion: "v0"
    },
    {
      id: "ansible-automation",
      name: "Ansible Automation Platform",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "The Ansible Automation Platform Resource Operator manages everything Automation",
      installed: true,
      hasUpdate: true,
      newVersion: "1.6.0",
      currentVersion: "1.5.0",
      categories: ["Operators", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "bare-metal-event",
      name: "Bare Metal Event Relay",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "This software manages the lifecycle of the bare-event-proxy container",
      installed: true,
      hasUpdate: true,
      newVersion: "1.2.0",
      currentVersion: "1.1.1",
      categories: ["Operators", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "camel-k",
      name: "Camel K Operator",
      provider: "Apache",
      providerType: "Community",
      description: "Apache Camel K is a lightweight integration platform, born on Kubernetes, with serverless superpowers",
      installed: true,
      categories: ["Operators", "Community"],
      olmVersion: "v0"
    },
    {
      id: "business-automation",
      name: "Business Automation",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "Deploys and manages Red Hat Process Automation Manager and Red Hat Decision Manager environments",
      installed: false,
      categories: ["Operators", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "postgresql",
      name: "PostgreSQL Operator",
      provider: "CrunchyData",
      providerType: "Certified",
      description: "Production PostgreSQL made easy, with high availability, backups and disaster recovery",
      installed: false,
      categories: ["Database", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "mongodb",
      name: "MongoDB Enterprise",
      provider: "MongoDB",
      providerType: "Certified",
      description: "MongoDB Enterprise Kubernetes Operator - production-grade MongoDB deployment and management",
      installed: false,
      categories: ["Database", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "mysql",
      name: "MySQL Operator",
      provider: "Oracle",
      providerType: "Community",
      description: "Create, operate and scale self-healing MySQL clusters in Kubernetes",
      installed: false,
      categories: ["Database", "Community"],
      olmVersion: "v0"
    },
    {
      id: "redis",
      name: "Redis Operator",
      provider: "Spotahome",
      providerType: "Community",
      description: "Redis Operator creates/configures/manages Redis clusters atop Kubernetes",
      installed: false,
      categories: ["Database", "Community"],
      olmVersion: "v0"
    },
    {
      id: "kafka-strimzi",
      name: "Strimzi Apache Kafka",
      provider: "Strimzi",
      providerType: "Community",
      description: "Strimzi provides a way to run an Apache Kafka cluster on Kubernetes in various deployment configurations",
      installed: false,
      categories: ["Streaming", "Community"],
      olmVersion: "v0"
    },
    {
      id: "couchbase",
      name: "Couchbase Operator",
      provider: "Couchbase",
      providerType: "Certified",
      description: "The Couchbase Autonomous Operator provides a native integration of Couchbase Server with Kubernetes",
      installed: false,
      categories: ["Database", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "jenkins",
      name: "Jenkins Operator",
      provider: "Jenkins",
      providerType: "Community",
      description: "Kubernetes native operator which fully manages Jenkins on Kubernetes",
      installed: false,
      categories: ["CI/CD", "Community"],
      olmVersion: "v0"
    },
    {
      id: "tekton",
      name: "OpenShift Pipelines",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "Red Hat OpenShift Pipelines is a cloud-native, continuous integration and delivery solution based on Kubernetes resources",
      installed: false,
      categories: ["CI/CD", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "jaeger",
      name: "Jaeger Operator",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "Jaeger Operator for Kubernetes simplifies deploying and running Jaeger on Kubernetes",
      installed: false,
      categories: ["Observability", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "kiali",
      name: "Kiali Operator",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "Kiali is a management console for Istio-based service mesh",
      installed: false,
      categories: ["Observability", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "elasticsearch",
      name: "Elasticsearch Operator",
      provider: "Elastic",
      providerType: "Certified",
      description: "Automates the deployment, provisioning, management, and orchestration of Elasticsearch",
      installed: false,
      categories: ["Logging", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "fluentd",
      name: "Fluentd Operator",
      provider: "Fluent",
      providerType: "Community",
      description: "Fluentd is an open source data collector for unified logging layer",
      installed: false,
      categories: ["Logging", "Community"],
      olmVersion: "v0"
    },
    {
      id: "minio",
      name: "MinIO Operator",
      provider: "MinIO",
      providerType: "Community",
      description: "MinIO is a high performance distributed object storage server, designed for large-scale private cloud infrastructure",
      installed: false,
      categories: ["Storage", "Community"],
      olmVersion: "v0"
    },
    {
      id: "rook-ceph",
      name: "Rook Ceph",
      provider: "Rook",
      providerType: "Community",
      description: "Rook turns distributed storage systems into self-managing, self-scaling, self-healing storage services",
      installed: false,
      categories: ["Storage", "Community"],
      olmVersion: "v0"
    },
    {
      id: "metallb",
      name: "MetalLB Operator",
      provider: "MetalLB",
      providerType: "Community",
      description: "MetalLB is a load-balancer implementation for bare metal Kubernetes clusters",
      installed: false,
      categories: ["Networking", "Community"],
      olmVersion: "v0"
    },
    {
      id: "nginx-ingress",
      name: "NGINX Ingress Operator",
      provider: "NGINX",
      providerType: "Certified",
      description: "NGINX Ingress Operator provides ingress controller for Kubernetes deployments",
      installed: false,
      categories: ["Networking", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "istio",
      name: "Istio Service Mesh",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "Red Hat OpenShift Service Mesh provides a uniform way to connect, manage and observe microservices based applications",
      installed: false,
      categories: ["Networking", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "kong",
      name: "Kong Gateway Operator",
      provider: "Kong",
      providerType: "Certified",
      description: "Kong for Kubernetes is an ingress controller and API gateway",
      installed: false,
      categories: ["Networking", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "datadog",
      name: "Datadog Operator",
      provider: "Datadog",
      providerType: "Certified",
      description: "The Datadog Operator provides a Kubernetes-native way to deploy the Datadog Agent",
      installed: false,
      categories: ["Monitoring", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "dynatrace",
      name: "Dynatrace Operator",
      provider: "Dynatrace",
      providerType: "Certified",
      description: "Dynatrace is an all-in-one, zero-configuration monitoring platform designed for modern cloud and hybrid environments",
      installed: false,
      categories: ["Monitoring", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "newrelic",
      name: "New Relic Operator",
      provider: "New Relic",
      providerType: "Certified",
      description: "Observability platform built to help engineers create more perfect software",
      installed: false,
      categories: ["Monitoring", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "splunk",
      name: "Splunk Operator",
      provider: "Splunk",
      providerType: "Certified",
      description: "Splunk Enterprise Operator for Kubernetes provides a cloud-native way to deploy and manage Splunk Enterprise",
      installed: false,
      categories: ["Logging", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "vault-secrets",
      name: "Vault Secrets Operator",
      provider: "HashiCorp",
      providerType: "Certified",
      description: "The Vault Secrets Operator allows Pods to consume Vault secrets natively from Kubernetes Secrets",
      installed: false,
      categories: ["Security", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "cert-manager",
      name: "cert-manager",
      provider: "Jetstack",
      providerType: "Community",
      description: "Automates the management and issuance of TLS certificates from various sources",
      installed: false,
      categories: ["Security", "Community"],
      olmVersion: "v0"
    },
    {
      id: "keycloak",
      name: "Keycloak Operator",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "Keycloak is an Open Source Identity and Access Management solution for modern Applications and Services",
      installed: false,
      categories: ["Security", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "gpu-operator",
      name: "NVIDIA GPU Operator",
      provider: "NVIDIA",
      providerType: "Certified",
      description: "Automates the management of all NVIDIA software components needed to run GPU accelerated workloads",
      installed: false,
      categories: ["AI/ML", "Certified"],
      olmVersion: "v0"
    },
    {
      id: "knative-serving",
      name: "Knative Serving",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "Knative Serving builds on Kubernetes to support deploying and serving of serverless applications",
      installed: false,
      categories: ["Serverless", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "openfaas",
      name: "OpenFaaS",
      provider: "OpenFaaS",
      providerType: "Community",
      description: "Serverless Functions Made Simple for Kubernetes",
      installed: false,
      categories: ["Serverless", "Community"],
      olmVersion: "v0"
    },
    {
      id: "kubevirt",
      name: "KubeVirt",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "KubeVirt is a virtual machine management add-on for Kubernetes",
      installed: false,
      categories: ["Virtualization", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "crossplane",
      name: "Crossplane",
      provider: "Upbound",
      providerType: "Community",
      description: "Crossplane is an open source Kubernetes add-on that enables platform teams to assemble infrastructure from multiple vendors",
      installed: false,
      categories: ["Infrastructure", "Community"],
      olmVersion: "v0"
    },
    {
      id: "argocd",
      name: "Argo CD",
      provider: "Argo Project",
      providerType: "Community",
      description: "Declarative continuous delivery with a fully-loaded UI",
      installed: false,
      categories: ["CI/CD", "Community"],
      olmVersion: "v0"
    },
    {
      id: "gitops",
      name: "Red Hat OpenShift GitOps",
      provider: "Red Hat",
      providerType: "Red Hat",
      description: "Enables teams to implement GitOps principles with a declarative approach to configuration management",
      installed: false,
      categories: ["CI/CD", "Red Hat"],
      olmVersion: "v0"
    },
    {
      id: "nexus",
      name: "Nexus Operator",
      provider: "Sonatype",
      providerType: "Community",
      description: "Nexus Repository Manager helps developers and organizations to proxy, collect and manage dependencies",
      installed: false,
      categories: ["Development Tools", "Community"],
      olmVersion: "v0"
    },
    {
      id: "harbor",
      name: "Harbor Operator",
      provider: "VMware",
      providerType: "Community",
      description: "Harbor is an open source trusted cloud native registry project that stores, signs, and scans content",
      installed: false,
      categories: ["Development Tools", "Community"],
      olmVersion: "v0"
    },
    {
      id: "portworx",
      name: "Portworx Enterprise",
      provider: "Portworx",
      providerType: "Certified",
      description: "Cloud-Native storage and data management platform for Kubernetes",
      installed: false,
      categories: ["Storage", "Certified"],
      olmVersion: "v0"
    },

    // OLMv1 Operators (new simplified API - smaller set)
    {
      id: "argocd-operator-v1",
      name: "Argo CD",
      provider: "Argo Project",
      providerType: "Community",
      description: "Declarative GitOps continuous delivery for Kubernetes - built with OLMv1 for simpler management",
      installed: false,
      categories: ["Operators", "Community"],
      olmVersion: "v1"
    },
    {
      id: "prometheus-v1",
      name: "Prometheus Operator",
      provider: "Prometheus Community",
      providerType: "Community",
      description: "Provides Kubernetes native deployment and management of Prometheus and related monitoring components using OLMv1",
      installed: true,
      categories: ["Operators", "Community"],
      olmVersion: "v1"
    },
    {
      id: "cert-manager-v1",
      name: "cert-manager",
      provider: "Jetstack",
      providerType: "Community",
      description: "Automates the management and issuance of TLS certificates with OLMv1 simplified update control",
      installed: false,
      categories: ["Operators", "Community"],
      olmVersion: "v1"
    },
    {
      id: "elastic-v1",
      name: "Elastic Cloud on Kubernetes",
      provider: "Elastic",
      providerType: "Certified",
      description: "Orchestrate Elasticsearch, Kibana, APM Server, Enterprise Search, and Beats on Kubernetes with OLMv1",
      installed: false,
      hasUpdate: false,
      categories: ["Operators", "Certified"],
      olmVersion: "v1"
    },
    {
      id: "vault-v1",
      name: "Vault Operator",
      provider: "HashiCorp",
      providerType: "Certified",
      description: "Manage HashiCorp Vault in Kubernetes with OLMv1 direct control over upgrade rollouts",
      installed: true,
      hasUpdate: true,
      newVersion: "1.15.0",
      currentVersion: "1.14.2",
      categories: ["Operators", "Certified"],
      olmVersion: "v1"
    },
    {
      id: "grafana-v1",
      name: "Grafana Operator",
      provider: "Grafana Labs",
      providerType: "Community",
      description: "Kubernetes Operator for Grafana with OLMv1 streamlined API",
      installed: false,
      categories: ["Operators", "Community"],
      olmVersion: "v1"
    },
  ];

  const operatorCatalogItems: CatalogItem[] = RAW_OPERATORS.map((o) => ({
    ...o,
    catalogType: "operators" as const,
  }));

  const catalogItems: CatalogItem[] = [
    ...operatorCatalogItems,
    ...makeCatalogItems("builderImages", STATIC_TYPE_COUNTS.builderImages, "Builder image"),
    ...makeCatalogItems("devfiles", STATIC_TYPE_COUNTS.devfiles, "Devfile"),
    ...makeCatalogItems("helmCharts", STATIC_TYPE_COUNTS.helmCharts, "Helm chart"),
    ...makeCatalogItems("templates", STATIC_TYPE_COUNTS.templates, "Template"),
    ...EXTRA_TYPE_FACETS.flatMap((row) =>
      makeCatalogItems(row.id as CatalogItemKind, row.count, row.label),
    ),
  ];

  const availableUpdates = catalogItems.filter(
    (item) => item.catalogType === "operators" && item.hasUpdate,
  ).length;

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleFilter = (filterType: "source" | "provider", value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(v => v !== value)
        : [...prev[filterType], value],
    }));
  };

  const toggleCatalogOlmFilter = (key: "legacyOlmv0" | "clusterExtensionOlmv1") => {
    setCatalogOlmFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTypeFacet = (key: keyof typeof typeFacet) => {
    setTypeFacet((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleExtraTypeFacet = (id: string) => {
    setExtraTypeFacet((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSubscriptionFacet = (id: string) => {
    setSubscriptionFacet((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  function getSelectedCatalogTypes(): CatalogItemKind[] {
    const out: CatalogItemKind[] = [];
    if (typeFacet.builderImages) out.push("builderImages");
    if (typeFacet.devfiles) out.push("devfiles");
    if (typeFacet.helmCharts) out.push("helmCharts");
    if (typeFacet.operators) out.push("operators");
    if (typeFacet.templates) out.push("templates");
    for (const row of EXTRA_TYPE_FACETS) {
      if (extraTypeFacet[row.id]) out.push(row.id as CatalogItemKind);
    }
    return out;
  }

  /** Facet counts exclude the facet group being counted so tallies stay meaningful with multi-select. */
  function matchesCatalogItem(
    item: CatalogItem,
    skips?: {
      skipSearch?: boolean;
      skipCatalogOlm?: boolean;
      skipSource?: boolean;
      skipProvider?: boolean;
      skipType?: boolean;
    },
  ): boolean {
    if (!skips?.skipSearch && searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (!skips?.skipCatalogOlm) {
      const anyCatalogOlmSelected =
        catalogOlmFilters.legacyOlmv0 || catalogOlmFilters.clusterExtensionOlmv1;
      if (anyCatalogOlmSelected && item.catalogType === "operators") {
        const isV0 = item.olmVersion === "v0";
        const isV1 = item.olmVersion === "v1";
        const allowV0 = catalogOlmFilters.legacyOlmv0;
        const allowV1 = catalogOlmFilters.clusterExtensionOlmv1;
        if (isV0 && !allowV0) return false;
        if (isV1 && !allowV1) return false;
        if (!isV0 && !isV1) return false;
      }
    }

    if (!skips?.skipSource && filters.source.length > 0) {
      if (!filters.source.includes(item.providerType)) return false;
    }

    if (!skips?.skipProvider && filters.provider.length > 0) {
      if (!filters.provider.includes(item.provider)) return false;
    }

    if (!skips?.skipType) {
      const selectedTypes = getSelectedCatalogTypes();
      if (selectedTypes.length > 0 && !selectedTypes.includes(item.catalogType)) {
        return false;
      }
    }

    return true;
  }

  const uniqueProviders = [...new Set(catalogItems.map((c) => c.provider))].sort((a, b) =>
    a.localeCompare(b),
  );
  const providerMoreCount = Math.max(0, uniqueProviders.length - PROVIDER_FACET_PAGE_SIZE);

  const baseForFacets = (skips?: Parameters<typeof matchesCatalogItem>[1]) =>
    catalogItems.filter((item) => matchesCatalogItem(item, skips));

  const countItemsOfType = (kind: CatalogItemKind) =>
    baseForFacets({ skipType: true }).filter((i) => i.catalogType === kind).length;

  const facetCounts = {
    operators: countItemsOfType("operators"),
    catalogLegacy: baseForFacets({ skipCatalogOlm: true }).filter(
      (i) => i.catalogType === "operators" && i.olmVersion === "v0",
    ).length,
    catalogCluster: baseForFacets({ skipCatalogOlm: true }).filter(
      (i) => i.catalogType === "operators" && i.olmVersion === "v1",
    ).length,
    certified: baseForFacets({ skipSource: true }).filter((i) => i.providerType === "Certified").length,
    community: baseForFacets({ skipSource: true }).filter((i) => i.providerType === "Community").length,
    redHatSource: baseForFacets({ skipSource: true }).filter((i) => i.providerType === "Red Hat").length,
    byProvider: Object.fromEntries(
      uniqueProviders.map((name) => [
        name,
        baseForFacets({ skipProvider: true }).filter((i) => i.provider === name).length,
      ]),
    ) as Record<string, number>,
  };

  const operatorsTypeDisplayCount = Math.max(MIN_TYPE_FACET_DISPLAY, facetCounts.operators);

  const filteredCatalogItems = catalogItems
    .filter((item) => matchesCatalogItem(item))
    .sort((a, b) => {
      if (catalogSort !== "name") return 0;
      return a.name.localeCompare(b.name);
    });

  const handleCatalogItemClick = (item: CatalogItem) => {
    setSelectedCatalogItem(item);
    setShowSidePanel(true);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-[24px]">
        <Breadcrumbs
          items={[
            { label: "Ecosystem", path: "/ecosystem" },
            { label: "Software Catalog" },
          ]}
        >

        <Content className="mb-6">
          <h1 id="main-title">Software Catalog</h1>
          <p>
            Add shared applications, services, event sources, or source-to-image builders to your Project from the
            software catalog. Cluster administrators can customize the content made available in the catalog.
          </p>
        </Content>

        {availableUpdates > 0 && !dismissedAlerts.includes("updates") && (
          <AlertGroup className="mb-4">
            <Alert
              variant="info"
              isInline
              title={`${availableUpdates} Software versions available`}
              actionClose={
                <AlertActionCloseButton onClose={() => setDismissedAlerts((prev) => [...prev, "updates"])} />
              }
              actionLinks={
                <AlertActionLink component={Link} to="/ecosystem/installed-operators">
                  Manage updates
                </AlertActionLink>
              }
            >
              Review and approve pending software updates to keep your cluster secure and up-to-date.
            </Alert>
          </AlertGroup>
        )}

        <div className="flex gap-[24px]">
          {/* Left Sidebar - Filters */}
          <div className="w-[280px] shrink-0">
            {/* Type Filter */}
            <div className="mb-[16px]">
              <button
                onClick={() => toggleCategory("Type")}
                className="w-full flex items-center justify-between mb-[8px] text-[14px] font-semibold text-[#151515] dark:text-white"
              >
                <div className="flex items-center gap-[4px]">
                  <span>Type</span>
                  <span className="text-[#4d4d4d] dark:text-[#b0b0b0]">ⓘ</span>
                </div>
                {expandedCategories.includes("Type") ? (
                  <ChevronDown className="size-[14px]" />
                ) : (
                  <ChevronRight className="size-[14px]" />
                )}
              </button>
              {expandedCategories.includes("Type") && (
                <div className="space-y-[8px] pl-[4px]">
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input
                      type="checkbox"
                      className="size-[14px]"
                      checked={typeFacet.builderImages}
                      onChange={() => toggleTypeFacet("builderImages")}
                    />
                    <span>Builder Images ({countItemsOfType("builderImages")})</span>
                  </label>
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input
                      type="checkbox"
                      className="size-[14px]"
                      checked={typeFacet.devfiles}
                      onChange={() => toggleTypeFacet("devfiles")}
                    />
                    <span>Devfiles ({countItemsOfType("devfiles")})</span>
                  </label>
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input
                      type="checkbox"
                      className="size-[14px]"
                      checked={typeFacet.helmCharts}
                      onChange={() => toggleTypeFacet("helmCharts")}
                    />
                    <span>Helm Charts ({countItemsOfType("helmCharts")})</span>
                  </label>
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input
                      type="checkbox"
                      className="size-[14px]"
                      checked={typeFacet.operators}
                      onChange={() => toggleTypeFacet("operators")}
                    />
                    <span>Operators ({operatorsTypeDisplayCount})</span>
                  </label>
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input
                      type="checkbox"
                      className="size-[14px]"
                      checked={typeFacet.templates}
                      onChange={() => toggleTypeFacet("templates")}
                    />
                    <span>Templates ({countItemsOfType("templates")})</span>
                  </label>
                  {showAllTypes && (
                    <>
                      {EXTRA_TYPE_FACETS.map((row) => (
                        <label
                          key={row.id}
                          className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white"
                        >
                          <input
                            type="checkbox"
                            className="size-[14px]"
                            checked={!!extraTypeFacet[row.id]}
                            onChange={() => toggleExtraTypeFacet(row.id)}
                          />
                          <span>
                            {row.label} ({countItemsOfType(row.id as CatalogItemKind)})
                          </span>
                        </label>
                      ))}
                    </>
                  )}
                  <button
                    type="button"
                    className="text-[#0066cc] dark:text-[#4dabf7] hover:underline text-[13px]"
                    onClick={() => setShowAllTypes(!showAllTypes)}
                  >
                    {showAllTypes ? "Hide" : `Show all (${EXTRA_TYPE_FACETS.length} more)`}
                  </button>
                </div>
              )}
            </div>

            {/* Catalog (OLM) Filter */}
            <div className="mb-[16px]">
              <button
                onClick={() => toggleCategory("Catalog")}
                className="w-full flex items-center justify-between mb-[8px] text-[14px] font-semibold text-[#151515] dark:text-white"
              >
                <span>Catalog</span>
                {expandedCategories.includes("Catalog") ? (
                  <ChevronDown className="size-[14px]" />
                ) : (
                  <ChevronRight className="size-[14px]" />
                )}
              </button>
              {expandedCategories.includes("Catalog") && (
                <div className="space-y-[8px] pl-[4px]">
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input
                      type="checkbox"
                      className="size-[14px]"
                      checked={catalogOlmFilters.legacyOlmv0}
                      onChange={() => toggleCatalogOlmFilter("legacyOlmv0")}
                    />
                    <span>Legacy (OLMv0) ({facetCounts.catalogLegacy})</span>
                  </label>
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input
                      type="checkbox"
                      className="size-[14px]"
                      checked={catalogOlmFilters.clusterExtensionOlmv1}
                      onChange={() => toggleCatalogOlmFilter("clusterExtensionOlmv1")}
                    />
                    <span>Cluster extension (OLMv1) ({facetCounts.catalogCluster})</span>
                  </label>
                </div>
              )}
            </div>

            {/* Capabilities Filter */}
            <div className="mb-[16px]">
              <button 
                onClick={() => toggleCategory("Capabilities")}
                className="w-full flex items-center justify-between mb-[8px] text-[14px] font-semibold text-[#151515] dark:text-white"
              >
                <span>Capabilities</span>
                {expandedCategories.includes("Capabilities") ? (
                  <ChevronDown className="size-[14px]" />
                ) : (
                  <ChevronRight className="size-[14px]" />
                )}
              </button>
            </div>

            {/* Source Filter */}
            <div className="mb-[16px]">
              <button
                onClick={() => toggleCategory("Source")}
                className="w-full flex items-center justify-between mb-[8px] text-[14px] font-semibold text-[#151515] dark:text-white"
              >
                <span>Source</span>
                {expandedCategories.includes("Source") ? (
                  <ChevronDown className="size-[14px]" />
                ) : (
                  <ChevronRight className="size-[14px]" />
                )}
              </button>
              {expandedCategories.includes("Source") && (
                <div className="space-y-[8px] pl-[4px]">
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input 
                      type="checkbox" 
                      className="size-[14px]" 
                      checked={filters.source.includes("Certified")}
                      onChange={() => toggleFilter("source", "Certified")}
                    />
                    <span>Certified ({facetCounts.certified})</span>
                  </label>
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input 
                      type="checkbox" 
                      className="size-[14px]" 
                      checked={filters.source.includes("Community")}
                      onChange={() => toggleFilter("source", "Community")}
                    />
                    <span>Community ({facetCounts.community})</span>
                  </label>
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input 
                      type="checkbox" 
                      className="size-[14px]" 
                      checked={filters.source.includes("Red Hat")}
                      onChange={() => toggleFilter("source", "Red Hat")}
                    />
                    <span>Red Hat ({facetCounts.redHatSource})</span>
                  </label>
                </div>
              )}
            </div>

            {/* Provider Filter */}
            <div className="mb-[16px]">
              <button
                onClick={() => toggleCategory("Provider")}
                className="w-full flex items-center justify-between mb-[8px] text-[14px] font-semibold text-[#151515] dark:text-white"
              >
                <span>Provider</span>
                {expandedCategories.includes("Provider") ? (
                  <ChevronDown className="size-[14px]" />
                ) : (
                  <ChevronRight className="size-[14px]" />
                )}
              </button>
              {expandedCategories.includes("Provider") && (
                <div className="space-y-[8px] pl-[4px]">
                  {(showAllProviders ? uniqueProviders : uniqueProviders.slice(0, PROVIDER_FACET_PAGE_SIZE)).map(
                    (name) => (
                      <label
                        key={name}
                        className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white"
                      >
                        <input
                          type="checkbox"
                          className="size-[14px]"
                          checked={filters.provider.includes(name)}
                          onChange={() => toggleFilter("provider", name)}
                        />
                        <span>
                          {name} ({facetCounts.byProvider[name] ?? 0})
                        </span>
                      </label>
                    ),
                  )}
                  {providerMoreCount > 0 && (
                    <button
                      type="button"
                      className="text-[#0066cc] dark:text-[#4dabf7] hover:underline text-[13px]"
                      onClick={() => setShowAllProviders(!showAllProviders)}
                    >
                      {showAllProviders ? "Hide" : `Show ${providerMoreCount} more`}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Valid subscription */}
            <div className="mb-[16px]">
              <button
                type="button"
                onClick={() => toggleCategory("Valid subscription")}
                className="w-full flex items-center justify-between mb-[8px] text-[14px] font-semibold text-[#151515] dark:text-white"
              >
                <span>Valid subscription</span>
                {expandedCategories.includes("Valid subscription") ? (
                  <ChevronDown className="size-[14px]" />
                ) : (
                  <ChevronRight className="size-[14px]" />
                )}
              </button>
              {expandedCategories.includes("Valid subscription") && (
                <div className="space-y-[8px] pl-[4px]">
                  {SUBSCRIPTION_FACETS.map((row) => (
                    <label
                      key={row.id}
                      className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white"
                    >
                      <input
                        type="checkbox"
                        className="size-[14px]"
                        checked={!!subscriptionFacet[row.id]}
                        onChange={() => toggleSubscriptionFacet(row.id)}
                      />
                      <span>
                        {row.label} ({row.count})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content — catalog grid (search + sort left-aligned) */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-[12px] mb-[24px] sm:flex-row sm:flex-wrap sm:items-center sm:justify-start sm:gap-[12px]">
              <div className="relative w-full sm:max-w-[320px] sm:w-[320px]">
                <Search className="absolute left-[12px] top-[10px] size-[16px] text-[#4d4d4d] dark:text-[#b0b0b0]" />
                <input
                  type="search"
                  placeholder="Filter by keyword…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-[36px] pr-[12px] py-[8px] bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[#c7c7c7] dark:border-[rgba(255,255,255,0.2)] rounded-[999px] text-[14px] text-[#151515] dark:text-white placeholder:text-[#4d4d4d] dark:placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#0066cc] dark:focus:ring-[#4dabf7]"
                />
              </div>
              <select
                aria-label="Sort catalog items"
                value={catalogSort}
                onChange={(e) => setCatalogSort(e.target.value as "relevance" | "name")}
                className="w-full sm:w-auto min-w-[140px] pl-[12px] pr-[12px] py-[8px] bg-white dark:bg-[rgba(255,255,255,0.05)] border border-[#c7c7c7] dark:border-[rgba(255,255,255,0.2)] rounded-[8px] text-[14px] text-[#151515] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066cc] dark:focus:ring-[#4dabf7]"
              >
                <option value="relevance">Relevance</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-[16px]">
              {filteredCatalogItems.map((item) => {
                return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleCatalogItemClick(item)}
                  className="flex h-full min-h-[220px] flex-col bg-[rgba(255,255,255,0.5)] dark:bg-[rgba(255,255,255,0.05)] border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.14)] rounded-[12px] p-[18px] text-left hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.12)] dark:hover:border-[rgba(255,255,255,0.22)] transition-all"
                >
                  <div className="flex justify-between items-start gap-[12px] mb-[16px]">
                    <CatalogBrandLogo
                      id={item.id}
                      catalogType={item.catalogType as LogoCatalogType}
                      boxClassName="size-[40px] rounded-[6px] bg-white dark:bg-[#ececec] flex items-center justify-center p-[6px] shrink-0 border border-[rgba(0,0,0,0.08)] dark:border-[rgba(0,0,0,0.12)]"
                      logoClassName="h-[28px] w-[28px] max-h-[28px] max-w-[28px]"
                    />
                    <span className="rounded-full px-[10px] py-[4px] text-[11px] font-semibold leading-tight bg-[#5c5f62] text-white shrink-0 max-w-[min(148px,48%)] text-right">
                      {catalogCardPillLabel(item)}
                    </span>
                  </div>
                  <h3 className="font-['Red_Hat_Display:SemiBold',sans-serif] font-semibold text-[16px] text-[#151515] dark:text-white mb-[8px] leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-[13px] text-[#151515] dark:text-[#ededed] mb-[16px]">
                    Provided by {item.provider}
                  </p>
                  <p className="text-[14px] text-[#4d4d4d] dark:text-[#c6c6c6] mb-[16px] line-clamp-4 flex-1 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.08)] pt-[12px]">
                    {item.catalogType === "operators" && item.hasUpdate ? (
                      <a
                        href="https://docs.openshift.com/container-platform/latest/operators/admin/olm-upgrading-operators.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/ecosystem/software-catalog/${item.id}/update`);
                        }}
                        className="text-[13px] text-[#0066cc] dark:text-[#4dabf7] hover:underline flex items-center gap-[4px]"
                      >
                        <AlertTriangle className="size-[14px]" />
                        New version available
                      </a>
                    ) : item.catalogType === "operators" && item.installed ? (
                      <span className="text-[13px] text-[#3e8635] dark:text-[#5ba352] flex items-center gap-[4px]">
                        <CheckCircle className="size-[14px]" />
                        Installed
                      </span>
                    ) : (
                      <span className="text-[13px] text-[#4d4d4d] dark:text-[#b0b0b0]">
                        {item.catalogType === "operators" ? "Not installed" : "Available"}
                      </span>
                    )}
                  </div>
                </button>
                );
              })}
            </div>
          </div>
        </div>
        </Breadcrumbs>
      </div>

      {/* Side Panel — OCP console–style operator / catalog drawer */}
      {showSidePanel && selectedCatalogItem && (
        <div className="fixed inset-0 z-[10000]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowSidePanel(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[min(720px,100%)] app-glass-panel app-glass-panel--edge-right flex flex-col overflow-hidden shadow-[-8px_0_24px_rgba(0,0,0,0.15)]">
            <div className="flex-1 overflow-y-auto">
              <header className="sticky top-0 z-[2] border-b border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.92)] dark:bg-[rgba(28,28,28,0.96)] px-6 pt-5 pb-4 backdrop-blur-md">
                <div className="flex gap-4">
                  <CatalogBrandLogo
                    id={selectedCatalogItem.id}
                    catalogType={selectedCatalogItem.catalogType as LogoCatalogType}
                    boxClassName="size-14 shrink-0 rounded-md bg-white dark:bg-[#2b2b2b] flex items-center justify-center overflow-hidden border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.12)]"
                    logoClassName="size-11 max-h-11 max-w-11"
                  />
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex justify-between gap-3 items-start">
                      <div className="min-w-0">
                        <h2 className="font-['Red_Hat_Display',sans-serif] font-semibold text-[22px] leading-tight text-[#151515] dark:text-white">
                          {selectedCatalogItem.name}
                        </h2>
                        <p className="text-[13px] text-[#6a6e73] dark:text-[#b0b0b0] mt-1.5">
                          Provided by {selectedCatalogItem.provider}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSidePanel(false)}
                        className="p-2 -mr-2 -mt-1 rounded-md hover:bg-black/[0.06] dark:hover:bg-white/10 shrink-0"
                        aria-label="Close"
                      >
                        <X className="size-4 text-[#151515] dark:text-white" />
                      </button>
                    </div>

                    {selectedCatalogItem.catalogType === "operators" && selectedCatalogItem.hasUpdate && (
                      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border border-[#f0ab00]/45 bg-[#fef6e6] dark:bg-[rgba(240,171,0,0.12)] px-3 py-2.5">
                        <AlertTriangle className="size-4 text-[#f0ab00] shrink-0" />
                        <span className="text-[13px] text-[#151515] dark:text-white font-medium">
                          New version {selectedCatalogItem.newVersion} available
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigate(`/ecosystem/software-catalog/${selectedCatalogItem.id}/update`);
                            setShowSidePanel(false);
                          }}
                          className="text-[13px] font-semibold text-[#06c] dark:text-[#4dabf7] hover:underline"
                        >
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigate(`/ecosystem/software-catalog/${selectedCatalogItem.id}`);
                            setShowSidePanel(false);
                          }}
                          className="text-[13px] font-semibold text-[#06c] dark:text-[#4dabf7] hover:underline"
                        >
                          View details
                        </button>
                      </div>
                    )}

                    {selectedCatalogItem.catalogType === "operators" && !selectedCatalogItem.installed && (
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/ecosystem/software-catalog/${selectedCatalogItem.id}/install`);
                          setShowSidePanel(false);
                        }}
                        className="mt-4 inline-flex items-center justify-center px-6 py-2 rounded-md bg-[#0066cc] hover:bg-[#004080] dark:bg-[#4dabf7] dark:hover:bg-[#339af0] text-white text-[14px] font-semibold shadow-sm transition-colors"
                      >
                        Install
                      </button>
                    )}
                  </div>
                </div>
              </header>

              <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-[minmax(200px,240px)_1fr] gap-x-10 gap-y-6 items-start">
                {/* Left: metadata (OCP console pattern) */}
                <aside className="space-y-5 text-[13px] text-[#151515] dark:text-[#e0e0e0]">
                  {selectedCatalogItem.catalogType === "operators" ? (
                    <>
                      <div>
                        <label className="block text-[11px] font-medium uppercase tracking-wide text-[#6a6e73] dark:text-[#a1a1a1] mb-1.5">
                          Channel
                        </label>
                        <select
                          className="w-full rounded border border-[#c7c7c7] dark:border-[#4d4d4d] bg-white dark:bg-[#1e1e1e] text-[13px] py-1.5 px-2 text-[#151515] dark:text-white"
                          defaultValue="stable"
                        >
                          <option value="stable">stable</option>
                          <option value="release-2-16">release-2.16</option>
                          <option value="fast">fast</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium uppercase tracking-wide text-[#6a6e73] dark:text-[#a1a1a1] mb-1.5">
                          Version
                        </label>
                        <select
                          className="w-full rounded border border-[#c7c7c7] dark:border-[#4d4d4d] bg-white dark:bg-[#1e1e1e] text-[13px] py-1.5 px-2 text-[#151515] dark:text-white"
                          defaultValue={selectedCatalogItem.currentVersion ?? selectedCatalogItem.newVersion ?? "2.16.0"}
                        >
                          <option>{selectedCatalogItem.currentVersion ?? "2.16.0"}</option>
                          {selectedCatalogItem.newVersion && (
                            <option>{selectedCatalogItem.newVersion}</option>
                          )}
                        </select>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-[#6a6e73] dark:text-[#a1a1a1] mb-2">
                          Capability level
                        </p>
                        <ul className="space-y-2">
                          {[
                            { label: "Basic Install", done: true },
                            { label: "Seamless Upgrades", done: true },
                            { label: "Full Lifecycle", done: false },
                            { label: "Deep Insights", done: false },
                            { label: "Auto Pilot", done: false },
                          ].map((cap) => (
                            <li key={cap.label} className="flex items-center gap-2">
                              {cap.done ? (
                                <CheckCircle className="size-4 text-[#06c] dark:text-[#4dabf7] shrink-0" />
                              ) : (
                                <span
                                  className="inline-block size-4 rounded-full border-2 border-[#8a8d90] dark:border-[#6a6e73] shrink-0"
                                  aria-hidden
                                />
                              )}
                              <span className="text-[13px]">{cap.label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#6a6e73] dark:text-[#a1a1a1] mb-1">
                        Type
                      </p>
                      <p className="text-[13px]">{CATALOG_TYPE_LABEL[selectedCatalogItem.catalogType]}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#6a6e73] dark:text-[#a1a1a1] mb-1">
                      Source
                    </p>
                    <p className="text-[13px]">{selectedCatalogItem.providerType}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#6a6e73] dark:text-[#a1a1a1] mb-1">
                      Provider
                    </p>
                    <p className="text-[13px]">{selectedCatalogItem.provider}</p>
                  </div>

                  {selectedCatalogItem.catalogType === "operators" && (
                    <>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-[#6a6e73] dark:text-[#a1a1a1] mb-1.5">
                          Infrastructure features
                        </p>
                        <ul className="list-disc pl-4 space-y-0.5 text-[13px] text-[#4d4d4d] dark:text-[#c6c7c8]">
                          <li>Disconnected</li>
                          <li>Proxy-aware</li>
                          <li>Designed for FIPS</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-[#6a6e73] dark:text-[#a1a1a1] mb-1.5">
                          Valid subscriptions
                        </p>
                        <ul className="space-y-1 text-[13px] text-[#4d4d4d] dark:text-[#c6c7c8]">
                          <li>OpenShift Platform Plus</li>
                          <li>
                            {selectedCatalogItem.provider === "Red Hat"
                              ? `Red Hat ${selectedCatalogItem.name}`
                              : `${selectedCatalogItem.provider} — ${selectedCatalogItem.name}`}
                          </li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-[#6a6e73] dark:text-[#a1a1a1] mb-1">
                          Repository
                        </p>
                        <a
                          href="https://github.com/openshift/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[13px] text-[#06c] dark:text-[#4dabf7] hover:underline break-all"
                        >
                          github.com/openshift
                          <ExternalLink className="size-3 shrink-0 opacity-80" />
                        </a>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-[#6a6e73] dark:text-[#a1a1a1] mb-1">
                          Container image
                        </p>
                        <p className="text-[13px] text-[#6a6e73] dark:text-[#a1a1a1]">—</p>
                      </div>
                    </>
                  )}

                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#6a6e73] dark:text-[#a1a1a1] mb-1">
                      Created at
                    </p>
                    <p className="flex items-center gap-1.5 text-[13px] text-[#4d4d4d] dark:text-[#c6c7c8]">
                      <Globe className="size-3.5 shrink-0 text-[#6a6e73]" aria-hidden />
                      Mar 10, 2026, 9:47 AM
                    </p>
                  </div>
                </aside>

                {/* Right: documentation-style body */}
                <div className="min-w-0 space-y-6 text-[14px] leading-relaxed text-[#4d4d4d] dark:text-[#c6c7c8]">
                  <p>{selectedCatalogItem.description}</p>

                  {selectedCatalogItem.catalogType === "operators" ? (
                    <>
                      <section>
                        <h3 className="text-[16px] font-semibold text-[#151515] dark:text-white mb-2">
                          How to install
                        </h3>
                        <p>
                          From the <InlineCode>OperatorHub</InlineCode> catalog, choose this operator and create a{" "}
                          <InlineCode>Subscription</InlineCode> in your target namespace. The Operator Lifecycle Manager
                          (OLM) will reconcile the required CSV and related objects. For cluster-scoped installs,
                          ensure your account has sufficient privileges to create cluster extensions.
                        </p>
                      </section>
                      <section>
                        <h3 className="text-[16px] font-semibold text-[#151515] dark:text-white mb-2">
                          Special considerations for disconnected environments
                        </h3>
                        <p>
                          Mirror the operator bundle and related images into your registry, then reference that mirror in
                          your <InlineCode>ImageContentSourcePolicy</InlineCode> or <InlineCode>CatalogSource</InlineCode>{" "}
                          configuration. Verify signature and digest before promoting to production clusters.
                        </p>
                      </section>
                      <section>
                        <h3 className="text-[16px] font-semibold text-[#151515] dark:text-white mb-2">
                          Include in mirrored catalog
                        </h3>
                        <p>
                          When using oc-mirror or a private catalog index, add the package name for{" "}
                          <InlineCode>{selectedCatalogItem.name.replace(/\s+/g, "")}</InlineCode> to your mirror set so
                          installs remain available offline.
                        </p>
                      </section>
                      <section>
                        <h3 className="text-[16px] font-semibold text-[#151515] dark:text-white mb-2">
                          Resource annotations
                        </h3>
                        <p>
                          You can add annotations on the owning custom resource (for example{" "}
                          <InlineCode>MultiClusterHub</InlineCode> or your operator&apos;s CR) to tune reconciliation
                          intervals, feature gates, or proxy settings. Consult the operator documentation for the exact
                          schema.
                        </p>
                      </section>
                    </>
                  ) : (
                    <section>
                      <h3 className="text-[16px] font-semibold text-[#151515] dark:text-white mb-2">
                        Using this catalog item
                      </h3>
                      <p>
                        Add this {CATALOG_TYPE_LABEL[selectedCatalogItem.catalogType].toLowerCase()} to your project from
                        the catalog. Namespace-scoped resources can be created with the default editor; cluster
                        administrators may restrict which items appear in the catalog.
                      </p>
                    </section>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}