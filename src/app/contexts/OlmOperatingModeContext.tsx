import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Console operating mode: Classic operators vs cluster extensions. */
export type OlmOperatingMode = "classic" | "nextgen";

/** Tabs, toggles, and cross-page mode labels (what is installed). */
export const OLM_MODE_LABELS: Record<OlmOperatingMode, string> = {
  classic: "Classic operators",
  nextgen: "Cluster extensions",
};

/** Software Catalog sidebar facet labels. */
export const OLM_CATALOG_FACET_LABELS: Record<OlmOperatingMode, string> = {
  classic: "Classic operators",
  nextgen: "Cluster extensions",
};

/** One-line gloss for Software Catalog and Installed Operators toolbars. */
export const OLM_MODE_GLOSS =
  "Classic is subscription-based operators; cluster extensions use the cluster extension catalog. Install new software as cluster extensions; migrate Classic operators when you are ready.";

export const OLM_MIGRATION_WIZARD_TITLE = "Migrate Classic operators to cluster extensions";

const STORAGE_KEY = "ocp-prototype-olm-operating-mode-v3";

function readMode(): OlmOperatingMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "classic" || raw === "nextgen") return raw;
  } catch {
    /* ignore */
  }
  return "nextgen";
}

type OlmOperatingModeContextValue = {
  mode: OlmOperatingMode;
  setMode: (mode: OlmOperatingMode) => void;
  isClassic: boolean;
  isNextGen: boolean;
};

const OlmOperatingModeContext = createContext<OlmOperatingModeContextValue | null>(null);

export function OlmOperatingModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<OlmOperatingMode>(() => readMode());

  const setMode = useCallback((next: OlmOperatingMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  // Prototype bridge: demo switcher can set mode without reload.
  useEffect(() => {
    const onSwitcher = (ev: Event) => {
      const detail = (ev as CustomEvent<{ area?: string; option?: string }>).detail;
      if (!detail || detail.area !== "ecosystem") return;
      if (detail.option === "classic" || detail.option === "olmv0") setMode("classic");
      if (detail.option === "nextgen" || detail.option === "olmv1") setMode("nextgen");
    };
    document.addEventListener("demo-switcher-change", onSwitcher as EventListener);
    return () => document.removeEventListener("demo-switcher-change", onSwitcher as EventListener);
  }, [setMode]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      isClassic: mode === "classic",
      isNextGen: mode === "nextgen",
    }),
    [mode, setMode],
  );

  return <OlmOperatingModeContext.Provider value={value}>{children}</OlmOperatingModeContext.Provider>;
}

export function useOlmOperatingMode(): OlmOperatingModeContextValue {
  const ctx = useContext(OlmOperatingModeContext);
  if (!ctx) {
    throw new Error("useOlmOperatingMode must be used within OlmOperatingModeProvider");
  }
  return ctx;
}
