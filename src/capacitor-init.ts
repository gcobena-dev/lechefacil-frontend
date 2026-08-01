import { EdgeToEdge } from "@capawesome/capacitor-android-edge-to-edge-support";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";
import { initPushNotifications } from "@/services/push";

const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

/** Fallbacks por si el CSS todavía no está aplicado al arrancar. */
const FALLBACK_BACKGROUND = { light: "#f8f8f4", dark: "#111a16" };

/**
 * Lee --background del design system en vez de duplicar los valores aquí,
 * para que el chrome nativo nunca se desincronice de la paleta.
 */
const getBackgroundColor = (isDarkMode: boolean): string => {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--background")
    .trim();
  // Formato esperado: "<h> <s>% <l>%"
  const match = raw.match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!match) {
    return isDarkMode ? FALLBACK_BACKGROUND.dark : FALLBACK_BACKGROUND.light;
  }
  return hslToHex(Number(match[1]), Number(match[2]), Number(match[3]));
};

const applyTheme = async (isDarkMode: boolean) => {
  const backgroundColor = getBackgroundColor(isDarkMode);

  await EdgeToEdge.setBackgroundColor({ color: backgroundColor });
  // Style.Dark = iconos claros (para fondo oscuro) y viceversa
  await StatusBar.setStyle({ style: isDarkMode ? Style.Dark : Style.Light });
};

/** True si el tema oscuro está activo ahora mismo (clase .dark del ThemeProvider). */
const isDarkActive = () => document.documentElement.classList.contains("dark");

export async function initializeCapacitor() {
  // Only run on native platforms (Android/iOS)
  if (Capacitor.isNativePlatform()) {
    // ✅ CRITICAL: Notify Capacitor Updater FIRST, before anything else
    // This MUST be called within 10 seconds of app load to prevent rollback after OTA updates
    try {
      const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
      await CapacitorUpdater.notifyAppReady();
    } catch (error) {
      console.error("❌ CRITICAL: Failed to notify app ready:", error);
    }

    // Continue with other initialization (non-blocking)
    try {
      // Enable Edge-to-Edge
      await EdgeToEdge.enable();

      // Apply initial theme (según la clase .dark real, no solo el sistema:
      // el usuario puede haber forzado claro/oscuro desde ajustes)
      await applyTheme(isDarkActive());

      // Initialize push notifications (requires authenticated session to register with backend)
      // Safe to call; it will no-op if not native or permissions denied
      await initPushNotifications();
      // Re-register on auth token changes (e.g., user logs in), best-effort
      window.addEventListener("lf_token_changed", () => {
        initPushNotifications();
      });

      // Seguir el tema efectivo de la app: el ThemeProvider añade/quita .dark
      // en <html>, tanto por elección del usuario como por cambio del sistema.
      const themeObserver = new MutationObserver(() => {
        applyTheme(isDarkActive()).catch((err) =>
          console.error("Error applying native theme:", err)
        );
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      // El botón atrás de Android se maneja en useAndroidBackButton(), dentro
      // del Router, para poder navegar con react-router.
    } catch (error) {
      console.error("Error initializing Capacitor:", error);
    }
  }
}
