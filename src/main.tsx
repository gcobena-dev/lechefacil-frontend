import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// Inter empaquetada localmente: la app debe verse igual sin conexión
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./index.css";
import "./utils/i18n";
import { initializeCapacitor } from "./capacitor-init";
import { Capacitor } from "@capacitor/core";

console.log("🚀 main.tsx: Starting app initialization...");

// Inicializar Capacitor antes de renderizar la app
console.log("🔧 main.tsx: Calling initializeCapacitor()...");
initializeCapacitor();

/**
 * Service worker for the web build only.
 *
 * It precaches the app shell so the site opens with no connection. On native it
 * is deliberately skipped: Capacitor already ships the shell inside the APK, and
 * a worker caching assets would collide with the OTA bundle swaps done by
 * @capgo/capacitor-updater. API responses are never cached here — CapacitorHttp
 * bypasses service workers on native, so data caching lives in the persisted
 * react-query store, which behaves the same on both platforms.
 */
if (!Capacitor.isNativePlatform() && import.meta.env.PROD) {
  import("virtual:pwa-register")
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch((err) => console.warn("No se pudo registrar el service worker", err));
}

console.log("⚛️  main.tsx: Rendering React app...");
createRoot(document.getElementById("root")!).render(<App />);
