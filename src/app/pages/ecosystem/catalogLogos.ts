/**
 * Brand logos via Simple Icons (MIT) SVGs on jsDelivr — no extra npm deps.
 * `accent` hex values follow Simple Icons / common brand guidelines (for CSS mask tinting).
 * @see https://github.com/simple-icons/simple-icons
 */
const SI = (slug: string) =>
  `https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/${slug}.svg`;

export type LogoMeta = { src: string; accent: string };

type LogoDef = { slug: string; hex: string };

const def = (slug: string, hex: string): LogoDef => ({ slug, hex });

/** Known operator list entries → slug + brand color */
const OPERATOR_DEF: Record<string, LogoDef> = {
  "abot-operator": def("redhat", "#EE0000"),
  "airflow-helm": def("apacheairflow", "#017CEE"),
  "ansible-automation": def("ansible", "#EE0000"),
  "bare-metal-event": def("redhatopenshift", "#EE0000"),
  "camel-k": def("apache", "#D22128"),
  "business-automation": def("redhat", "#EE0000"),
  postgresql: def("postgresql", "#4169E1"),
  mongodb: def("mongodb", "#47A248"),
  mysql: def("mysql", "#4479A1"),
  redis: def("redis", "#DC382D"),
  "kafka-strimzi": def("apachekafka", "#231F20"),
  couchbase: def("couchbase", "#EA2328"),
  jenkins: def("jenkins", "#D24939"),
  tekton: def("tekton", "#FD495C"),
  jaeger: def("jaeger", "#66CFE3"),
  kiali: def("istio", "#466BB0"),
  elasticsearch: def("elasticsearch", "#005571"),
  fluentd: def("fluentd", "#0E83C8"),
  minio: def("minio", "#C72C48"),
  "rook-ceph": def("ceph", "#EF5C55"),
  metallb: def("kubernetes", "#326CE5"),
  "nginx-ingress": def("nginx", "#009639"),
  istio: def("istio", "#466BB0"),
  kong: def("kong", "#003459"),
  datadog: def("datadog", "#632CA6"),
  dynatrace: def("dynatrace", "#1496FF"),
  newrelic: def("newrelic", "#1CE783"),
  splunk: def("splunk", "#87C448"),
  "vault-secrets": def("vault", "#FFEC6E"),
  "cert-manager": def("letsencrypt", "#003A70"),
  keycloak: def("keycloak", "#5B47A5"),
  "gpu-operator": def("nvidia", "#76B900"),
  "knative-serving": def("knative", "#0865AD"),
  openfaas: def("openfaas", "#3B5EE9"),
  kubevirt: def("qemu", "#FF6600"),
  crossplane: def("pulumi", "#8A3393"),
  argocd: def("argo", "#EF7B4D"),
  gitops: def("argo", "#EF7B4D"),
  nexus: def("sonatype", "#943196"),
  harbor: def("harbor", "#60B932"),
  portworx: def("netapp", "#0067C5"),
  "argocd-operator-v1": def("argo", "#EF7B4D"),
  "prometheus-v1": def("prometheus", "#E6522C"),
  "cert-manager-v1": def("letsencrypt", "#003A70"),
  "elastic-v1": def("elastic", "#005571"),
  "vault-v1": def("vault", "#FFD814"),
  "grafana-v1": def("grafana", "#F46800"),
};

const HELM_ROTATION: LogoDef[] = [
  def("helm", "#0F1689"),
  def("kubernetes", "#326CE5"),
  def("helm", "#277A9F"),
];
const DEVFILE_ROTATION: LogoDef[] = [
  def("go", "#00ADD8"),
  def("nodedotjs", "#339933"),
  def("python", "#3776AB"),
  def("dotnet", "#512BD4"),
  def("openjdk", "#437291"),
];
const TEMPLATE_ROTATION: LogoDef[] = [
  def("apache", "#D22128"),
  def("nginx", "#009639"),
  def("helm", "#0F1689"),
];
const BUILDER_ROTATION: LogoDef[] = [
  def("docker", "#2496ED"),
  def("podman", "#892CA0"),
  def("redhatopenshift", "#EE0000"),
];
const GENERIC_ROTATION: LogoDef[] = [
  def("kubernetes", "#326CE5"),
  def("redhatopenshift", "#EE0000"),
  def("helm", "#0F1689"),
];

export type LogoCatalogType =
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

function indexFromId(id: string): number {
  const m = id.match(/-(\d+)$/);
  return m ? Math.max(0, parseInt(m[1], 10) - 1) : 0;
}

function metaFromDef(d: LogoDef): LogoMeta {
  return { src: SI(d.slug), accent: d.hex };
}

export function catalogItemLogoMeta(id: string, catalogType: LogoCatalogType): LogoMeta {
  const direct = OPERATOR_DEF[id];
  if (direct) return metaFromDef(direct);

  const i = indexFromId(id);
  switch (catalogType) {
    case "helmCharts":
      return metaFromDef(HELM_ROTATION[i % HELM_ROTATION.length]);
    case "devfiles":
      return metaFromDef(DEVFILE_ROTATION[i % DEVFILE_ROTATION.length]);
    case "templates":
      return metaFromDef(TEMPLATE_ROTATION[i % TEMPLATE_ROTATION.length]);
    case "builderImages":
      return metaFromDef(BUILDER_ROTATION[i % BUILDER_ROTATION.length]);
    default:
      return metaFromDef(GENERIC_ROTATION[i % GENERIC_ROTATION.length]);
  }
}

/** @deprecated Prefer catalogItemLogoMeta for colored masks; kept for callers that only need URL */
export function catalogItemLogoSrc(id: string, catalogType: LogoCatalogType): string {
  return catalogItemLogoMeta(id, catalogType).src;
}
