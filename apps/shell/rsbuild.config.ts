import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSass } from "@rsbuild/plugin-sass";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";

import {
  DEFAULT_AUTH_MOUNT,
  DEFAULT_SHELL_MOUNT,
  DEFAULT_SNB_MOUNT,
  resolveAssetPrefix,
  resolveBaseUrl,
  resolveMountPath,
} from "../../config/mfePaths.ts";

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

const authMountPath = resolveMountPath(
  process.env.AUTH_REMOTE_PATH,
  DEFAULT_AUTH_MOUNT,
);
const authRemoteBase = resolveBaseUrl(
  process.env.AUTH_REMOTE_URL,
  authMountPath,
);

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginSass(),
    pluginModuleFederation({
      name: "shell",
      remotes: {
        snb: `snb@${remoteBase}/mf-manifest.json`,
        auth: `auth@${authRemoteBase}/mf-manifest.json`,
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
        jotai: {
          singleton: true,
        },
        "jotai-optics": {
          singleton: true,
        },
        "@root-solar/auth": {
          singleton: true,
        },
        "@root-solar/declarations": {
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
  source: {
    entry: {
      shell: "./apps/shell/src/index.ts",
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
