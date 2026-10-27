import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "ocs-topology-developer-mode";
const SCALE_KEY = "ocs-topology-scale-target";

export const TOPOLOGY_SCALE_PRESETS = [100, 500, 1000, 2500] as const;
export const HIGH_SCALE_THRESHOLD = 48;

type DeveloperModeState = {
  enabled: boolean;
  scaleTarget: number;
};

let state: DeveloperModeState = readPersisted();
const listeners = new Set<() => void>();

function readPersisted(): DeveloperModeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const scaleRaw = localStorage.getItem(SCALE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<DeveloperModeState>) : {};
    return {
      enabled: Boolean(parsed.enabled),
      scaleTarget: scaleRaw ? Number(scaleRaw) : TOPOLOGY_SCALE_PRESETS[2],
    };
  } catch {
    return { enabled: false, scaleTarget: TOPOLOGY_SCALE_PRESETS[2] };
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: state.enabled }));
  localStorage.setItem(SCALE_KEY, String(state.scaleTarget));
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeTopologyDeveloperMode(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTopologyDeveloperMode(): DeveloperModeState {
  return state;
}

export function setTopologyDeveloperMode(enabled: boolean) {
  if (state.enabled === enabled) return;
  state = { ...state, enabled };
  persist();
  emit();
}

export function setTopologyScaleTarget(scaleTarget: number) {
  if (state.scaleTarget === scaleTarget) return;
  state = { ...state, scaleTarget };
  persist();
  emit();
}

export function useTopologyDeveloperMode() {
  const snapshot = useSyncExternalStore(subscribeTopologyDeveloperMode, getTopologyDeveloperMode, getTopologyDeveloperMode);
  const setEnabled = useCallback((enabled: boolean) => setTopologyDeveloperMode(enabled), []);
  const setScaleTarget = useCallback((scaleTarget: number) => setTopologyScaleTarget(scaleTarget), []);
  return { ...snapshot, setEnabled, setScaleTarget };
}

export function shouldUseCytoscapeEngine(resourceCount: number, developerMode: boolean) {
  return developerMode || resourceCount >= HIGH_SCALE_THRESHOLD;
}
