import type { Application } from "express";

import { createAppLogger } from "@root-solar/observability";
import { IS_DEVELOPMENT } from "../config.ts";

import { setupDevFrontend } from "./dev-server.ts";
import { setupProdFrontend } from "./ssr.ts";
import type { FrontendLifecycle } from "./types.ts";

const frontendLogger = createAppLogger("server:frontend", {
    tags: ["server", "frontend"]
});

export const setupFrontend = async (app: Application): Promise<FrontendLifecycle | null> => {
    const devFrontendDisabled = process.env.FRONTEND_DEV_DISABLED === "true";

    if (IS_DEVELOPMENT && !devFrontendDisabled) {
        frontendLogger.info("Configuring development frontend", {
            tags: ["startup", "frontend"]
        });
        return setupDevFrontend(app);
    }
    if (devFrontendDisabled) {
        frontendLogger.info(
            "Development frontend disabled via environment; using production assets",
            {
                tags: ["startup", "frontend"]
            }
        );
    } else {
        frontendLogger.info("Configuring production frontend", {
            tags: ["startup", "frontend"]
        });
    }
    return setupProdFrontend(app);
};

export type { FrontendLifecycle } from "./types.ts";
