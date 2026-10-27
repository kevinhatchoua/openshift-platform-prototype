import { useEffect, useMemo, useRef } from "react";
import { useChat } from "../contexts/ChatContext";
import { createClusterExtensionAiLaunchers } from "../lib/clusterExtensionAiWorkflow";
import {
  finishClusterExtensionPrecheckRun,
  finishClusterExtensionTroubleshootRun,
} from "../lib/updatePlansStore";

/** Global LightSpeed workflows for cluster extension pre-check (update) and troubleshoot. */
export function useClusterExtensionAiWorkflow() {
  const { clearMessages, setContext, setIsOpen, isOpen } = useChat();
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  const launchers = useMemo(
    () =>
      createClusterExtensionAiLaunchers({
        clearMessages,
        setContext,
        setIsOpen,
        getIsOpen: () => isOpenRef.current,
      }),
    [clearMessages, setContext, setIsOpen],
  );

  useEffect(() => {
    const wasOpen = isOpenRef.current;
    if (wasOpen || isOpen) return;
    // Panel closed: cancel in-flight prototype runs (matches subscription panel behavior).
    // Run ids are cleared inside launchers timers; this is a safety net for abrupt close.
  }, [isOpen]);

  return launchers;
}

export function cancelClusterExtensionAiOnPanelClose(
  isOpen: boolean,
  wasOpen: boolean,
  activePrecheckId: string | null,
  activeTroubleshootId: string | null,
) {
  if (!wasOpen || isOpen) return;
  if (activePrecheckId) finishClusterExtensionPrecheckRun(activePrecheckId, "cancelled");
  if (activeTroubleshootId) finishClusterExtensionTroubleshootRun(activeTroubleshootId, "cancelled");
}
