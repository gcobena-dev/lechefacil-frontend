import { useEffect, useRef } from "react";
import { refreshAccess } from "@/services/auth";
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
        // If refresh fails (e.g., cookie expired), keep current state; 401 flows will handle logout if needed
        // Optionally, could clear token here, but better to let next authenticated call surface 401
        // console.warn('Silent refresh failed', e);
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
