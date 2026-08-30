import { Capacitor } from "@capacitor/core";
import { API_URL } from "./config";

/**
 * Connectivity, as the app actually needs it.
 *
 * `navigator.onLine` is not enough inside a WebView: it reports `true` while the
 * phone sits on the "Balanza" WiFi, which has no route to the internet. So the
 * effective state combines three signals:
 *
 *  - `rawOnline`  what the OS / browser claims (Capacitor Network on native).
 *  - `reachable`  whether GET /api/v1/health actually answered.
 *  - live results reported by `apiFetch`, so normal traffic keeps this honest
 *    for free instead of us polling.
 */
export interface ConnectivityState {
  /** rawOnline AND the API is not known to be unreachable. */
  online: boolean;
  /** What the OS/browser reports. `true` on a captive portal too. */
  rawOnline: boolean;
  /** Last known answer from the API. `null` until we have evidence. */
  reachable: boolean | null;
  /** A reachability probe is in flight. */
  checking: boolean;
  lastCheckAt: number | null;
}

type Listener = (state: ConnectivityState) => void;

const HEALTH_PATH = "/api/v1/health";
const PROBE_TIMEOUT_MS = 6_000;
/** Don't probe more often than this unless the caller forces it. */
const MIN_PROBE_INTERVAL_MS = 15_000;

let state: ConnectivityState = {
  online: true,
  rawOnline: typeof navigator === "undefined" ? true : navigator.onLine,
  reachable: null,
  checking: false,
  lastCheckAt: null,
};

const listeners = new Set<Listener>();
let probeInFlight: Promise<boolean> | null = null;

function computeOnline(next: ConnectivityState): boolean {
  if (!next.rawOnline) return false;
  // Unknown reachability is treated as online: better to let a request try and
  // fail (which then reports back here) than to block the user pre-emptively.
  return next.reachable !== false;
}

function setState(patch: Partial<ConnectivityState>) {
  const merged = { ...state, ...patch };
  merged.online = computeOnline(merged);
  const changed =
    merged.online !== state.online ||
    merged.rawOnline !== state.rawOnline ||
    merged.reachable !== state.reachable ||
    merged.checking !== state.checking;
  state = merged;
  if (changed) listeners.forEach((l) => l(state));
}

export function getConnectivityState(): ConnectivityState {
  return state;
}

export function subscribeConnectivity(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Called by `apiFetch` on every request. Real traffic is the most accurate
 * reachability signal there is, and it costs nothing.
 */
export function reportApiResult(ok: boolean): void {
  if (ok) {
    setState({ reachable: true, lastCheckAt: Date.now() });
    return;
  }
  // A failed request only proves unreachability; it says nothing about the
  // radio, so `rawOnline` is left alone.
  setState({ reachable: false, lastCheckAt: Date.now() });
}

/** GET /api/v1/health with a short deadline. Never throws. */
async function probe(): Promise<boolean> {
  if (!API_URL) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(new URL(HEALTH_PATH, API_URL).toString(), {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Checks whether the API is reachable right now.
 * Coalesces concurrent calls and throttles unless `force` is set.
 */
export async function checkConnectivity(force = false): Promise<boolean> {
  if (probeInFlight) return probeInFlight;

  if (!state.rawOnline) {
    setState({ reachable: false, lastCheckAt: Date.now() });
    return false;
  }
  if (
    !force &&
    state.lastCheckAt !== null &&
    Date.now() - state.lastCheckAt < MIN_PROBE_INTERVAL_MS
  ) {
    return state.reachable !== false;
  }

  setState({ checking: true });
  probeInFlight = probe()
    .then((ok) => {
      setState({ reachable: ok, checking: false, lastCheckAt: Date.now() });
      return ok;
    })
    .finally(() => {
      probeInFlight = null;
    });
  return probeInFlight;
}

let initialized = false;

/** Wires OS/browser listeners. Idempotent; safe to call from module scope. */
export function initConnectivity(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const onRawOnline = (rawOnline: boolean) => {
    setState({ rawOnline, reachable: rawOnline ? null : false });
    // Coming back up is the moment worth spending a probe on.
    if (rawOnline) void checkConnectivity(true);
  };

  if (Capacitor.isNativePlatform()) {
    void import("@capacitor/network")
      .then(async ({ Network }) => {
        const status = await Network.getStatus();
        onRawOnline(status.connected);
        await Network.addListener("networkStatusChange", (s) =>
          onRawOnline(s.connected)
        );
      })
      .catch((err) => console.warn("Network plugin unavailable:", err));
  }

  // Kept on native too: the WebView still fires these and they are instant.
  window.addEventListener("online", () => onRawOnline(true));
  window.addEventListener("offline", () => onRawOnline(false));

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void checkConnectivity();
  });

  void checkConnectivity(true);
}
