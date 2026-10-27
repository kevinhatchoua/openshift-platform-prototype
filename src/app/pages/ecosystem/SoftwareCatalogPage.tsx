import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Alert,
  AlertActionCloseButton,
  AlertActionLink,
  AlertGroup,
  Content,
  Drawer,
  DrawerContent,
  DrawerPanelContent,
} from "@patternfly/react-core";
import {
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
} from "@/lib/pfIcons";
import Breadcrumbs from "../../components/Breadcrumbs";
import { OlmClassicExperienceBanner } from "../../components/ecosystem/OlmClassicExperienceBanner";
import CatalogOperatorDetailPanel from "../../components/CatalogOperatorDetailPanel";
import {
  OLM_CATALOG_FACET_LABELS,
  useOlmOperatingMode,
} from "../../contexts/OlmOperatingModeContext";
import {
  parseOperatorCatalogFilter,
  type OperatorCatalogFilter,
} from "../../components/ecosystem/olmCatalogRoutes";
import { CatalogBrandLogo } from "./CatalogBrandLogo";
import type { LogoCatalogType } from "./catalogLogos";
import { OPERATOR_HUB_CATALOG_OPERATORS } from "../../data/operatorHubCatalog";

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

/** Sidebar Type facet: one active choice at a time. Operator type uses the Catalog facet for OLM mode. */
type TypeFacetId =
  | "operators"
  | "builderImages"
  | "devfiles"
  | "helmCharts"
  | "templates"
  | string;

function TypeFacetOption({
  label,
  selected,
  onClick,
  badge,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-current={selected ? "true" : undefined}
      className={[
        "ocs-software-catalog-type-facet",
        selected ? "ocs-software-catalog-type-facet--selected" : "",
      ].join(" ")}
    >
      <span className="ocs-software-catalog-type-facet__label">{label}</span>
      {badge ? <span className="ocs-software-catalog-type-facet__badge">{badge}</span> : null}
    </button>
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { setMode } = useOlmOperatingMode();
  /** OCPSTRAT-3644: catalog facet selects Next-Gen (default) or Classic operator packages. */
  const [operatorCatalogFilter, setOperatorCatalogFilter] = useState<OperatorCatalogFilter>(
    () => parseOperatorCatalogFilter(searchParams.get("catalog")) ?? "nextgen",
  );
  const setCatalogFilter = useCallback(
    (next: OperatorCatalogFilter) => {
      setOperatorCatalogFilter(next);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === "nextgen") {
            params.delete("catalog");
          } else {
            params.set("catalog", next);
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogSort, setCatalogSort] = useState<"relevance" | "name">("relevance");
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "Catalog",
    "Type",
    "Capabilities",
    "Source",
    "Provider",
    "Valid subscription",
  ]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [selectedTypeFacet, setSelectedTypeFacet] = useState<TypeFacetId>("operators");
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [showAllProviders, setShowAllProviders] = useState(false);
  const [subscriptionFacet, setSubscriptionFacet] = useState<Record<string, boolean>>({});

  const [filters, setFilters] = useState({
    source: [] as string[],
    provider: [] as string[],
  });

  useEffect(() => {
    const fromUrl = parseOperatorCatalogFilter(searchParams.get("catalog"));
    if (fromUrl && fromUrl !== operatorCatalogFilter) {
      setOperatorCatalogFilter(fromUrl);
      setSelectedTypeFacet("operators");
    }
  }, [searchParams, operatorCatalogFilter]);

  useEffect(() => {
    if (selectedTypeFacet !== "operators") {
      return;
    }
    if (operatorCatalogFilter === "nextgen") {
      setMode("nextgen");
    } else if (operatorCatalogFilter === "classic") {
      setMode("classic");
    }
  }, [operatorCatalogFilter, setMode, selectedTypeFacet]);

  const OLM_V1_CATALOG_OPERATORS: Array<Omit<CatalogItem, "catalogType">> = OPERATOR_HUB_CATALOG_OPERATORS.map(
    (op) => ({
      ...op,
      id: `${op.id}-olm-v1`,
      olmVersion: "v1",
      description: op.description.endsWith(".")
        ? `${op.description.slice(0, -1)} — Cluster extension packaging.`
        : `${op.description} — Cluster extension packaging.`,
    }),
  );

  const RAW_OPERATORS = [...OPERATOR_HUB_CATALOG_OPERATORS, ...OLM_V1_CATALOG_OPERATORS];

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

  const selectCatalogFacet = useCallback(
    (filter: OperatorCatalogFilter) => {
      setCatalogFilter(filter);
      setSelectedTypeFacet("operators");
    },
    [setCatalogFilter],
  );

  const selectTypeFacet = useCallback((id: TypeFacetId) => {
    setSelectedTypeFacet(id);
    setFilters((prev) => ({ ...prev, source: [], provider: [] }));
    setSubscriptionFacet({});
  }, []);

  const toggleSubscriptionFacet = (id: string) => {
    setSubscriptionFacet((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  function getSelectedCatalogTypes(): CatalogItemKind[] {
    switch (selectedTypeFacet) {
      case "operators":
        return ["operators"];
      case "builderImages":
      case "devfiles":
      case "helmCharts":
      case "templates":
        return [selectedTypeFacet];
      default:
        if (EXTRA_TYPE_FACETS.some((row) => row.id === selectedTypeFacet)) {
          return [selectedTypeFacet as CatalogItemKind];
        }
        return ["operators"];
    }
  }

  const isOperatorTypeFacet = selectedTypeFacet === "operators";

  /** Facet counts exclude the facet group being counted so tallies stay meaningful with multi-select. */
  function matchesCatalogItem(
    item: CatalogItem,
    skips?: {
      skipSearch?: boolean;
      skipOlmMode?: boolean;
      skipSource?: boolean;
      skipProvider?: boolean;
      skipType?: boolean;
    },
  ): boolean {
    if (!skips?.skipSearch && searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (!skips?.skipOlmMode && item.catalogType === "operators") {
      if (operatorCatalogFilter === "nextgen" && item.olmVersion !== "v1") {
        return false;
      }
      if (operatorCatalogFilter === "classic" && item.olmVersion !== "v0") {
        return false;
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

  const classicOperatorCount = catalogItems.filter(
    (i) =>
      i.catalogType === "operators" &&
      i.olmVersion === "v0" &&
      matchesCatalogItem(i, { skipType: true, skipOlmMode: true }),
  ).length;
  const nextGenOperatorCount = catalogItems.filter(
    (i) =>
      i.catalogType === "operators" &&
      i.olmVersion === "v1" &&
      matchesCatalogItem(i, { skipType: true, skipOlmMode: true }),
  ).length;

  const facetCounts = {
    operators: countItemsOfType("operators"),
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

  function catalogRelevanceRank(item: CatalogItem): number {
    if (item.catalogType !== "operators") {
      return 0;
    }
    if (item.olmVersion === "v1") {
      return 1;
    }
    if (item.olmVersion === "v0") {
      return 2;
    }
    return 1;
  }

  const filteredCatalogItems = catalogItems
    .filter((item) => matchesCatalogItem(item))
    .sort((a, b) => {
      if (catalogSort === "name") {
        return a.name.localeCompare(b.name);
      }
      const rankDiff = catalogRelevanceRank(a) - catalogRelevanceRank(b);
      if (rankDiff !== 0) {
        return rankDiff;
      }
      return a.name.localeCompare(b.name);
    });

  const handleCatalogItemClick = (item: CatalogItem) => {
    setSelectedCatalogItem(item);
    setShowSidePanel(true);
  };

  const catalogDetailPanel =
    selectedCatalogItem && showSidePanel ? (
      <DrawerPanelContent
        isPlain
        hasNoGlass
        widths={{ default: "width_100", lg: "width_50" }}
        focusTrap={{ enabled: true }}
        className="ocs-software-catalog-drawer__panel"
      >
        <CatalogOperatorDetailPanel
          olmVersion={selectedCatalogItem.olmVersion === "v1" ? "v1" : "v0"}
          item={{
            id: selectedCatalogItem.id,
            name: selectedCatalogItem.name,
            provider: selectedCatalogItem.provider,
            providerType: selectedCatalogItem.providerType,
            description: selectedCatalogItem.description,
            installed: selectedCatalogItem.installed,
            hasUpdate: selectedCatalogItem.hasUpdate,
            newVersion: selectedCatalogItem.newVersion,
            currentVersion: selectedCatalogItem.currentVersion,
            catalogType: selectedCatalogItem.catalogType,
            typeLabel: CATALOG_TYPE_LABEL[selectedCatalogItem.catalogType],
          }}
          onClose={() => {
            setShowSidePanel(false);
            setSelectedCatalogItem(null);
          }}
          onInstall={() => {
            if (!selectedCatalogItem) return;
            const state = {
              id: selectedCatalogItem.id,
              name: selectedCatalogItem.name,
              provider: selectedCatalogItem.provider,
              version: selectedCatalogItem.currentVersion ?? "0.16.0",
              channel: "stable",
            };
            if (selectedCatalogItem.olmVersion === "v1") {
              navigate(`/ecosystem/software-catalog/${selectedCatalogItem.id}/create-cluster-extension`, {
                state,
              });
            } else {
              navigate(`/ecosystem/software-catalog/${selectedCatalogItem.id}/install`, { state });
            }
            setShowSidePanel(false);
          }}
          onCreate={() => {
            if (!selectedCatalogItem) return;
            navigate(`/ecosystem/software-catalog/${selectedCatalogItem.id}/install`, {
              state: {
                id: selectedCatalogItem.id,
                name: selectedCatalogItem.name,
                provider: selectedCatalogItem.provider,
              },
            });
            setShowSidePanel(false);
          }}
          onUpdate={() => {
            navigate(`/ecosystem/software-catalog/${selectedCatalogItem.id}/update`);
            setShowSidePanel(false);
          }}
          onViewDetails={() => {
            navigate(`/ecosystem/software-catalog/${selectedCatalogItem.id}`);
            setShowSidePanel(false);
          }}
        />
      </DrawerPanelContent>
    ) : null;

  return (
    <Drawer
      isExpanded={showSidePanel && !!selectedCatalogItem}
      position="end"
      className="ocs-software-catalog-drawer"
    >
      <DrawerContent panelContent={catalogDetailPanel}>
    <div className="ocs-app-page-outer h-full min-h-0 overflow-y-auto">
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
            software catalog. Choose a <strong>Type</strong> in the sidebar; for operators, pick a{" "}
            <strong>Version</strong> ({OLM_CATALOG_FACET_LABELS.nextgen} is the default).
          </p>
        </Content>

        {isOperatorTypeFacet && operatorCatalogFilter === "classic" ? (
          <OlmClassicExperienceBanner />
        ) : null}

        {isOperatorTypeFacet && availableUpdates > 0 && !dismissedAlerts.includes("updates") && (
          <AlertGroup className="mb-4">
            <Alert
              variant="info"
              isInline
              title={`${availableUpdates} updates available`}
              actionClose={
                <AlertActionCloseButton onClose={() => setDismissedAlerts((prev) => [...prev, "updates"])} />
              }
              actionLinks={
                <AlertActionLink component={Link} to="/ecosystem/installed-operators">
                  Manage updates
                </AlertActionLink>
              }
            >
              Keep your cluster secure by updating your software.
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
                  <ChevronUp className="size-[14px]" />
                ) : (
                  <ChevronDown className="size-[14px]" />
                )}
              </button>
              {expandedCategories.includes("Type") && (
                <div className="space-y-[2px] pl-[4px]">
                  <TypeFacetOption
                    label={`Operators (${countItemsOfType("operators")})`}
                    selected={selectedTypeFacet === "operators"}
                    onClick={() => selectTypeFacet("operators")}
                  />
                  <TypeFacetOption
                    label={`Builder Images (${countItemsOfType("builderImages")})`}
                    selected={selectedTypeFacet === "builderImages"}
                    onClick={() => selectTypeFacet("builderImages")}
                  />
                  <TypeFacetOption
                    label={`Devfiles (${countItemsOfType("devfiles")})`}
                    selected={selectedTypeFacet === "devfiles"}
                    onClick={() => selectTypeFacet("devfiles")}
                  />
                  <TypeFacetOption
                    label={`Helm Charts (${countItemsOfType("helmCharts")})`}
                    selected={selectedTypeFacet === "helmCharts"}
                    onClick={() => selectTypeFacet("helmCharts")}
                  />
                  <TypeFacetOption
                    label={`Templates (${countItemsOfType("templates")})`}
                    selected={selectedTypeFacet === "templates"}
                    onClick={() => selectTypeFacet("templates")}
                  />
                  {showAllTypes &&
                    EXTRA_TYPE_FACETS.map((row) => (
                      <TypeFacetOption
                        key={row.id}
                        label={`${row.label} (${countItemsOfType(row.id as CatalogItemKind)})`}
                        selected={selectedTypeFacet === row.id}
                        onClick={() => selectTypeFacet(row.id)}
                      />
                    ))}
                  <button
                    type="button"
                    className="mt-[6px] text-[#0066cc] dark:text-[#4dabf7] hover:underline text-[13px]"
                    onClick={() => setShowAllTypes(!showAllTypes)}
                  >
                    {showAllTypes ? "Hide" : `Show all (${EXTRA_TYPE_FACETS.length} more)`}
                  </button>
                </div>
              )}
            </div>

            {isOperatorTypeFacet ? (
              <>
            {/* Catalog (Classic operators vs cluster extensions) */}
            <div className="mb-[16px]">
              <button
                onClick={() => toggleCategory("Catalog")}
                className="w-full flex items-center justify-between mb-[8px] text-[14px] font-semibold text-[#151515] dark:text-white"
              >
                <span>Catalog</span>
                {expandedCategories.includes("Catalog") ? (
                  <ChevronUp className="size-[14px]" />
                ) : (
                  <ChevronDown className="size-[14px]" />
                )}
              </button>
              {expandedCategories.includes("Catalog") && (
                <div className="space-y-[8px] pl-[4px]">
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input
                      type="checkbox"
                      className="size-[14px]"
                      checked={operatorCatalogFilter === "nextgen"}
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectCatalogFacet("nextgen");
                        }
                      }}
                    />
                    <span>{OLM_CATALOG_FACET_LABELS.nextgen} ({nextGenOperatorCount})</span>
                  </label>
                  <label className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#151515] dark:text-white">
                    <input
                      type="checkbox"
                      className="size-[14px]"
                      checked={operatorCatalogFilter === "classic"}
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectCatalogFacet("classic");
                        }
                      }}
                    />
                    <span className="flex items-center gap-[6px] flex-wrap">
                      {OLM_CATALOG_FACET_LABELS.classic} ({classicOperatorCount})
                      <span className="ocs-software-catalog-type-facet__badge">Deprecated</span>
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Source Filter */}
            <div className="mb-[16px]">
              <button
                onClick={() => toggleCategory("Source")}
                className="w-full flex items-center justify-between mb-[8px] text-[14px] font-semibold text-[#151515] dark:text-white"
              >
                <span>Source</span>
                {expandedCategories.includes("Source") ? (
                  <ChevronUp className="size-[14px]" />
                ) : (
                  <ChevronDown className="size-[14px]" />
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
                  <ChevronUp className="size-[14px]" />
                ) : (
                  <ChevronDown className="size-[14px]" />
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
                  <ChevronUp className="size-[14px]" />
                ) : (
                  <ChevronDown className="size-[14px]" />
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
              </>
            ) : null}
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

            {filteredCatalogItems.length === 0 ? (
              <Alert
                variant={operatorCatalogFilter === "nextgen" ? "info" : "warning"}
                isInline
                title={
                  operatorCatalogFilter === "nextgen"
                    ? "No compatible cluster extensions in this catalog"
                    : "No catalog items match your filters"
                }
              >
                {operatorCatalogFilter === "nextgen"
                  ? `The ${OLM_CATALOG_FACET_LABELS.nextgen} catalog lists packages that pass compatibility checks for this cluster. Try adjusting filters or include ${OLM_CATALOG_FACET_LABELS.classic}.`
                  : `Try adjusting search or facet filters, or switch the Catalog filter to ${OLM_CATALOG_FACET_LABELS.nextgen}.`}
              </Alert>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[16px]">
              {filteredCatalogItems.map((item) => {
                return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleCatalogItemClick(item)}
                  className="ocs-software-catalog-card flex h-full min-h-[220px] flex-col border border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.14)] rounded-[12px] p-[18px] text-left hover:shadow-[0px_4px_16px_0px_rgba(0,0,0,0.12)] dark:hover:border-[rgba(255,255,255,0.22)] transition-all"
                >
                  <div className="flex justify-between items-start gap-[12px] mb-[16px]">
                    <CatalogBrandLogo
                      id={item.id}
                      displayName={item.name}
                      catalogType={item.catalogType as LogoCatalogType}
                      boxClassName="relative size-[40px] rounded-[6px] bg-white dark:bg-[#ececec] flex items-center justify-center p-[6px] shrink-0 border border-[rgba(0,0,0,0.08)] dark:border-[rgba(0,0,0,0.12)]"
                      logoClassName="h-[28px] w-[28px] max-h-[28px] max-w-[28px]"
                    />
                    {item.catalogType !== "operators" ? (
                      <div className="flex flex-col items-end gap-[6px] shrink-0 max-w-[min(148px,48%)]">
                        <span className="rounded-full px-[10px] py-[4px] text-[11px] font-semibold leading-tight bg-[#5c5f62] text-white text-right">
                          {catalogCardPillLabel(item)}
                        </span>
                      </div>
                    ) : null}
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
      </DrawerContent>
    </Drawer>
  );
}
