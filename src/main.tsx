import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./utils/i18n";
import { initializeCapacitor } from "./capacitor-init";

console.log("🚀 main.tsx: Starting app initialization...");

// Inicializar Capacitor antes de renderizar la app
console.log("🔧 main.tsx: Calling initializeCapacitor()...");
initializeCapacitor();

console.log("⚛️  main.tsx: Rendering React app...");
createRoot(document.getElementById("root")!).render(<App />);
