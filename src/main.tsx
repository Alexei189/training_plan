import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App/App";
import { registerSW } from "virtual:pwa-register";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element #root not found");
}

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("Доступна новая версия. Обновить?")) {
      updateSW(true); // true = перезагрузить страницу после активации
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
