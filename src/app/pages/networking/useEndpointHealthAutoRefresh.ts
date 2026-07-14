import { useEffect, useState } from "react";
import { simulateEndpointHealthTick } from "./networkingMockData";

/** Auto-refresh for list endpoint health — off by default (RFE-9483). */
export function useEndpointHealthAutoRefresh(intervalMs = 8000) {
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      simulateEndpointHealthTick();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [autoRefresh, intervalMs]);

  return { autoRefresh, setAutoRefresh };
}
