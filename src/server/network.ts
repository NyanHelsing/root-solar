import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { tcp } from "@libp2p/tcp";
import { createLibp2p, type Libp2p } from "libp2p";

import type { Context } from "../api/context.ts";
import { createAppLogger } from "@root-solar/observability";
import {
  createModelBackedSentimentProvider,
  createSentimentNetwork,
  type SentimentNetwork,
} from "../net/index.ts";

const networkLogger = createAppLogger("server:network", {
  tags: ["server", "network"],
});

export interface NetworkResources {
  libp2p: Libp2p;
  sentimentNetwork: SentimentNetwork;
}

export const createNetwork = async (
  context: Context,
): Promise<NetworkResources> => {
  networkLogger.debug("Creating libp2p instance", {
    tags: ["startup"],
  });
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

  networkLogger.debug("Initializing sentiment network", {
    tags: ["startup", "sentiment"],
  });
  const sentimentNetwork = await createSentimentNetwork({
    libp2p,
    getSentiment: createModelBackedSentimentProvider(context.sentiments),
  });

  networkLogger.debug("Starting libp2p instance", {
    tags: ["startup"],
  });
  await libp2p.start();
  networkLogger.info("Network resources ready", {
    tags: ["startup"],
    peerId: libp2p.peerId.toString(),
    protocols: [sentimentNetwork.protocol],
  });

  return { libp2p, sentimentNetwork };
};

export const shutdownNetwork = async ({
  sentimentNetwork,
  libp2p,
}: NetworkResources) => {
  networkLogger.debug("Shutting down network resources", {
    tags: ["shutdown"],
  });
  await sentimentNetwork.close();
  await libp2p.stop();
  networkLogger.info("Network resources stopped", {
    tags: ["shutdown"],
  });
};
