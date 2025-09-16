import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { tcp } from "@libp2p/tcp";
import express from "express";
import { createLibp2p } from "libp2p";

import { Context } from "./api/context.ts";
import { apiMiddleware } from "./api/middleware.ts";
import { getDb } from "./api/persistence/db.ts";
import {
  createModelBackedSentimentProvider,
  createSentimentNetwork,
} from "./net/index.ts";
import { setNetworkStatus } from "./net/status.ts";

const PORT = process.env.PORT || 3000;

const start = async () => {
  setNetworkStatus({ state: "starting" });

  try {
    const db = await getDb();
    const context = new Context({ db });
    const libp2p = await createLibp2p({
      start: false,
      addresses: {
        listen: ["/ip4/0.0.0.0/tcp/0"],
      },
      transports: [tcp()],
      streamMuxers: [yamux()],
      connectionEncrypters: [noise()],
      services: {
        identify: identify(),
      },
    });

    const sentimentNetwork = await createSentimentNetwork({
      libp2p,
      getSentiment: createModelBackedSentimentProvider(context.sentiments),
    });

    await libp2p.start();

    const app = express()
      .use(
        "/",
        express.Router().get("/health", (req, res) => {
          res.status(200).send("ok");
        }),
      )
      .use("/api", apiMiddleware);

    const server = app.listen(PORT, () => {
      setNetworkStatus({
        state: "ready",
        protocol: sentimentNetwork.protocol,
        peerId: libp2p.peerId.toString(),
      });
      console.info(`Server listening on ${PORT}`);
    });

    let shuttingDown = false;
    const shutdown = async (
      options: { reason?: string; markOffline?: boolean } = {},
    ) => {
      if (shuttingDown) {
        return;
      }
      shuttingDown = true;
      const reason = options.reason ? ` (${options.reason})` : "";
      console.info(`Shutting down${reason}`);

      try {
        await sentimentNetwork.close();
      } catch (error) {
        console.error("Failed to close sentiment network", error);
      }

      try {
        await libp2p.stop();
      } catch (error) {
        console.error("Failed to stop libp2p", error);
      }

      await new Promise<void>((resolve) => {
        if (server.listening) {
          server.close(() => {
            resolve();
          });
          return;
        }
        resolve();
      });

      if (options.markOffline !== false) {
        setNetworkStatus({ state: "offline" });
      }
    };

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
    process.exitCode = 1;
  }
};

void start();
