import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Rutas desde las que el botón atrás sale de la app en vez de navegar.
 * El resto de rutas caen a /dashboard cuando no hay historial hacia atrás.
 */
const EXIT_ROUTES = new Set(["/", "/dashboard", "/login"]);

const DOUBLE_TAP_EXIT_MS = 2000;

/** Detecta si hay un overlay de Radix abierto (dialog, sheet, popover, select, dropdown). */
function hasOpenOverlay(): boolean {
  return !!document.querySelector(
    '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [data-radix-popper-content-wrapper]',
  );
}

/** Cierra el overlay abierto simulando Escape, que es lo que Radix escucha. */
function closeOpenOverlay() {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }),
  );
}

/**
 * Maneja el botón atrás por hardware de Android.
 *
 * Debe usarse DENTRO del Router: necesita `useNavigate`/`useLocation` para
 * mantener react-router sincronizado. Cuando hay un listener de JS registrado,
 * el plugin nativo deja de cerrar la app por su cuenta, así que la salida
 * tiene que ser explícita (App.exitApp).
 */
export function useAndroidBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Refs para que el listener nativo (registrado una sola vez) siempre lea
  // el estado actual sin tener que re-suscribirse en cada navegación.
  const pathnameRef = useRef(location.pathname);
  const lastBackPressRef = useRef(0);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;

    let remove: (() => void) | undefined;
    let cancelled = false;

    const handle = ({ canGoBack }: { canGoBack: boolean }) => {
      // 1. Un overlay abierto se cierra primero, sin navegar.
      if (hasOpenOverlay()) {
        closeOpenOverlay();
        return;
      }

      const pathname = pathnameRef.current;

      // 2. Hay historial: navegación normal hacia atrás.
      if (canGoBack && !EXIT_ROUTES.has(pathname)) {
        navigate(-1);
        return;
      }

      // 3. Sin historial y fuera de una ruta raíz: subimos al dashboard.
      if (!EXIT_ROUTES.has(pathname)) {
        navigate("/dashboard", { replace: true });
        return;
      }

      // 4. En una ruta raíz: doble toque para salir.
      const now = Date.now();
      if (now - lastBackPressRef.current < DOUBLE_TAP_EXIT_MS) {
        App.exitApp();
        return;
      }
      lastBackPressRef.current = now;
      toast(t("common.pressBackAgainToExit"), { duration: DOUBLE_TAP_EXIT_MS });
    };

    App.addListener("backButton", handle).then((listener) => {
      if (cancelled) {
        listener.remove();
        return;
      }
      remove = () => listener.remove();
    });

    return () => {
      cancelled = true;
      remove?.();
    };
  }, [navigate, t]);
}

export default useAndroidBackButton;
