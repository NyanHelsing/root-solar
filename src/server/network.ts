import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { tcp } from "@libp2p/tcp";
import { createLibp2p, type Libp2p } from "libp2p";

import type { Context } from "../api/context.ts";
import {
  createModelBackedSentimentProvider,
  createSentimentNetwork,
  type SentimentNetwork,
} from "../net/index.ts";

export interface NetworkResources {
  libp2p: Libp2p;
  sentimentNetwork: SentimentNetwork;
}

export const createNetwork = async (
  context: Context,
): Promise<NetworkResources> => {
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

  return { libp2p, sentimentNetwork };
};

export const shutdownNetwork = async ({
  sentimentNetwork,
  libp2p,
}: NetworkResources) => {
  await sentimentNetwork.close();
  await libp2p.stop();
};
