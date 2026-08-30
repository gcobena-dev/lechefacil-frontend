import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { SESSION_EXPIRED_EVENT } from "@/services/session";
import { performLogout } from "@/services/auth";
import { purgeScopedQueryCache } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

// Routes where the user is already out: clear the session, but don't redirect
// or nag with a toast.
const AUTH_ROUTES = [
  "/login",
  "/signin",
  "/forgot-password",
  "/reset-password",
  "/set-password",
  "/request-access",
];

/**
 * Closes the session and sends the user to /login when the backend rejects the
 * session (401 that the refresh token could not renew). Without this, every
 * screen just shows its own "no se pudieron cargar los datos" while the app
 * keeps a dead token in localStorage.
 *
 * Must live inside the Router so it can navigate.
 */
export function SessionExpiredHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Read the current path without re-subscribing on every navigation
  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;
  const handlingRef = useRef(false);

  useEffect(() => {
    const onSessionExpired = async () => {
      if (handlingRef.current) return;
      handlingRef.current = true;

      const onAuthRoute = AUTH_ROUTES.some((route) =>
        pathnameRef.current.startsWith(route)
      );

      try {
        // Purge the persisted cache FIRST: its key is derived from the token and
        // tenant, so after performLogout() we would be deleting the wrong scope
        // and leaving this session's data on disk. The outbox is deliberately
        // left alone — those records exist nowhere else and must survive to be
        // sent after the next login.
        await purgeScopedQueryCache();
        // Best-effort: revoke the refresh cookie and the push token server-side
        await performLogout();
      } finally {
        // Drop cached data so nothing from the previous session leaks into the next
        queryClient.clear();
        if (!onAuthRoute) {
          toast({
            title: t("auth.sessionExpired"),
            description: t("auth.sessionExpiredDescription"),
            variant: "destructive",
          });
          navigate("/login", { replace: true });
        }
        handlingRef.current = false;
      }
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () =>
      window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, [navigate, queryClient, toast, t]);

  return null;
}
