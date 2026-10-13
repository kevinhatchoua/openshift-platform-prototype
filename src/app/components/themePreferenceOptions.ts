import type { ColorScheme, ContrastMode } from "@/lib/documentTheme";

export const CONTRAST_MODE_SELECT_OPTIONS: { value: ContrastMode; label: string }[] = [
  { value: "default", label: "Traditional" },
  { value: "glass", label: "Glass" },
  { value: "high-contrast", label: "High contrast" },
  { value: "system", label: "System default" },
];

export const COLOR_SCHEME_SELECT_OPTIONS: { value: ColorScheme; label: string }[] = [
  { value: "light", label: "Light mode" },
  { value: "dark", label: "Dark mode" },
  { value: "system", label: "System default" },
];
