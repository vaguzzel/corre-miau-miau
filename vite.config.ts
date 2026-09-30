import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// `base` relativo para que el build funcione en GitHub Pages (subcarpeta /corre-miau-miau/)
export default defineConfig({
  base: "./",
  server: { port: 5173, open: true },
  // Phaser pesa ~1,4 MB por sí solo; subimos el límite del aviso para no ensuciar la salida.
  build: { outDir: "dist", assetsInlineLimit: 0, chunkSizeWarningLimit: 2000 },
  plugins: [
    // PWA: el navegador ofrece "Instalar" y el juego funciona sin internet (guarda todo en caché).
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["iconos/favicon.png", "iconos/apple-touch-icon.png", "assets/fotos/*.png"],
      manifest: {
        name: "Corre Miau Miau",
        short_name: "Miau Miau",
        description: "Juego tipo Pac-Man en pixel art: Quesito recorre la casa mientras los gatos lo persiguen.",
        lang: "es",
        start_url: ".",
        scope: ".",
        display: "fullscreen",
        orientation: "landscape",
        background_color: "#3a271b",
        theme_color: "#3a271b",
        icons: [
          { src: "iconos/icono-192.png", sizes: "192x192", type: "image/png" },
          { src: "iconos/icono-512.png", sizes: "512x512", type: "image/png" },
          { src: "iconos/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
});
