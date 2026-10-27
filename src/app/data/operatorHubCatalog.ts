/**
 * OperatorHub catalog fixture (41 packages) — source of record for Software Catalog operator tiles.
 * Derived from the prototype OperatorHub / PackageManifest set used across ecosystem flows.
 */

export type OperatorHubProviderType = "Red Hat" | "Community" | "Certified";

export type OperatorHubCatalogEntry = {
  id: string;
  name: string;
  provider: string;
  providerType: OperatorHubProviderType;
  description: string;
  installed: boolean;
  hasUpdate?: boolean;
  newVersion?: string;
  currentVersion?: string;
  categories: string[];
  olmVersion?: "v0" | "v1";
};

  export const OPERATOR_HUB_CATALOG_OPERATORS: OperatorHubCatalogEntry[] = [
    // OLM (Classic) operators — mirrored in OLM v1 cluster extension catalog below
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
  ];
