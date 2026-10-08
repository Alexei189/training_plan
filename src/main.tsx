import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App/App";
import { Provider } from "react-redux"; // 1. Импортируем Provider
import { store } from "./Store";
import { registerSW } from "virtual:pwa-register";
import "./index.css";

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
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
