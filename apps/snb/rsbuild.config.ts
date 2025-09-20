import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSass } from "@rsbuild/plugin-sass";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";

import {
  DEFAULT_SNB_DIST_SUBDIR,
  DEFAULT_SNB_MOUNT,
  resolveAssetPrefix,
  resolveDistSubdir,
  resolveMountPath,
} from "../../config/mfePaths.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const snbDistSubdir = resolveDistSubdir(
  process.env.SNB_DIST_SUBDIR,
  DEFAULT_SNB_DIST_SUBDIR,
);
const snbMountPath = resolveMountPath(
  process.env.SNB_REMOTE_PATH,
  DEFAULT_SNB_MOUNT,
);
const snbAssetPrefix = resolveAssetPrefix(
  process.env.SNB_ASSET_PREFIX,
  snbMountPath,
);

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginSass(),
    pluginModuleFederation({
      name: "snb",
      exposes: {
        "./App": "./apps/snb/src/App.tsx",
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
        jotai: {
          singleton: true,
        },
        "jotai-optics": {
          singleton: true,
        },
        "react-router": {
          singleton: true,
        },
        "@root-solar/api": {
          singleton: true,
        },
        "@root-solar/layout": {
          singleton: true,
        },
        "@root-solar/observability": {
          singleton: true,
        },
        "react-icons": {
          singleton: true,
        },
      },
    }),
  ],
  server: {
    port: 3101,
    strictPort: true,
  },
  source: {
    entry: {
      index: "./apps/snb/src/index.ts",
    },
  },
  output: {
    distPath: {
      root: path.join(dirname, "../../dist", snbDistSubdir),
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
    assetPrefix: snbAssetPrefix,
  },
});
