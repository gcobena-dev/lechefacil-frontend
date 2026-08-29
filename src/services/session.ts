import { getToken } from "./config";

/**
 * Global session-expiration signal.
 *
 * `apiFetch` emits this when the backend rejects the session with a 401 and the
 * refresh token could not renew it. The app root listens for it to close the
 * session and send the user to /login, instead of leaving each screen showing
 * its own "no se pudieron cargar los datos".
 *
 * Only 401 triggers this: the backend uses 401 exclusively for token problems
 * (missing/invalid/expired token, inactive user) and 403 for tenant/permission
 * problems, so server errors or a dropped connection never log anybody out.
 */
export const SESSION_EXPIRED_EVENT = "lf_session_expired";

// Guards against a burst of parallel 401s triggering several logouts at once.
let alreadyNotified = false;

if (typeof window !== "undefined") {
  // A new token (login or successful refresh) means the session is alive again.
  window.addEventListener("lf_token_changed", () => {
    if (getToken()) alreadyNotified = false;
  });
}

export function notifySessionExpired() {
  if (typeof window === "undefined") return;
  if (alreadyNotified) return;
  alreadyNotified = true;
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}
