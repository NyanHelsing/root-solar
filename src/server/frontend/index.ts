import type { Application } from "express";

import { createAppLogger } from "../../logging/index.ts";
import { IS_DEVELOPMENT } from "../config.ts";

import { setupDevFrontend } from "./dev-server.ts";
import { setupProdFrontend } from "./ssr.ts";
import type { FrontendLifecycle } from "./types.ts";

const frontendLogger = createAppLogger("server:frontend", {
  tags: ["server", "frontend"],
});

export const setupFrontend = async (
  app: Application,
): Promise<FrontendLifecycle | null> => {
  if (IS_DEVELOPMENT) {
    frontendLogger.info("Configuring development frontend", {
      tags: ["startup", "frontend"],
    });
    return setupDevFrontend(app);
  }
  frontendLogger.info("Configuring production frontend", {
    tags: ["startup", "frontend"],
  });
  return setupProdFrontend(app);
};

export type { FrontendLifecycle } from "./types.ts";
