import { defineConfig } from "vite";

// `base` relativo para que el build funcione en GitHub Pages (subcarpeta /quesito/)
export default defineConfig({
  base: "./",
  server: { port: 5173, open: true },
  // Phaser pesa ~1,4 MB por sí solo; subimos el límite del aviso para no ensuciar la salida.
  build: { outDir: "dist", assetsInlineLimit: 0, chunkSizeWarningLimit: 2000 },
});
