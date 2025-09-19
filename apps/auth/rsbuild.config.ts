import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSass } from "@rsbuild/plugin-sass";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";

import {
  DEFAULT_AUTH_DIST_SUBDIR,
  DEFAULT_AUTH_MOUNT,
  resolveAssetPrefix,
  resolveDistSubdir,
  resolveMountPath,
} from "../../config/mfePaths.ts";

const require = createRequire(import.meta.url);
const packageJson = require("../../package.json") as {
  dependencies?: Record<string, string>;
};
const dependencyVersion = (name: string) => packageJson.dependencies?.[name] ?? "*";
const dirname = path.dirname(fileURLToPath(import.meta.url));

const authDistSubdir = resolveDistSubdir(
  process.env.AUTH_DIST_SUBDIR,
  DEFAULT_AUTH_DIST_SUBDIR,
);
const authMountPath = resolveMountPath(
  process.env.AUTH_REMOTE_PATH,
  DEFAULT_AUTH_MOUNT,
);
const authAssetPrefix = resolveAssetPrefix(
  process.env.AUTH_ASSET_PREFIX,
  authMountPath,
);

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginSass(),
    pluginModuleFederation({
      name: "auth",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./apps/auth/src/App.tsx",
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
        "@root-solar/api": {
          singleton: true,
          requiredVersion: dependencyVersion("@root-solar/api"),
        },
        "@root-solar/auth": {
          singleton: true,
          requiredVersion: dependencyVersion("@root-solar/auth"),
        },
        "@root-solar/observability": {
          singleton: true,
          requiredVersion: dependencyVersion("@root-solar/observability"),
        },
      },
    }),
  ],
  server: {
    port: 3102,
    strictPort: true,
  },
  source: {
    entry: {
      auth: "./apps/auth/src/index.tsx",
    },
  },
  output: {
    distPath: {
      root: path.join(dirname, "../../dist", authDistSubdir),
      js: "js",
      jsAsync: "js/async",
      css: "css",
      cssAsync: "css/async",
      svg: "svg",
      image: "image",
      font: "font",
      media: "media",
      assets: "assets",
      wasm: "wasm",
    },
    assetPrefix: authAssetPrefix,
    htmlPath: "auth",
  },
  tools: {
    rspack: {
      plugins: [],
    },
  },
});
