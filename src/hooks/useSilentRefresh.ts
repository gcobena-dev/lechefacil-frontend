import { useEffect, useRef } from "react";
import { refreshAccess } from "@/services/auth";
import { notifySessionExpired } from "@/services/session";
import { getToken, setToken, setMustChangePassword } from "@/services/config";

interface Options {
  enabled?: boolean;
  intervalMs?: number; // default 45 minutes
}

/**
 * Periodically refreshes the access token while a session exists.
 * Also refreshes on tab becoming visible if last attempt was a while ago.
 */
export function useSilentRefresh({
  enabled = true,
  intervalMs = 45 * 60 * 1000,
}: Options = {}) {
  const lastRunRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const tryRefresh = async () => {
      lastRunRef.current = Date.now();
      // Only attempt if there's an access token; refresh cookie lives httpOnly
      if (!getToken()) return;
      try {
        const data = await refreshAccess();
        setToken(data.access_token);
        setMustChangePassword(data.must_change_password);
      } catch (e) {
        // The server rejecting the refresh (401/403) means the session is over:
        // close it now instead of waiting for a screen to fail loading data.
        // Network failures and 5xx are transient, so we keep the session as is.
        const status = (e as { status?: number })?.status;
        if (status === 401 || status === 403) notifySessionExpired();
      }
    };

    // Initial delayed attempt to avoid hammering on mount
    const initial = window.setTimeout(tryRefresh, 30 * 1000);

    const schedule = () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = window.setInterval(tryRefresh, intervalMs);
    };
    schedule();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        // If we have been in background for long, refresh on resume
        if (Date.now() - lastRunRef.current > intervalMs / 2) {
          tryRefresh();
        }
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearTimeout(initial);
      if (timerRef.current) window.clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, intervalMs]);
}
