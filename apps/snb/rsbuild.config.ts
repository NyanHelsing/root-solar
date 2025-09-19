import path from "node:path";
import { createRequire } from "node:module";
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

const require = createRequire(import.meta.url);
const packageJson = require("../../package.json") as {
  dependencies?: Record<string, string>;
};
const dependencyVersion = (name: string) =>
  packageJson.dependencies?.[name] ?? "*";
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
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./apps/snb/src/App.tsx",
      },
      shared: {
        react: {
          singleton: true,
          //requiredVersion: dependencyVersion("react"),
        },
        "react-dom": {
          singleton: true,
          //requiredVersion: dependencyVersion("react-dom"),
        },
        jotai: {
          singleton: true,
          //requiredVersion: dependencyVersion("jotai"),
        },
        "jotai-optics": {
          singleton: true,
          //requiredVersion: dependencyVersion("jotai-optics"),
        },
        wouter: {
          singleton: true,
          //requiredVersion: dependencyVersion("wouter"),
        },
        "@root-solar/observability": {
          singleton: true,
          //requiredVersion: dependencyVersion("@root-solar/observability"),
        },
        "react-icons": {
          singleton: true,
          //requiredVersion: dependencyVersion("react-icons"),
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
      snb: "./apps/snb/src/index.tsx",
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
    htmlPath: "snb",
  },
  tools: {
    rspack: {
      plugins: [],
    },
  },
});
