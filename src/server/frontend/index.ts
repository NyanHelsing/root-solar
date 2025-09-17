import type { Application } from "express";

import { IS_DEVELOPMENT } from "../config.ts";

import { setupDevFrontend } from "./dev-server.ts";
import { setupProdFrontend } from "./ssr.ts";
import type { FrontendLifecycle } from "./types.ts";

export const setupFrontend = async (
  app: Application,
): Promise<FrontendLifecycle | null> => {
  if (IS_DEVELOPMENT) {
    return setupDevFrontend(app);
  }

  return setupProdFrontend(app);
};

export type { FrontendLifecycle } from "./types.ts";
