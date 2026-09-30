import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        VitePWA({
            registerType: 'prompt', // Автообновление сервис-воркера
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: {
                name: 'Название вашего PWA',
                short_name: 'Короткое имя',
                description: 'Описание приложения',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone', // Открытие в отдельном окне без адресной строки
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable' // Для корректного отображения на Android
                    }
                ]
            }
        })
    ]
});
