import { defineConfig } from "@playwright/experimental-ct-react";
import react from "@vitejs/plugin-react";

export default defineConfig({
  testDir: "./src",
  testMatch: /.*\\.component\\.test\\.(ts|tsx)$/,
  snapshotDir: "./src/__tests__/__snapshots__",
  use: {
    ctPort: 3100,
  },
  ctViteConfig: {
    plugins: [react()],
    css: {
      modules: {
        localsConvention: "camelCaseOnly",
      },
    },
  },
});
