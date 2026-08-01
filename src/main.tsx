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

console.log("🚀 main.tsx: Starting app initialization...");

// Inicializar Capacitor antes de renderizar la app
console.log("🔧 main.tsx: Calling initializeCapacitor()...");
initializeCapacitor();

console.log("⚛️  main.tsx: Rendering React app...");
createRoot(document.getElementById("root")!).render(<App />);
