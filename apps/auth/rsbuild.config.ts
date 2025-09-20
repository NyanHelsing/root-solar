import path from "node:path";
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
      exposes: {
        "./App": "./apps/auth/src/App.tsx",
      },
      manifest: {
        fileName: "mf-manifest.json",
      },
      shared: {
        react: {
          singleton: true,
        },
        "react-dom": {
          singleton: true,
        },
        "react/jsx-runtime": {
          singleton: true,
        },
        "react/jsx-dev-runtime": {
          singleton: true,
        },
        "react-router": {
          singleton: true,
        },
        "@root-solar/api": {
          singleton: true,
        },
        "@root-solar/auth": {
          singleton: true,
        },
        "@root-solar/layout": {
          singleton: true,
        },
        "@root-solar/observability": {
          singleton: true,
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
      index: "./apps/auth/src/index.ts",
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
  },
});
