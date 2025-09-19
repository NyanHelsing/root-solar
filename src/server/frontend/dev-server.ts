import { createRsbuild, mergeRsbuildConfig } from "@rsbuild/core";
import type { Application } from "express";

import { createAppLogger } from "@root-solar/observability";
import type { FrontendLifecycle } from "./types.ts";

const devFrontendLogger = createAppLogger("server:frontend:dev", {
  tags: ["server", "frontend", "dev"],
});

const loadRsbuildConfig = async () => {
  const module = await import("../../../rsbuild.config.ts");
  return module.default ?? {};
};

export const setupDevFrontend = async (
  app: Application,
): Promise<FrontendLifecycle> => {
  const config = await loadRsbuildConfig();
  devFrontendLogger.debug("Loaded rsbuild config for dev server", {
    tags: ["startup"],
  });
  const rsbuild = await createRsbuild({
    rsbuildConfig: mergeRsbuildConfig(config, {
      server: {
        middlewareMode: true,
      },
    }),
    loadEnv: true,
  });

  devFrontendLogger.info("Starting rsbuild dev server", {
    tags: ["startup"],
  });

  const devServer = await rsbuild.createDevServer();
  app.use(devServer.middlewares);
  devFrontendLogger.info("Dev server middleware attached", {
    tags: ["startup"],
  });

  return {
    afterServerStart: async (server) => {
      devFrontendLogger.debug("Binding dev server to HTTP listener", {
        tags: ["startup"],
      });
      devServer.connectWebSocket({ server });
      await devServer.afterListen();
      devServer.printUrls();
      devFrontendLogger.info("Dev server ready", {
        tags: ["startup"],
      });
    },
    close: async () => {
      devFrontendLogger.debug("Closing dev server", {
        tags: ["shutdown"],
      });
      await devServer.close();
      devFrontendLogger.info("Dev server closed", {
        tags: ["shutdown"],
      });
    },
  } satisfies FrontendLifecycle;
};
