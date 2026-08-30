import { useCallback, useSyncExternalStore } from "react";
import {
  checkConnectivity,
  getConnectivityState,
  subscribeConnectivity,
  type ConnectivityState,
} from "@/services/connectivity";

export interface UseConnectivityResult extends ConnectivityState {
  /** Force a reachability probe (used by the "retry" affordances). */
  recheck: () => Promise<boolean>;
}

/**
 * Effective connectivity for the UI: `online` is false both when the radio is
 * off and when we are on a network that cannot reach the API (captive portal,
 * the "Balanza" WiFi).
 */
export function useConnectivity(): UseConnectivityResult {
  const state = useSyncExternalStore(
    subscribeConnectivity,
    getConnectivityState,
    getConnectivityState
  );
  const recheck = useCallback(() => checkConnectivity(true), []);
  return { ...state, recheck };
}
