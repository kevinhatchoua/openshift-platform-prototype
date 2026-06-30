import { useCallback, useEffect, useRef, useState } from "react";
import { useNetworkTopologyState } from "./networkTopologyState";

type ToastPush = (toast: {
  variant: "success" | "info" | "warning" | "danger";
  title: string;
}) => number;

type ToastDismiss = (key: number) => void;

export function useNodeNetworkConfigurationCreate(
  pushToast: ToastPush,
  dismissToast: ToastDismiss,
  options?: { successTitle?: (configName: string) => string }
) {
  const { provisionGeneration, provisionConfiguration, markStandalonesInstalling, markStandalonesConfigured } =
    useNetworkTopologyState();

  const [showFormWizard, setShowFormWizard] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [physicalNetworkName, setPhysicalNetworkName] = useState("localnet-rzpi1d");
  const [isCreating, setIsCreating] = useState(false);
  const creatingToastKeyRef = useRef<number | null>(null);
  const lastConfigNameRef = useRef("localnet-rzpi1d");
  const lastProvisionGenRef = useRef(provisionGeneration);

  const openFormWizard = useCallback(() => {
    setActiveStep(0);
    setPhysicalNetworkName("localnet-rzpi1d");
    setShowFormWizard(true);
  }, []);

  const closeFormWizard = useCallback(() => {
    setShowFormWizard(false);
  }, []);

  const handleCreateConfiguration = useCallback(() => {
    setIsCreating(true);
    const name = provisionConfiguration(physicalNetworkName);
    lastConfigNameRef.current = name;
    creatingToastKeyRef.current = pushToast({
      variant: "info",
      title: `Creating node network configuration for ${name} on worker-0, worker-1, and worker-2…`,
    });
    setShowFormWizard(false);
    setIsCreating(false);
  }, [physicalNetworkName, provisionConfiguration, pushToast]);

  useEffect(() => {
    if (provisionGeneration === lastProvisionGenRef.current) return undefined;
    lastProvisionGenRef.current = provisionGeneration;

    const installingTimer = window.setTimeout(() => {
      markStandalonesInstalling();
    }, 1600);

    const configuredTimer = window.setTimeout(() => {
      const configName = lastConfigNameRef.current;
      markStandalonesConfigured();
      if (creatingToastKeyRef.current !== null) {
        dismissToast(creatingToastKeyRef.current);
      }
      pushToast({
        variant: "success",
        title:
          options?.successTitle?.(configName) ??
          `Successfully created node network configuration for ${configName}. Open Networking → Topology to attach resources.`,
      });
    }, 3400);

    return () => {
      window.clearTimeout(installingTimer);
      window.clearTimeout(configuredTimer);
    };
  }, [
    provisionGeneration,
    dismissToast,
    pushToast,
    markStandalonesInstalling,
    markStandalonesConfigured,
    options?.successTitle,
  ]);

  return {
    showFormWizard,
    openFormWizard,
    closeFormWizard,
    activeStep,
    setActiveStep,
    physicalNetworkName,
    setPhysicalNetworkName,
    isCreating,
    handleCreateConfiguration,
  };
}
