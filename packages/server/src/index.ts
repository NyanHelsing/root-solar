import type { Server } from "node:http";

import { createAppLogger } from "@root-solar/observability";
import { setNetworkStatus } from "@root-solar/net/status";

import { createBaseApp } from "./app.ts";
import { createServerContext } from "./context.ts";
import { HOST, PORT } from "./config.ts";
import { setupFrontend, type FrontendLifecycle } from "./frontend/index.ts";
import { createNetwork, shutdownNetwork, type NetworkResources } from "./network.ts";

const serverLogger = createAppLogger("server:lifecycle", {
    tags: ["server", "lifecycle"]
});

export interface ShutdownOptions {
    reason?: string;
    markOffline?: boolean;
}

export const startServer = async () => {
    const networkEnabled =
        process.env.DISABLE_NETWORK !== "true" && process.env.ENABLE_NETWORK !== "false";

    setNetworkStatus({ state: "starting" });
    serverLogger.info("Server startup initiated", {
        tags: ["startup"],
        networkEnabled
    });

    let shuttingDown = false;
    let frontend: FrontendLifecycle | null = null;
    let network: NetworkResources | undefined;
    let server: Server | undefined;

    const shutdown = async ({ reason, markOffline }: ShutdownOptions = {}) => {
        if (shuttingDown) {
            serverLogger.debug("Shutdown already in progress", {
                reason,
                tags: ["shutdown"]
            });
            return;
        }
        shuttingDown = true;

        serverLogger.info("Shutdown initiated", {
            reason,
            markOffline: markOffline !== false,
            tags: ["shutdown"]
        });

        if (frontend) {
            serverLogger.debug("Closing frontend", {
                tags: ["shutdown", "frontend"]
            });
            try {
                await frontend.close();
                serverLogger.debug("Frontend closed", {
                    tags: ["shutdown", "frontend"]
                });
            } catch (error) {
                serverLogger.error("Failed to stop frontend", error, {
                    tags: ["shutdown", "frontend"]
                });
            }
            frontend = null;
        }

        if (network) {
            serverLogger.debug("Closing network resources", {
                tags: ["shutdown", "network"]
            });
            try {
                await shutdownNetwork(network);
                serverLogger.debug("Network resources closed", {
                    tags: ["shutdown", "network"]
                });
            } catch (error) {
                serverLogger.error("Failed to stop network", error, {
                    tags: ["shutdown", "network"]
                });
            }
            network = undefined;
        }

        if (server?.listening) {
            serverLogger.debug("Closing HTTP server", {
                tags: ["shutdown", "http"]
            });
            await new Promise<void>((resolve) => {
                server?.close(() => {
                    resolve();
                });
            });
            serverLogger.debug("HTTP server closed", {
                tags: ["shutdown", "http"]
            });
        }
        server = undefined;

        if (markOffline !== false) {
            setNetworkStatus({ state: "offline" });
            serverLogger.info("Server marked offline", {
                tags: ["shutdown"]
            });
        }

        serverLogger.info("Shutdown complete", {
            reason,
            tags: ["shutdown"]
        });
    };

    try {
        serverLogger.debug("Creating server context", {
            tags: ["startup"]
        });
        const context = await createServerContext();
        serverLogger.debug("Server context ready", {
            tags: ["startup"]
        });
        if (networkEnabled) {
            network = await createNetwork(context);
            serverLogger.info("Network resources initialized", {
                tags: ["startup", "network"],
                peerId: network.libp2p.peerId.toString(),
                protocols: [network.sentimentNetwork.protocol]
            });
        } else {
            serverLogger.warn("Network startup disabled via environment", {
                tags: ["startup", "network"]
            });
        }

        const app = createBaseApp();
        frontend = await setupFrontend(app);
        serverLogger.debug("Frontend setup complete", {
            tags: ["startup", "frontend"]
        });

        server = app.listen(PORT, HOST, () => {
            if (!network) {
                setNetworkStatus({ state: "ready" });
                serverLogger.info("Server listening (network disabled)", {
                    tags: ["startup", "http"],
                    host: HOST,
                    port: PORT
                });
                return;
            }
            setNetworkStatus({
                state: "ready",
                protocol: network.sentimentNetwork.protocol,
                peerId: network.libp2p.peerId.toString()
            });
            serverLogger.info("Server listening", {
                tags: ["startup", "http"],
                host: HOST,
                port: PORT,
                protocol: network.sentimentNetwork.protocol
            });
        });

        if (frontend?.afterServerStart) {
            const activeServer = server;
            const afterServerStart = frontend.afterServerStart;
            server.on("listening", () => {
                if (!afterServerStart || !activeServer) {
                    return;
                }
                Promise.resolve(afterServerStart(activeServer)).catch((error) => {
                    serverLogger.error("Failed to complete frontend startup", error, {
                        tags: ["startup", "frontend"]
                    });
                });
            });
        }

        server.on("error", (error) => {
            setNetworkStatus({
                state: "error",
                message: error instanceof Error ? error.message : String(error)
            });
            serverLogger.error("HTTP server error", error, {
                tags: ["runtime", "http"]
            });
            shutdown({ reason: "server error", markOffline: false }).catch((shutdownError) => {
                serverLogger.error("Error during shutdown", shutdownError, {
                    tags: ["shutdown"]
                });
            });
        });

        process.once("SIGINT", () => {
            serverLogger.warn("SIGINT received", {
                tags: ["shutdown", "signal"]
            });
            shutdown({ reason: "SIGINT" }).catch((error) => {
                serverLogger.error("Error during shutdown", error, {
                    tags: ["shutdown"]
                });
            });
        });

        process.once("SIGTERM", () => {
            serverLogger.warn("SIGTERM received", {
                tags: ["shutdown", "signal"]
            });
            shutdown({ reason: "SIGTERM" }).catch((error) => {
                serverLogger.error("Error during shutdown", error, {
                    tags: ["shutdown"]
                });
            });
        });
    } catch (error) {
        setNetworkStatus({
            state: "error",
            message: error instanceof Error ? error.message : String(error)
        });
        serverLogger.error("Failed to start server", error, {
            tags: ["startup"]
        });
        await shutdown({ markOffline: false });
        process.exitCode = 1;
    }
};

export { createBaseApp } from "./app.ts";
export { createServerContext } from "./context.ts";
export { setupFrontend } from "./frontend/index.ts";
export type { FrontendLifecycle } from "./frontend/index.ts";
export { createNetwork, shutdownNetwork } from "./network.ts";
export type { NetworkResources } from "./network.ts";
export { ENV, IS_DEVELOPMENT, PORT } from "./config.ts";
