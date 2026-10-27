/// <reference types="vitest" />
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const devServiceWorkerReset = `
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await self.registration.unregister();
    await Promise.all(windows.map(async (client) => {
      try {
        await client.navigate(client.url);
      } catch {
        // Вкладка уже без воркера.
      }
    }));
  })());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
`;

function resetDevServiceWorker(): Plugin {
  return {
    name: "dev-service-worker-reset",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0];

        if (!url || !/\/(?:dev-sw|sw|service-worker)\.js$/.test(url)) {
          next();
          return;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Service-Worker-Allowed", "/");
        res.end(devServiceWorkerReset);
      });
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  plugins: [
    react(),
    resetDevServiceWorker(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: false,
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "Название вашего PWA",
        short_name: "Короткое имя",
        description: "Описание приложения",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/shared/config/tests/setup.ts",
    css: false,
  },
});
