import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Button, PageSection } from "@patternfly/react-core";
import SortCommonAscIcon from "@patternfly/react-icons/dist/esm/icons/pficon-sort-common-asc-icon";
import { InnerScrollContainer, Table } from "@patternfly/react-table";

/** Shared PatternFly table class — matches Installed Operators list styling. */
export const OCS_PROTOTYPE_TABLE_CLASS = "ocs-io-operator-table";

/** DataView wrapper class used across prototype list pages. */
export const OCS_PROTOTYPE_DATAVIEW_CLASS = "ocs-io-dataview";

/** Toolbar alignment class — filters left, pagination right. */
export const OCS_PROTOTYPE_TOOLBAR_CLASS =
  "ocs-io-dataview-toolbar pf-m-toggle-group-container ocs-io-dv-toolbar-align";

export type SortDirection = "asc" | "desc";

export function useTableSort<T extends string>(defaultColumn: T, defaultDirection: SortDirection = "asc") {
  const [sortColumn, setSortColumn] = useState<T>(defaultColumn);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection);

  const toggleSort = useCallback(
    (col: T) => {
      if (col !== sortColumn) {
        setSortColumn(col);
        setSortDirection("asc");
      } else {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      }
    },
    [sortColumn]
  );

  return { sortColumn, sortDirection, toggleSort, setSortColumn, setSortDirection };
}

export function compareStrings(a: string, b: string, direction: SortDirection) {
  const cmp = a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });
  return direction === "asc" ? cmp : -cmp;
}

type SortableHeaderProps<T extends string> = {
  label: string;
  column: T;
  sortColumn: T;
  sortDirection: SortDirection;
  onSort: (col: T) => void;
};

export function SortableTableHeader<T extends string>({
  label,
  column,
  sortColumn,
  sortDirection,
  onSort,
}: SortableHeaderProps<T>) {
  const active = sortColumn === column;
  const isDesc = active && sortDirection === "desc";
  return (
    <Button
      className="ocs-operator-table-sort"
      variant="plain"
      onClick={() => onSort(column)}
      isInline
      iconPosition="end"
      icon={
        <SortCommonAscIcon
          className={[
            "ocs-operator-table-sort-glyph",
            active ? "ocs-operator-table-sort-icon--active" : "ocs-operator-table-sort-icon--idle",
          ]
            .filter(Boolean)
            .join(" ")}
          style={isDesc ? { transform: "rotate(180deg)" } : undefined}
          aria-hidden
        />
      }
    >
      {label}
    </Button>
  );
}

export function PlainTableHeader({ label }: { label: string }) {
  return (
    <Button
      className="ocs-operator-table-sort ocs-operator-table-header-static"
      component="div"
      variant="plain"
      isInline
      tabIndex={-1}
    >
      {label}
    </Button>
  );
}

export function OcsPrototypeListTable({
  ariaLabel,
  children,
}: {
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <PageSection aria-label={ariaLabel} padding={{ default: "noPadding" }}>
      <InnerScrollContainer>
        <Table aria-label={ariaLabel} borders variant="compact" className={OCS_PROTOTYPE_TABLE_CLASS}>
          {children}
        </Table>
      </InnerScrollContainer>
    </PageSection>
  );
}

export function useListPagination<T>(
  items: T[],
  deps: unknown[] = [],
  defaultPerPage = 20
) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPerPage);

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, page, perPage]);

  return { page, setPage, perPage, setPerPage, paginated, itemCount: items.length };
}
