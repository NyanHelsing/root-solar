import type { PeerId, Stream } from "@libp2p/interface";
import type { Libp2p } from "libp2p";

import { createAppLogger, type AppLogger } from "@root-solar/observability";

import { closeStream, readJson, writeJson } from "./io.ts";
import { isSentimentResponse } from "./guards.ts";
import { SENTIMENT_PROTOCOL } from "./constants.ts";
import type {
  SentimentFraction,
  SentimentNetwork,
  SentimentNetworkOptions,
  SentimentRequest,
  SentimentResponse,
} from "./types.ts";

const defaultLogger = createAppLogger("network:sentiment", {
  tags: ["network", "sentiment"],
});

type StreamHandler = Parameters<Libp2p["handle"]>[1];

type Logger = AppLogger;

export const createSentimentNetwork = async ({
  libp2p,
  getSentiment,
  protocol = SENTIMENT_PROTOCOL,
  logger = defaultLogger,
}: SentimentNetworkOptions): Promise<SentimentNetwork> => {
  const handler: StreamHandler = async ({ stream }) => {
    let recordId: string | undefined;
    try {
      const request = await readJson<SentimentRequest>(stream);
      if (!request || typeof request.recordId !== "string") {
        throw new Error("Invalid sentiment request payload");
      }

      recordId = request.recordId;
      logger.debug("Processing sentiment request", {
        recordId,
        tags: ["sentiment", "handler"],
      });
      const fraction = await getSentiment(recordId);
      const response: SentimentResponse = fraction
        ? { status: "ok", recordId, fraction }
        : { status: "not_found", recordId };

      await writeJson(stream, response, logger);
      logger.debug("Sentiment response written", {
        recordId,
        status: response.status,
        tags: ["sentiment", "handler"],
      });
    } catch (error) {
      logger.error("Sentiment handler error", error, {
        recordId,
        tags: ["sentiment", "handler"],
      });
      const response: SentimentResponse = {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown sentiment error",
        recordId,
      };
      try {
        await writeJson(stream, response, logger);
      } catch (innerError) {
        logger.error("Failed to reply with sentiment error", innerError, {
          recordId,
          tags: ["sentiment", "handler"],
        });
      }
    } finally {
      await closeStream(stream, logger);
    }
  };

  await libp2p.handle(protocol, handler);

  const querySentiment = async (
    peerId: PeerId,
    recordId: string,
  ): Promise<SentimentFraction | null> => {
    if (!recordId) {
      throw new Error("recordId must be provided");
    }

    logger.debug("Dialing peer for sentiment", {
      peerId: peerId.toString(),
      recordId,
      tags: ["sentiment", "client"],
    });
    const dialResult = await libp2p.dialProtocol(peerId, protocol);
    const stream =
      (dialResult as { stream?: Stream }).stream ?? (dialResult as Stream);
    try {
      await writeJson(stream, { recordId } satisfies SentimentRequest, logger);
      logger.debug("Sentiment query sent", {
        peerId: peerId.toString(),
        recordId,
        tags: ["sentiment", "client"],
      });
      const payload = await readJson<unknown>(stream);
      if (!isSentimentResponse(payload)) {
        throw new Error("Invalid sentiment response payload");
      }

      if (payload.status === "ok") {
        if (payload.fraction.denominator === 0) {
          throw new Error("Invalid fraction received: denominator is zero");
        }
        logger.debug("Received sentiment fraction", {
          peerId: peerId.toString(),
          recordId,
          fraction: payload.fraction,
          tags: ["sentiment", "client"],
        });
        return payload.fraction;
      }

      if (payload.status === "not_found") {
        logger.debug("Sentiment record not found", {
          peerId: peerId.toString(),
          recordId,
          tags: ["sentiment", "client"],
        });
        return null;
      }

      throw new Error(payload.message);
    } catch (error) {
      if (typeof stream.abort === "function") {
        stream.abort(error instanceof Error ? error : new Error(String(error)));
      }
      logger.error("Sentiment query failed", error, {
        peerId: peerId.toString(),
        recordId,
        tags: ["sentiment", "client"],
      });
      throw error;
    } finally {
      await closeStream(stream, logger);
    }
  };

  const close = async () => {
    logger.debug("Unregistering sentiment protocol handler", {
      protocol,
      tags: ["sentiment"],
    });
    await libp2p.unhandle(protocol);
    logger.info("Sentiment protocol handler unregistered", {
      protocol,
      tags: ["sentiment"],
    });
  };

  logger.info("Sentiment protocol handler registered", {
    protocol,
    tags: ["sentiment"],
  });

  return { protocol, querySentiment, close };
};
