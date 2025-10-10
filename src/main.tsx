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

      const toPlainHeaders = (h: HeadersInit | undefined): Record<string, string> => {
        const out: Record<string, string> = {};
        if (!h) return out;
        if (h instanceof Headers) {
          h.forEach((v, k) => { out[k.toLowerCase()] = v; });
        } else if (Array.isArray(h)) {
          h.forEach(([k, v]) => { out[String(k).toLowerCase()] = String(v); });
        } else {
          Object.entries(h).forEach(([k, v]) => { out[k.toLowerCase()] = String(v); });
        }
        ['authorization', 'cookie'].forEach(k => { if (out[k]) out[k] = '***redacted***'; });
        return out;
      };

      const headersForLog = toPlainHeaders(init?.headers);
      let bodyPreview: string | undefined = undefined;
      if (init?.body) {
        try {
          if (typeof init.body === 'string') {
            const s = init.body as string;
            bodyPreview = s.length > 500 ? s.slice(0, 500) + '…' : s;
          } else if (init.body instanceof URLSearchParams) {
            const s = init.body.toString();
            bodyPreview = s.length > 500 ? s.slice(0, 500) + '…' : s;
          } else if (init.body instanceof FormData) {
            const entries: Record<string, any> = {};
            (init.body as FormData).forEach((v, k) => { entries[k] = typeof v === 'string' ? v : '[Blob]'; });
            const s = JSON.stringify(entries);
            bodyPreview = s.length > 500 ? s.slice(0, 500) + '…' : s;
          } else if (typeof init.body === 'object') {
            // If someone passed a plain object (non-standard), try to serialize for visibility
            const s = JSON.stringify(init.body as any, (_k, val) => (typeof val === 'string' && val.length > 200 ? val.slice(0, 200) + '…' : val));
            bodyPreview = s.length > 500 ? s.slice(0, 500) + '…' : s;
          }
        } catch {
          // ignore serialization errors
        }
      }

      const safeStringify = (obj: any) => {
        try {
          const s = JSON.stringify(obj);
          return s.length > 2000 ? s.slice(0, 2000) + '…' : s;
        } catch {
          return '[unserializable]';
        }
      };
      const outReq = {
        method,
        url,
        headers: headersForLog,
        bodyPreview,
        online: navigator.onLine,
        visibility: document.visibilityState,
        credentials: (init && 'credentials' in init) ? (init as any).credentials : undefined,
      };
      console.log('[global fetch] -> ' + safeStringify(outReq));
    } catch (_) { /* noop */ }
    const res = await originalFetch(...args);
    try {
      const outRes = { status: res.status, ok: res.ok, url: res.url };
      console.log('[global fetch] <- ' + JSON.stringify(outRes));
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
