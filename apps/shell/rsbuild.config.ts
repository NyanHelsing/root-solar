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

const normalizeRemoteUrl = (value: string) => {
  if (!value) {
    return "";
  }
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const remoteBase = normalizeRemoteUrl(process.env.SNB_REMOTE_URL ?? "http://localhost:3101");

export default defineConfig({
  plugins: [pluginReact(), pluginSass()],
  source: {
    entry: {
      shell: "./apps/shell/src/index.tsx",
    },
  },
  output: {
    distPath: {
      root: path.join(dirname, "../../dist"),
    },
  },
  tools: {
    rspack: {
      plugins: [
        new container.ModuleFederationPlugin({
          name: "shell",
          remotes: {
            snb: `snb@${remoteBase || "http://localhost:3101"}/remoteEntry.js`,
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
            wouter: {
              singleton: true,
              requiredVersion: dependencyVersion("wouter"),
            },
            jotai: {
              singleton: true,
              requiredVersion: dependencyVersion("jotai"),
            },
            "jotai-optics": {
              singleton: true,
              requiredVersion: dependencyVersion("jotai-optics"),
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
