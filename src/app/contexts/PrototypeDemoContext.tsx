import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { NetworkingNmstateScenario } from "../constants/networkingNmstate";

export type DemoPermission = "edit" | "view" | "no-access";
export type GitOpsDesignOption = "option-a" | "option-b";
export type GitOpsScenario = "paused" | "healthy" | "scaling-down";

/** GITOPS-11005 handoff: agentic run details (default) vs OLS chat first (field-doc / screenshot mock). */
export type GitOpsAiHandoff = "agentic-run" | "lightspeed";

/** Installed Operators OLMv0→v1 migration demo (OCPSTRAT-2692 prototype). */
export type OlmMigrationScenario =
  | "interactive"
  | "preview-dry-run-all-pass"
  | "preview-dry-run-bulk-blocked"
  | "preview-success"
  | "preview-failed-rollback"
  | "preview-errors";

export type { NetworkingNmstateScenario };

/** Networking prototype comparison. 5.2 is the current design; 5.1 hides those additions. */
export type NetworkingRelease = "5.1" | "5.2";

/** Masthead Lightspeed bar. 5.1 includes Chat / Troubleshooting; 5.2 is prompt only. */
export type OlsRelease = "5.1" | "5.2";

const LS_KEY = "ocs-demo-switcher";

type Stored = {
  permission?: DemoPermission;
  gitopsOption?: GitOpsDesignOption;
  gitopsScenario?: GitOpsScenario;
  gitopsAiHandoff?: GitOpsAiHandoff;
  olmMigrationScenario?: OlmMigrationScenario;
  networkingNmstateScenario?: NetworkingNmstateScenario;
  networkingRelease?: NetworkingRelease;
  olsRelease?: OlsRelease;
};

function readStored(): Stored {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}") as Stored;
  } catch {
    return {};
  }
}

function writeStored(next: Stored) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

type PrototypeDemoContextValue = {
  permission: DemoPermission;
  gitopsOption: GitOpsDesignOption;
  gitopsScenario: GitOpsScenario;
  gitopsAiHandoff: GitOpsAiHandoff;
  olmMigrationScenario: OlmMigrationScenario;
  networkingNmstateScenario: NetworkingNmstateScenario;
  networkingRelease: NetworkingRelease;
  olsRelease: OlsRelease;
  setPermission: (v: DemoPermission) => void;
  setGitopsOption: (v: GitOpsDesignOption) => void;
  setGitopsScenario: (v: GitOpsScenario) => void;
  setGitopsAiHandoff: (v: GitOpsAiHandoff) => void;
  setOlmMigrationScenario: (v: OlmMigrationScenario) => void;
  setNetworkingNmstateScenario: (v: NetworkingNmstateScenario) => void;
  setNetworkingRelease: (v: NetworkingRelease) => void;
  setOlsRelease: (v: OlsRelease) => void;
};

const PrototypeDemoContext = createContext<PrototypeDemoContextValue | null>(null);

export function PrototypeDemoProvider({ children }: { children: ReactNode }) {
  const initial = readStored();
  const [permission, setPermissionState] = useState<DemoPermission>(initial.permission ?? "edit");
  const [gitopsOption, setGitopsOptionState] = useState<GitOpsDesignOption>(initial.gitopsOption ?? "option-a");
  const [gitopsScenario, setGitopsScenarioState] = useState<GitOpsScenario>(initial.gitopsScenario ?? "paused");
  const [gitopsAiHandoff, setGitopsAiHandoffState] = useState<GitOpsAiHandoff>(
    initial.gitopsAiHandoff ?? "agentic-run",
  );
  const [olmMigrationScenario, setOlmMigrationScenarioState] = useState<OlmMigrationScenario>(
    initial.olmMigrationScenario ?? "interactive",
  );
  const [networkingNmstateScenario, setNetworkingNmstateScenarioState] = useState<NetworkingNmstateScenario>(
    initial.networkingNmstateScenario ?? "installed",
  );
  const [networkingRelease, setNetworkingReleaseState] = useState<NetworkingRelease>(
    initial.networkingRelease ?? "5.2",
  );
  const [olsRelease, setOlsReleaseState] = useState<OlsRelease>(initial.olsRelease ?? "5.2");

  const persist = useCallback((patch: Stored) => {
    writeStored({ ...readStored(), ...patch });
  }, []);

  const setPermission = useCallback(
    (v: DemoPermission) => {
      setPermissionState(v);
      persist({ permission: v });
      document.dispatchEvent(
        new CustomEvent("demo-switcher-change", { detail: { permission: v } })
      );
    },
    [persist]
  );

  const setGitopsOption = useCallback(
    (v: GitOpsDesignOption) => {
      setGitopsOptionState(v);
      persist({ gitopsOption: v });
      document.dispatchEvent(
        new CustomEvent("demo-switcher-change", { detail: { area: "gitops", option: v } })
      );
    },
    [persist]
  );

  const setGitopsScenario = useCallback(
    (v: GitOpsScenario) => {
      setGitopsScenarioState(v);
      persist({ gitopsScenario: v });
      document.dispatchEvent(
        new CustomEvent("demo-switcher-change", { detail: { area: "gitops", scenario: v } })
      );
    },
    [persist]
  );

  const setGitopsAiHandoff = useCallback(
    (v: GitOpsAiHandoff) => {
      setGitopsAiHandoffState(v);
      persist({ gitopsAiHandoff: v });
      document.dispatchEvent(
        new CustomEvent("demo-switcher-change", { detail: { area: "gitops", aiHandoff: v } })
      );
    },
    [persist],
  );

  const setOlmMigrationScenario = useCallback(
    (v: OlmMigrationScenario) => {
      setOlmMigrationScenarioState(v);
      persist({ olmMigrationScenario: v });
      document.dispatchEvent(
        new CustomEvent("demo-switcher-change", {
          detail: { area: "installed-operators", olmMigrationScenario: v },
        })
      );
    },
    [persist]
  );

  const setNetworkingRelease = useCallback(
    (v: NetworkingRelease) => {
      setNetworkingReleaseState(v);
      persist({ networkingRelease: v });
      document.dispatchEvent(
        new CustomEvent("demo-switcher-change", {
          detail: { area: "networking", networkingRelease: v },
        })
      );
    },
    [persist]
  );

  const setOlsRelease = useCallback(
    (v: OlsRelease) => {
      setOlsReleaseState(v);
      persist({ olsRelease: v });
      document.dispatchEvent(
        new CustomEvent("demo-switcher-change", {
          detail: { area: "lightspeed", olsRelease: v },
        })
      );
    },
    [persist]
  );

  const setNetworkingNmstateScenario = useCallback(
    (v: NetworkingNmstateScenario) => {
      setNetworkingNmstateScenarioState(v);
      persist({ networkingNmstateScenario: v });
      document.dispatchEvent(
        new CustomEvent("demo-switcher-change", {
          detail: { area: "networking", networkingNmstateScenario: v },
        })
      );
    },
    [persist]
  );

  const value = useMemo(
    () => ({
      permission,
      gitopsOption,
      gitopsScenario,
      gitopsAiHandoff,
      olmMigrationScenario,
      networkingNmstateScenario,
      networkingRelease,
      olsRelease,
      setPermission,
      setGitopsOption,
      setGitopsScenario,
      setGitopsAiHandoff,
      setOlmMigrationScenario,
      setNetworkingNmstateScenario,
      setNetworkingRelease,
      setOlsRelease,
    }),
    [
      permission,
      gitopsOption,
      gitopsScenario,
      gitopsAiHandoff,
      olmMigrationScenario,
      networkingNmstateScenario,
      networkingRelease,
      olsRelease,
      setPermission,
      setGitopsOption,
      setGitopsScenario,
      setGitopsAiHandoff,
      setOlmMigrationScenario,
      setNetworkingNmstateScenario,
      setNetworkingRelease,
      setOlsRelease,
    ]
  );

  return <PrototypeDemoContext.Provider value={value}>{children}</PrototypeDemoContext.Provider>;
}

export function usePrototypeDemo(): PrototypeDemoContextValue {
  const ctx = useContext(PrototypeDemoContext);
  if (!ctx) {
    throw new Error("usePrototypeDemo must be used within PrototypeDemoProvider");
  }
  return ctx;
}
