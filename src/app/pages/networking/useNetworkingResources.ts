import { useSyncExternalStore } from "react";
import {
  getNadRecords,
  getNetworkingResourceRevision,
  getNncpRecords,
  getRouteRecords,
  getServiceRecords,
  getUdnRecords,
  subscribeNetworkingResources,
} from "./networkingMockData";

export function useNetworkingResources() {
  useSyncExternalStore(subscribeNetworkingResources, getNetworkingResourceRevision, () => 0);

  return {
    nadRecords: getNadRecords(),
    udnRecords: getUdnRecords(),
    nncpRecords: getNncpRecords(),
    serviceRecords: getServiceRecords(),
    routeRecords: getRouteRecords(),
  };
}
