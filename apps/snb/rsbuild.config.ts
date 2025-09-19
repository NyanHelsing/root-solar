import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSass } from "@rsbuild/plugin-sass";
import { container } from "@rspack/core";

const require = createRequire(import.meta.url);
const packageJson = require("../../package.json") as { dependencies?: Record<string, string> };
const dependencyVersion = (name: string) => packageJson.dependencies?.[name] ?? "*";
const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [pluginReact(), pluginSass()],
  server: {
    port: 3101,
    strictPort: true,
  },
  source: {
    entry: {
      snb: "./apps/snb/src/index.tsx",
    },
  },
  output: {
    distPath: {
      root: path.join(dirname, "../../dist/snb"),
    },
  },
  tools: {
    rspack: {
      plugins: [
        new container.ModuleFederationPlugin({
          name: "snb",
          filename: "remoteEntry.js",
          exposes: {
            "./App": "./apps/snb/src/App.tsx",
          },
          shared: {
            react: {
              singleton: true,
              requiredVersion: dependencyVersion("react"),
            },
            "react-dom": {
              singleton: true,
              requiredVersion: dependencyVersion("react-dom"),
            },
            jotai: {
              singleton: true,
              requiredVersion: dependencyVersion("jotai"),
            },
            "jotai-optics": {
              singleton: true,
              requiredVersion: dependencyVersion("jotai-optics"),
            },
            wouter: {
              singleton: true,
              requiredVersion: dependencyVersion("wouter"),
            },
            "@root-solar/observability": {
              singleton: true,
              requiredVersion: dependencyVersion("@root-solar/observability"),
            },
            "react-icons": {
              singleton: true,
              requiredVersion: dependencyVersion("react-icons"),
            },
          },
        }),
      ],
    },
  },
});
