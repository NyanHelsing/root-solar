import { createRsbuild, mergeRsbuildConfig } from "@rsbuild/core";
import type { Application } from "express";

import { createAppLogger } from "@root-solar/observability";
import type { FrontendLifecycle } from "./types.ts";

const devFrontendLogger = createAppLogger("server:frontend:dev", {
  tags: ["server", "frontend", "dev"],
});

const loadRsbuildConfigs = async () => {
  const module = await import("../../../rsbuild.config.ts");
  const shellConfig = module.shellConfig ?? module.default ?? {};
  const snbConfig = module.snbConfig ?? {};
  return { shellConfig, snbConfig };
};

export const setupDevFrontend = async (
  app: Application,
): Promise<FrontendLifecycle> => {
  const { shellConfig, snbConfig } = await loadRsbuildConfigs();
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
      await Promise.all([shellDevServer.close(), snbDevServer.close()]);
      devFrontendLogger.info("Dev server closed", {
        tags: ["shutdown"],
      });
    },
  } satisfies FrontendLifecycle;
};
