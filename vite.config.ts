import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { pwaPlugin } from "./src/build/pwaPlugin.js";

export default defineConfig({
  plugins: [react(), pwaPlugin()],
});
