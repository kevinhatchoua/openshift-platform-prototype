import { usePrototypeDemo } from "../../contexts/PrototypeDemoContext";

export function useNmStateDependencyBlocked(): boolean {
  const { networkingNmstateScenario } = usePrototypeDemo();
  return networkingNmstateScenario === "missing-operator";
}

export function useNmStateOperatorAvailable(): boolean {
  return !useNmStateDependencyBlocked();
}