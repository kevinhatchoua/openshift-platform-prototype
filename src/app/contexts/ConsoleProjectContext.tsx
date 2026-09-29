import { createContext, useContext, useState, type ReactNode } from "react";

export const CONSOLE_PROJECTS = [
  "All projects",
  "default",
  "openshift-ovn-kubernetes",
  "openshift-nmstate",
  "payments",
] as const;

export type ConsoleProject = (typeof CONSOLE_PROJECTS)[number];

type ConsoleProjectContextValue = {
  project: ConsoleProject;
  setProject: (project: ConsoleProject) => void;
};

const ConsoleProjectContext = createContext<ConsoleProjectContextValue | null>(null);

export function ConsoleProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<ConsoleProject>("All projects");
  return (
    <ConsoleProjectContext.Provider value={{ project, setProject }}>
      {children}
    </ConsoleProjectContext.Provider>
  );
}

export function useConsoleProject() {
  const ctx = useContext(ConsoleProjectContext);
  if (!ctx) {
    throw new Error("useConsoleProject must be used within ConsoleProjectProvider");
  }
  return ctx;
}

/** True when the dashboard should include apps in this namespace. */
export function appMatchesConsoleProject(appNs: string, project: ConsoleProject): boolean {
  if (project === "All projects") return true;
  return appNs === project;
}
