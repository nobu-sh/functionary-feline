import path from "node:path";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  outDir: "build",
  format: ["esm"],
  platform: "node",
  target: "node20",
  splitting: true,
  sourcemap: true,
  dts: true,
  clean: true,
  minify: false,
  shims: false,
  skipNodeModulesBundle: true,
  env: { NODE_ENV: "production" },
  tsconfig: "tsconfig.json",
  esbuildOptions(options) {
    options.alias = {
      "@": path.resolve(__dirname, "src"),
    };
  },
});
