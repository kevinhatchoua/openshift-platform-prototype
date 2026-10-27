import { useState, type CSSProperties } from "react";
import { catalogItemLogoMeta, normalizeOperatorHubCatalogId, type LogoCatalogType } from "./catalogLogos";

type CatalogBrandLogoProps = {
  id: string;
  catalogType: LogoCatalogType;
  /** Display name for letter fallback when the icon URL fails */
  displayName?: string;
  /** Outer wrapper (e.g. rounded box behind logo) */
  boxClassName?: string;
  /** Inner colored mask size (Tailwind classes for w/h) */
  logoClassName: string;
};

/**
 * Renders a Simple Icons glyph in its brand color using CSS mask (monochrome SVG → tinted shape).
 * Falls back to a branded initial so tiles never show an empty box.
 */
export function CatalogBrandLogo({
  id,
  catalogType,
  displayName,
  boxClassName,
  logoClassName,
}: CatalogBrandLogoProps) {
  const baseId = catalogType === "operators" ? normalizeOperatorHubCatalogId(id) : id;
  const { src, accent } = catalogItemLogoMeta(id, catalogType);
  const [maskFailed, setMaskFailed] = useState(false);

  const initial = (displayName ?? baseId).replace(/[^a-zA-Z0-9]/g, "").charAt(0).toUpperCase() || "O";

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
      {!maskFailed ? (
        <img
          className={logoClassName}
          src={src}
          alt=""
          style={{ opacity: 0, position: "absolute", width: 1, height: 1, pointerEvents: "none" }}
          onError={() => setMaskFailed(true)}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (!img.naturalWidth) setMaskFailed(true);
          }}
        />
      ) : null}
      {!maskFailed ? (
        <div className={logoClassName} style={maskStyle} />
      ) : (
        <div
          className={`${logoClassName} flex items-center justify-center font-semibold text-[14px]`}
          style={{ backgroundColor: accent, color: "#fff", borderRadius: 4 }}
        >
          {initial}
        </div>
      )}
    </div>
  );
}
