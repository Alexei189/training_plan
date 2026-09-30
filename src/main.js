import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
var container = document.getElementById('root');
if (!container) {
    throw new Error('Root element #root not found');
}
registerSW({
    onNeedRefresh: function () {
        console.log('Доступна новая версия, обновите страницу');
    },
    onOfflineReady: function () {
        console.log('Приложение готово к работе офлайн');
    }
});
createRoot(container).render(_jsx(StrictMode, { children: _jsx(App, {}) }));
