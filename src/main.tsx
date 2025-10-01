import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./utils/i18n";
import { initializeCapacitor } from "./capacitor-init";

// Inicializar Capacitor antes de renderizar la app
initializeCapacitor();

createRoot(document.getElementById("root")!).render(<App />);
