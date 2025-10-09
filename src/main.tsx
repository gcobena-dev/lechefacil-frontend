import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./utils/i18n";
import { initializeCapacitor } from "./capacitor-init";

console.log("🚀 main.tsx: Starting app initialization...");

// Global fetch tracing to diagnose missing network calls in mobile
try {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    try {
      const input = args[0];
      const init = args[1];
      const url = typeof input === 'string' ? input : (input as Request).url;
      const method = init?.method ?? (typeof input !== 'string' && (input as Request).method) ?? 'GET';
       
      console.log('[global fetch] ->', { method, url, online: navigator.onLine, visibility: document.visibilityState });
    } catch (_) { /* noop */ }
    const res = await originalFetch(...args);
    try {
       
      console.log('[global fetch] <-', { status: res.status, ok: res.ok, url: res.url });
    } catch (_) { /* noop */ }
    return res;
  };
  window.addEventListener('online', () => console.log('[network] online'));  
  window.addEventListener('offline', () => console.log('[network] offline'));
  document.addEventListener('visibilitychange', () => console.log('[visibility]', document.visibilityState));
} catch (_) { /* noop */ }

// Inicializar Capacitor antes de renderizar la app
console.log("🔧 main.tsx: Calling initializeCapacitor()...");
initializeCapacitor();

console.log("⚛️  main.tsx: Rendering React app...");
createRoot(document.getElementById("root")!).render(<App />);
