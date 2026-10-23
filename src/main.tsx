import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import { App } from "@/app";

import "@/app/styles/index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element #root not found");
}

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("Доступна новая версия. Обновить?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("Приложение готово к работе офлайн");
  },
});

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
