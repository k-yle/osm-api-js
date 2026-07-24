import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 4317,
    strictPort: true,
  },
  resolve: {
    alias: {
      "osm-api": path.resolve(__dirname, "../../src/index.ts"),
    },
  },
});
