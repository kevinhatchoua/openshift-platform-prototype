import { useCallback } from "react";
import { useChat } from "../../../contexts/ChatContext";

/** Open LightSpeed with a topology-scoped context (preloads a contextual AI response). */
export function useTopologyLightspeed() {
  const { setIsOpen, setContext, clearMessages, setChatMode } = useChat();

  const openTopologyLightspeed = useCallback(
    (contextKey: string) => {
      clearMessages();
      setChatMode("troubleshooting");
      setContext(contextKey);
      setIsOpen(true);
    },
    [clearMessages, setChatMode, setContext, setIsOpen]
  );

  return { openTopologyLightspeed };
}
