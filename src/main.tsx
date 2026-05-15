import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { checkEnv, renderEnvErrorOverlay } from "./lib/env-check";

const missing = checkEnv();
if (missing.length > 0) {
  console.error("[env] Variáveis obrigatórias ausentes:", missing);
  document.addEventListener("DOMContentLoaded", () => renderEnvErrorOverlay(missing));
  if (document.readyState !== "loading") renderEnvErrorOverlay(missing);
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

