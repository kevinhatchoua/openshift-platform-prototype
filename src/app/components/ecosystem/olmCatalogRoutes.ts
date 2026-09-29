/** Query for Software Catalog sidebar — Next-Gen Operators facet (OCPSTRAT-3644 banner CTA). */
export const NEXT_GEN_CATALOG_SEARCH = "catalog=nextgen";

export const NEXT_GEN_CATALOG_PATH = `/ecosystem/software-catalog?${NEXT_GEN_CATALOG_SEARCH}`;

export type OperatorCatalogFilter = "nextgen" | "classic";

export function parseOperatorCatalogFilter(
  value: string | null,
): OperatorCatalogFilter | null {
  if (value === "nextgen" || value === "classic") {
    return value;
  }
  if (value === "all") {
    return "nextgen";
  }
  return null;
}
