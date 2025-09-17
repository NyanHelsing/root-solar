import { createRsbuild, mergeRsbuildConfig } from "@rsbuild/core";
import type { Application } from "express";

import type { FrontendLifecycle } from "./types.ts";

const loadRsbuildConfig = async () => {
  const module = await import("../../../rsbuild.config.ts");
  return module.default ?? {};
};

export const setupDevFrontend = async (
  app: Application,
): Promise<FrontendLifecycle> => {
  const config = await loadRsbuildConfig();
  const rsbuild = await createRsbuild({
    rsbuildConfig: mergeRsbuildConfig(config, {
      server: {
        middlewareMode: true,
      },
    }),
    loadEnv: true,
  });

  const devServer = await rsbuild.createDevServer();
  app.use(devServer.middlewares);

  return {
    afterServerStart: async (server) => {
      devServer.connectWebSocket({ server });
      await devServer.afterListen();
      devServer.printUrls();
    },
    close: async () => {
      await devServer.close();
    },
  } satisfies FrontendLifecycle;
};
