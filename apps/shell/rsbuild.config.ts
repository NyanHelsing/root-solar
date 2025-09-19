import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSass } from "@rsbuild/plugin-sass";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";

import {
  DEFAULT_SHELL_MOUNT,
  DEFAULT_SNB_MOUNT,
  resolveAssetPrefix,
  resolveBaseUrl,
  resolveMountPath,
} from "../../config/mfePaths.ts";

const require = createRequire(import.meta.url);
const packageJson = require("../../package.json") as {
  dependencies?: Record<string, string>;
};
const dependencyVersion = (name: string) =>
  packageJson.dependencies?.[name] ?? "*";
const dirname = path.dirname(fileURLToPath(import.meta.url));

const shellMountPath = resolveMountPath(
  process.env.SHELL_STATIC_PATH,
  DEFAULT_SHELL_MOUNT,
);
const shellAssetPrefix = resolveAssetPrefix(
  process.env.SHELL_ASSET_PREFIX,
  shellMountPath,
);

const snbMountPath = resolveMountPath(
  process.env.SNB_REMOTE_PATH,
  DEFAULT_SNB_MOUNT,
);
const remoteBase = resolveBaseUrl(process.env.SNB_REMOTE_URL, snbMountPath);

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginSass(),
    pluginModuleFederation({
      name: "shell",
      remotes: {
        snb: `snb@${remoteBase}/remoteEntry.js`,
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
  source: {
    entry: {
      shell: "./apps/shell/src/index.tsx",
    },
  },
  output: {
    distPath: {
      root: path.join(dirname, "../../dist/shell"),
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
    assetPrefix: shellAssetPrefix,
    filename: {
      html: "../index.html",
    },
  },
});
