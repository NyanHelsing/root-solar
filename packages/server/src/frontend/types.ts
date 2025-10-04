import type { Application } from "express";
import type { Server } from "node:http";

export interface FrontendLifecycle {
    afterServerStart?: (server: Server) => Promise<void> | void;
    close: () => Promise<void>;
}

export type FrontendSetup = (app: Application) => Promise<FrontendLifecycle | null>;
