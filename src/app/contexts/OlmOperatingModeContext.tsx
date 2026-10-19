import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Console operating mode for OLM (Classic) vs OLM v1 experiences. */
export type OlmOperatingMode = "classic" | "nextgen";

/** Short labels for tabs, toggles, and toolbar (docs: OLM (Classic) / OLM v1). */
export const OLM_MODE_LABELS: Record<OlmOperatingMode, string> = {
  classic: "OLM (Classic)",
  nextgen: "OLM v1",
};

/** Software Catalog → Version facet (includes resource kind in the label). */
export const OLM_CATALOG_FACET_LABELS: Record<OlmOperatingMode, string> = {
  classic: "OLM (Classic) operators",
  nextgen: "OLM v1 cluster extensions",
};

export const OLM_OPERATOR_PILL_LABELS: Record<"v0" | "v1", string> = {
  v0: "OLM (Classic)",
  v1: "OLM v1",
};

/** Docs-style migration wizard title (OCPSTRAT / IBM Style). */
export const OLM_MIGRATION_WIZARD_TITLE =
  "Migrate OLM (Classic) operators to OLM v1 cluster extensions";

const STORAGE_KEY = "ocp-prototype-olm-operating-mode-v2";

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
