import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import type { ClusterUpdateDemoVariant } from "../components/AiAssessmentSection";

export const CLUSTER_UPDATE_DEMO_VARIANT_KEY = "ocp5-cluster-update-demo-variant";

function readVariant(): ClusterUpdateDemoVariant {
  try {
    /** Session-scoped: new tab/window starts on agent-led; choice persists while navigating in-session. */
    const raw = sessionStorage.getItem(CLUSTER_UPDATE_DEMO_VARIANT_KEY);
    if (raw === "manual-and-agent") return "manual-and-agent";
    if (raw === "agent-only") return "agent-only";
  } catch {
    /* ignore */
  }
  return "agent-only";
}

type ClusterUpdateDemoContextValue = {
  demoVariant: ClusterUpdateDemoVariant;
  setDemoVariant: (v: ClusterUpdateDemoVariant) => void;
  /** Increments when masthead Reset demo runs — Cluster Update page resets local prototype state. */
  clusterUpdateDemoResetEpoch: number;
  /** Clears in-progress flag, bumps epoch, navigates to Cluster Update plan. Always available (masthead). */
  performClusterUpdateDemoReset: () => void;
};

const ClusterUpdateDemoContext = createContext<ClusterUpdateDemoContextValue | null>(null);

export function ClusterUpdateDemoProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [demoVariant, setDemoVariantState] = useState<ClusterUpdateDemoVariant>(() => readVariant());
  const [clusterUpdateDemoResetEpoch, setClusterUpdateDemoResetEpoch] = useState(0);

  const setDemoVariant = useCallback((v: ClusterUpdateDemoVariant) => {
    setDemoVariantState(v);
    try {
      sessionStorage.setItem(CLUSTER_UPDATE_DEMO_VARIANT_KEY, v === "agent-only" ? "agent-only" : "manual-and-agent");
    } catch {
      /* ignore */
    }
  }, []);

  const performClusterUpdateDemoReset = useCallback(() => {
    try {
      localStorage.removeItem("clusterUpdateInProgress");
      sessionStorage.setItem(CLUSTER_UPDATE_DEMO_VARIANT_KEY, "agent-only");
    } catch {
      /* ignore */
    }
    setDemoVariantState("agent-only");
    setClusterUpdateDemoResetEpoch((n) => n + 1);
    navigate("/administration/cluster-update", { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({
      demoVariant,
      setDemoVariant,
      clusterUpdateDemoResetEpoch,
      performClusterUpdateDemoReset,
    }),
    [demoVariant, setDemoVariant, clusterUpdateDemoResetEpoch, performClusterUpdateDemoReset]
  );

  return <ClusterUpdateDemoContext.Provider value={value}>{children}</ClusterUpdateDemoContext.Provider>;
}

export function useClusterUpdateDemoVariant(): ClusterUpdateDemoContextValue {
  const ctx = useContext(ClusterUpdateDemoContext);
  if (!ctx) {
    throw new Error("useClusterUpdateDemoVariant must be used within ClusterUpdateDemoProvider");
  }
  return ctx;
}
