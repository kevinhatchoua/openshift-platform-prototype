import type { SVGProps } from "react";

/**
 * Red Hat UI — AI experience indicator (rh-ui-icon-ai-experience): primary four-point sparkle with a
 * smaller sparkle offset upper-right. Use `currentColor` so it matches surrounding UI (no purple “AI theming”).
 */
export function RhAiExperienceIcon({ className, style, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
      className={className}
      style={{ width: "1em", height: "1em", verticalAlign: "middle", ...style }}
      {...rest}
    >
      {/* Primary sparkle — four-point star (RH ai-experience style) */}
      <path d="M10 1.5L11.6 6.5 17 8l-5.4 1.5L10 15 8.4 9.5 3 8l5.4-1.5L10 1.5z" />
      {/* Secondary sparkle — upper right */}
      <path d="M19.2 3.3L19.6 4.7L21 5.1L19.6 5.5L19.2 6.9L18.8 5.5L17.4 5.1L18.8 4.7L19.2 3.3z" />
    </svg>
  );
}
