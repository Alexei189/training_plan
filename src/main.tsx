import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import { App } from "@/app";

import "@/app/styles/index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element #root not found");
}

if (import.meta.env.DEV && "serviceWorker" in navigator) {
  const hadController = navigator.serviceWorker.controller !== null;

  void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
    if (registrations.length === 0 && !hadController) {
      return;
    }

    await Promise.all(registrations.map((registration) => registration.unregister()));

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }

    if (hadController && sessionStorage.getItem("dev-sw-reset") !== "1") {
      sessionStorage.setItem("dev-sw-reset", "1");
      window.location.reload();
    }
  });
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
