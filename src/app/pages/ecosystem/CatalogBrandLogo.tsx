import type { CSSProperties } from "react";
import { catalogItemLogoMeta, type LogoCatalogType } from "./catalogLogos";

type CatalogBrandLogoProps = {
  id: string;
  catalogType: LogoCatalogType;
  /** Outer wrapper (e.g. rounded box behind logo) */
  boxClassName?: string;
  /** Inner colored mask size (Tailwind classes for w/h) */
  logoClassName: string;
};

/**
 * Renders a Simple Icons glyph in its brand color using CSS mask (monochrome SVG → tinted shape).
 */
export function CatalogBrandLogo({ id, catalogType, boxClassName, logoClassName }: CatalogBrandLogoProps) {
  const { src, accent } = catalogItemLogoMeta(id, catalogType);

  const maskStyle: CSSProperties = {
    backgroundColor: accent,
    WebkitMaskImage: `url(${src})`,
    WebkitMaskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskImage: `url(${src})`,
    maskSize: "contain",
    maskRepeat: "no-repeat",
    maskPosition: "center",
  };

  return (
    <div className={boxClassName} aria-hidden>
      <div className={logoClassName} style={maskStyle} />
    </div>
  );
}
