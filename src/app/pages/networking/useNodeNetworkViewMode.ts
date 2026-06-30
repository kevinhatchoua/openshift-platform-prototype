import { useCallback, useState } from "react";
import {
  readNodeNetworkViewMode,
  writeNodeNetworkViewMode,
  type NodeNetworkViewMode,
} from "./nodeNetworkViewMode";

export function useNodeNetworkViewMode() {
  const [viewMode, setViewModeState] = useState<NodeNetworkViewMode>(() => readNodeNetworkViewMode());

  const setViewMode = useCallback((mode: NodeNetworkViewMode) => {
    setViewModeState(mode);
    writeNodeNetworkViewMode(mode);
  }, []);

  return { viewMode, setViewMode };
}
