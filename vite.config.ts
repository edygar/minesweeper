import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/minesweeper/",
  plugins: [
    solid(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        theme_color: "#999999",
        background_color: "#999999",
        display: "standalone",
        scope: "/minesweeper",
        start_url: "/minesweeper",
        name: "Simple minesweeper",
        description: "Simple minesweeper game",
        short_name: "Simple minesweeper",
      },
    }),
  ],
});
