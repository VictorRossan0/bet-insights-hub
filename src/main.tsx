import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { checkEnv, renderEnvErrorOverlay } from "./lib/env-check";

const missing = checkEnv();
if (missing.length > 0) {
  console.error("[env] Variáveis obrigatórias ausentes:", missing);
  document.addEventListener("DOMContentLoaded", () => renderEnvErrorOverlay(missing));
  // Renderiza overlay imediatamente se DOM já estiver pronto
  if (document.readyState !== "loading") renderEnvErrorOverlay(missing);
}

createRoot(document.getElementById("root")!).render(<App />);
