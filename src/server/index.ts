import type { Server } from "node:http";

import { setNetworkStatus } from "../net/status.ts";

import { createBaseApp } from "./app.ts";
import { createServerContext } from "./context.ts";
import { PORT } from "./config.ts";
import { setupFrontend, type FrontendLifecycle } from "./frontend/index.ts";
import { createNetwork, shutdownNetwork, type NetworkResources } from "./network.ts";

export interface ShutdownOptions {
  reason?: string;
  markOffline?: boolean;
}

export const startServer = async () => {
  setNetworkStatus({ state: "starting" });

  let shuttingDown = false;
  let frontend: FrontendLifecycle | null = null;
  let network: NetworkResources | undefined;
  let server: Server | undefined;

  const shutdown = async ({
    reason,
    markOffline,
  }: ShutdownOptions = {}) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;

    const suffix = reason ? ` (${reason})` : "";
    console.info(`Shutting down${suffix}`);

    if (frontend) {
      try {
        await frontend.close();
      } catch (error) {
        console.error("Failed to stop frontend", error);
      }
      frontend = null;
    }

    if (network) {
      try {
        await shutdownNetwork(network);
      } catch (error) {
        console.error("Failed to stop network", error);
      }
      network = undefined;
    }

    if (server && server.listening) {
      await new Promise<void>((resolve) => {
        server?.close(() => {
          resolve();
        });
      });
    }
    server = undefined;

    if (markOffline !== false) {
      setNetworkStatus({ state: "offline" });
    }
  };

  try {
    const context = await createServerContext();
    network = await createNetwork(context);

    const app = createBaseApp();
    frontend = await setupFrontend(app);

    server = app.listen(PORT, () => {
      if (!network) {
        return;
      }
      setNetworkStatus({
        state: "ready",
        protocol: network.sentimentNetwork.protocol,
        peerId: network.libp2p.peerId.toString(),
      });
      console.info(`Server listening on ${PORT}`);
    });

    if (frontend?.afterServerStart) {
      server.on("listening", () => {
        Promise.resolve(frontend?.afterServerStart?.(server!)).catch((error) => {
          console.error("Failed to complete frontend startup", error);
        });
      });
    }

    server.on("error", (error) => {
      setNetworkStatus({
        state: "error",
        message: error instanceof Error ? error.message : String(error),
      });
      shutdown({ reason: "server error", markOffline: false }).catch(
        (shutdownError) => {
          console.error("Error during shutdown", shutdownError);
        },
      );
    });

    process.once("SIGINT", () => {
      shutdown({ reason: "SIGINT" }).catch((error) => {
        console.error("Error during shutdown", error);
      });
    });

    process.once("SIGTERM", () => {
      shutdown({ reason: "SIGTERM" }).catch((error) => {
        console.error("Error during shutdown", error);
      });
    });
  } catch (error) {
    setNetworkStatus({
      state: "error",
      message: error instanceof Error ? error.message : String(error),
    });
    console.error("Failed to start server", error);
    await shutdown({ markOffline: false });
    process.exitCode = 1;
  }
};
