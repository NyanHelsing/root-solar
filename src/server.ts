import express from "express";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { tcp } from "@libp2p/tcp";
import { createLibp2p, type Libp2pOptions } from "libp2p";

import { apiMiddleware } from "./api/middleware.ts";
import { Context } from "./api/context.ts";
import { getDb } from "./api/persistence/db.ts";
import {
  createModelBackedSentimentProvider,
  createSentimentNetwork,
  type SentimentNetworkStatus,
} from "./net/index.ts";
import {
  clearSentimentNetwork,
  registerSentimentNetwork,
  setSentimentNetworkStatus,
} from "./net/runtime.ts";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  setSentimentNetworkStatus({ state: "starting" });

  let libp2pNode: Awaited<ReturnType<typeof createLibp2p>> | null = null;
  let activeNetwork: Awaited<ReturnType<typeof createSentimentNetwork>> | null = null;

  try {
    const libp2pConfig: Libp2pOptions = {
      addresses: {
        listen: ["/ip4/0.0.0.0/tcp/0"],
      },
      transports: [tcp()],
      connectionEncrypters: [noise()],
      streamMuxers: [yamux()],
    };

    const libp2p = await createLibp2p(libp2pConfig);
    libp2pNode = libp2p;
    const db = await getDb();
    const context = new Context({ db });
    const sentimentNetwork = await createSentimentNetwork({
      libp2p,
      getSentiment: createModelBackedSentimentProvider(context.sentiments),
    });
    activeNetwork = sentimentNetwork;
    registerSentimentNetwork(sentimentNetwork);
  } catch (error) {
    const status: SentimentNetworkStatus = {
      state: "error",
      message: error instanceof Error ? error.message : String(error),
    };
    setSentimentNetworkStatus(status);
    console.error("Failed to start sentiment network", error);
  }

  const app = express()
    .use(
      "/",
      express.Router().get("/health", (_req, res) => {
        res.status(200).send("ok");
      }),
    )
    .use("/api", apiMiddleware);

  const server = app.listen(PORT, () => {
    console.info(`Server listening on ${PORT}`);
  });

  const shutdown = async () => {
    server.close();
    if (activeNetwork) {
      await activeNetwork.close().catch((error) => {
        console.error("Failed to close sentiment network", error);
      });
    }
    if (libp2pNode) {
      await libp2pNode.stop().catch((error) => {
        console.error("Failed to stop libp2p node", error);
      });
    }
    clearSentimentNetwork();
  };

  process.on("SIGINT", () => {
    shutdown().finally(() => {
      process.exit(0);
    });
  });
  process.on("SIGTERM", () => {
    shutdown().finally(() => {
      process.exit(0);
    });
  });
};

startServer().catch((error) => {
  console.error("Server failed to start", error);
  process.exit(1);
});
