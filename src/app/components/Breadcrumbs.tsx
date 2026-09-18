import type { ReactNode } from "react";
import { Breadcrumb, BreadcrumbItem } from "@patternfly/react-core";
import { css } from "@patternfly/react-styles";
import spacingStyles from "@patternfly/react-styles/css/utilities/Spacing/spacing.mjs";
import { Link } from "react-router";

interface BreadcrumbItemData {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItemData[];
  /** Optional PatternFly utility classes (e.g. from @patternfly/react-styles) merged onto the breadcrumb strip. */
  className?: string;
  /** Main page body after breadcrumbs — wrapped in PatternFly page main section (no limit-width; that applies to the tabs/breadcrumb strip). */
  children?: ReactNode;
}

export default function Breadcrumbs({ items, className, children }: BreadcrumbsProps) {
  const visibleItems = items.filter((item) => item.label !== "Home");
  const breadcrumbStripClass = [css(spacingStyles.mbMd), "pf-v6-c-page__main-breadcrumb", className]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <section className="pf-v6-c-page__main-tabs pf-m-limit-width">
        <section className={breadcrumbStripClass}>
      <Breadcrumb>
      {visibleItems.map((item, index) => {
        const isLast = index === visibleItems.length - 1;

        if (isLast) {
          return (
            <BreadcrumbItem key={index} isActive>
              {item.label}
            </BreadcrumbItem>
          );
        }

        if (item.path) {
          return (
            <BreadcrumbItem
              key={index}
              render={({ className: linkClass, ariaCurrent }) => (
                <Link to={item.path!} className={linkClass} aria-current={ariaCurrent ?? undefined}>
                  {item.label}
                </Link>
              )}
            />
          );
        }

        return <BreadcrumbItem key={index}>{item.label}</BreadcrumbItem>;
      })}
      </Breadcrumb>
        </section>
      </section>
      {children != null && children !== false ? (
        <section className="pf-v6-c-page__main-section">{children}</section>
      ) : null}
    </>
  );
}
