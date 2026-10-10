import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  root: "builder",
  base: "/builder/",
  plugins: [react()],
  build: { outDir: "../dist/builder", emptyOutDir: true },
});
