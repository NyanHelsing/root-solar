import path from "node:path";
import { pathToFileURL } from "node:url";

import { createRsbuild, mergeRsbuildConfig } from "@rsbuild/core";
import type { Application } from "express";

import { createAppLogger } from "@root-solar/observability";
import {
  DEFAULT_SNB_MOUNT,
  DEFAULT_AUTH_MOUNT,
  resolveMountPath,
} from "../../../../config/mfePaths.ts";
import type { FrontendLifecycle } from "./types.ts";

const devFrontendLogger = createAppLogger("server:frontend:dev", {
  tags: ["server", "frontend", "dev"],
});

const ROOT_DIR = process.env.ROOT_SOLAR_ROOT
  ? path.resolve(process.env.ROOT_SOLAR_ROOT)
  : process.cwd();

const loadRsbuildConfigs = async () => {
  const snbMountPath = resolveMountPath(
    process.env.SNB_REMOTE_PATH,
    DEFAULT_SNB_MOUNT,
  );
  if (!process.env.SNB_REMOTE_PATH) {
    process.env.SNB_REMOTE_PATH = snbMountPath;
  }
  if (!process.env.SNB_REMOTE_URL) {
    process.env.SNB_REMOTE_URL = `http://localhost:3101${snbMountPath}`;
  }

  const authMountPath = resolveMountPath(
    process.env.AUTH_REMOTE_PATH,
    DEFAULT_AUTH_MOUNT,
  );
  if (!process.env.AUTH_REMOTE_PATH) {
    process.env.AUTH_REMOTE_PATH = authMountPath;
  }
  if (!process.env.AUTH_REMOTE_URL) {
    process.env.AUTH_REMOTE_URL = `http://localhost:3102${authMountPath}`;
  }

  const configModuleUrl = pathToFileURL(path.join(ROOT_DIR, "rsbuild.config.ts"))
    .href;
  const module = await import(configModuleUrl);
  const shellConfig = module.shellConfig ?? module.default ?? {};
  const snbConfig = module.snbConfig ?? {};
  const authConfig = module.authConfig ?? {};
  return { shellConfig, snbConfig, authConfig };
};

export const setupDevFrontend = async (
  app: Application,
): Promise<FrontendLifecycle> => {
  const { shellConfig, snbConfig, authConfig } = await loadRsbuildConfigs();
  devFrontendLogger.debug("Loaded rsbuild configs for dev server", {
    tags: ["startup"],
  });
  const shellRsbuild = await createRsbuild({
    rsbuildConfig: mergeRsbuildConfig(shellConfig, {
      server: {
        middlewareMode: true,
      },
    }),
    loadEnv: true,
  });

  const snbRsbuild = await createRsbuild({
    rsbuildConfig: snbConfig,
    loadEnv: true,
  });

  const authRsbuild = await createRsbuild({
    rsbuildConfig: authConfig,
    loadEnv: true,
  });

  devFrontendLogger.info("Starting SNB remote dev server", {
    tags: ["startup", "frontend", "snb"],
  });

  const snbDevServer = await snbRsbuild.createDevServer();
  await snbDevServer.listen();
  snbDevServer.printUrls();
  devFrontendLogger.info("SNB remote dev server ready", {
    tags: ["startup", "frontend", "snb"],
    port: snbDevServer.port,
  });

  devFrontendLogger.info("Starting auth remote dev server", {
    tags: ["startup", "frontend", "auth"],
  });

  const authDevServer = await authRsbuild.createDevServer();
  await authDevServer.listen();
  authDevServer.printUrls();
  devFrontendLogger.info("Auth remote dev server ready", {
    tags: ["startup", "frontend", "auth"],
    port: authDevServer.port,
  });

  devFrontendLogger.info("Starting rsbuild dev server", {
    tags: ["startup"],
  });

  const shellDevServer = await shellRsbuild.createDevServer();
  app.use(shellDevServer.middlewares);
  devFrontendLogger.info("Dev server middleware attached", {
    tags: ["startup"],
  });

  return {
    afterServerStart: async (server) => {
      devFrontendLogger.debug("Binding dev server to HTTP listener", {
        tags: ["startup"],
      });
      shellDevServer.connectWebSocket({ server });
      await shellDevServer.afterListen();
      shellDevServer.printUrls();
      devFrontendLogger.info("Dev server ready", {
        tags: ["startup"],
      });
    },
    close: async () => {
      devFrontendLogger.debug("Closing dev server", {
        tags: ["shutdown"],
      });
      await Promise.all([
        shellDevServer.close(),
        snbDevServer.close(),
        authDevServer.close(),
      ]);
      devFrontendLogger.info("Dev server closed", {
        tags: ["shutdown"],
      });
    },
  } satisfies FrontendLifecycle;
};
