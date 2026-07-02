import { useCallback, useEffect, useState } from "react";
import type { OvtoolsTopologyFilters, OvtoolsTopologyMode } from "./ovtoolsTopologyTypes";

const STORAGE_KEY = "ocs-ovtools-topology-state";

type PersistedState = {
  mode: OvtoolsTopologyMode;
  filters: OvtoolsTopologyFilters;
};

const DEFAULT: PersistedState = {
  mode: "overview",
  filters: { nodeId: "all", vmStatus: "all", search: "" },
};

function readState(): PersistedState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      mode: parsed.mode ?? DEFAULT.mode,
      filters: { ...DEFAULT.filters, ...parsed.filters },
    };
  } catch {
    return DEFAULT;
  }
}

export function useOvtoolsTopologyState() {
  const [mode, setModeState] = useState<OvtoolsTopologyMode>(() => readState().mode);
  const [filters, setFiltersState] = useState<OvtoolsTopologyFilters>(() => readState().filters);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, filters }));
  }, [mode, filters]);

  const setMode = useCallback((next: OvtoolsTopologyMode) => setModeState(next), []);
  const setFilters = useCallback((partial: Partial<OvtoolsTopologyFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  return { mode, setMode, filters, setFilters };
}
