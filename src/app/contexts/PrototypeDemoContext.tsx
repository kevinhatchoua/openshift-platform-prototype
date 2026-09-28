import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type DemoPermission = "edit" | "view" | "no-access";
export type GitOpsDesignOption = "option-a" | "option-b";
export type GitOpsScenario = "paused" | "healthy" | "scaling-down";

/** Installed Operators OLMv0→v1 migration demo (OCPSTRAT-2692 prototype). */
export type OlmMigrationScenario =
  | "interactive"
  | "preview-success"
  | "preview-failed-rollback"
  | "preview-errors";

const LS_KEY = "ocs-demo-switcher";

type Stored = {
  permission?: DemoPermission;
  gitopsOption?: GitOpsDesignOption;
  gitopsScenario?: GitOpsScenario;
  olmMigrationScenario?: OlmMigrationScenario;
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
  olmMigrationScenario: OlmMigrationScenario;
  setPermission: (v: DemoPermission) => void;
  setGitopsOption: (v: GitOpsDesignOption) => void;
  setGitopsScenario: (v: GitOpsScenario) => void;
  setOlmMigrationScenario: (v: OlmMigrationScenario) => void;
};

const PrototypeDemoContext = createContext<PrototypeDemoContextValue | null>(null);

export function PrototypeDemoProvider({ children }: { children: ReactNode }) {
  const initial = readStored();
  const [permission, setPermissionState] = useState<DemoPermission>(initial.permission ?? "edit");
  const [gitopsOption, setGitopsOptionState] = useState<GitOpsDesignOption>(initial.gitopsOption ?? "option-a");
  const [gitopsScenario, setGitopsScenarioState] = useState<GitOpsScenario>(initial.gitopsScenario ?? "paused");
  const [olmMigrationScenario, setOlmMigrationScenarioState] = useState<OlmMigrationScenario>(
    initial.olmMigrationScenario ?? "interactive",
  );

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

  const value = useMemo(
    () => ({
      permission,
      gitopsOption,
      gitopsScenario,
      olmMigrationScenario,
      setPermission,
      setGitopsOption,
      setGitopsScenario,
      setOlmMigrationScenario,
    }),
    [
      permission,
      gitopsOption,
      gitopsScenario,
      olmMigrationScenario,
      setPermission,
      setGitopsOption,
      setGitopsScenario,
      setOlmMigrationScenario,
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
