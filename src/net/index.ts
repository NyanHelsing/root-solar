import type { Libp2p } from "libp2p";
import type { PeerId, Stream } from "@libp2p/interface";
import { Uint8ArrayList } from "uint8arraylist";

import type { SentimentModel } from "../api/persistence/entities/index.ts";
import { createAppLogger, type AppLogger } from "../logging/index.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const SENTIMENT_PROTOCOL = "/root-solar/sentiment/1.0.0" as const;

export type SentimentFraction = {
  numerator: number;
  denominator: number;
};

export type SentimentRequest = {
  recordId: string;
};

export type SentimentResponse =
  | { status: "ok"; recordId: string; fraction: SentimentFraction }
  | { status: "not_found"; recordId: string }
  | { status: "error"; message: string; recordId?: string };

export type SentimentProvider = (
  recordId: string,
) => Promise<SentimentFraction | null>;

type StreamHandler = Parameters<Libp2p["handle"]>[1];

type Logger = AppLogger;

const defaultLogger = createAppLogger("network:sentiment", {
  tags: ["network", "sentiment"],
});

const toUint8Array = (chunk: Uint8Array | Uint8ArrayList) => {
  return chunk instanceof Uint8ArrayList ? chunk.subarray() : chunk;
};

const concatBytes = (chunks: Uint8Array[]) => {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
};

const readJson = async <T>(stream: Stream): Promise<T> => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream.source) {
    chunks.push(toUint8Array(chunk));
  }
  if (chunks.length === 0) {
    throw new Error("Received empty payload");
  }
  const payload = concatBytes(chunks);
  return JSON.parse(decoder.decode(payload)) as T;
};

const writeJson = async (stream: Stream, value: unknown, logger: Logger) => {
  const data = encoder.encode(JSON.stringify(value));
  const source = async function* () {
    yield data;
  }();
  await stream.sink(source);
  if (typeof stream.closeWrite === "function") {
    try {
      await stream.closeWrite();
    } catch (error) {
      logger.debug("Failed closing write side", error, {
        tags: ["network", "stream"],
      });
    }
  }
};

const closeStream = async (stream: Stream, logger: Logger) => {
  if (typeof stream.close === "function") {
    try {
      await stream.close();
    } catch (error) {
      logger.debug("Failed closing stream", error, {
        tags: ["network", "stream"],
      });
    }
  }
};

const isSentimentFraction = (value: unknown): value is SentimentFraction => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.numerator === "number"
    && Number.isFinite(candidate.numerator)
    && typeof candidate.denominator === "number"
    && Number.isFinite(candidate.denominator)
  );
};

const isSentimentResponse = (value: unknown): value is SentimentResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (candidate.status === "ok") {
    return (
      typeof candidate.recordId === "string"
      && isSentimentFraction(candidate.fraction)
    );
  }
  if (candidate.status === "not_found") {
    return typeof candidate.recordId === "string";
  }
  return (
    candidate.status === "error"
    && typeof candidate.message === "string"
  );
};

const gcd = (a: number, b: number): number => {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y !== 0) {
    const remainder = x % y;
    x = y;
    y = remainder;
  }
  return x === 0 ? 1 : x;
};

const normaliseFraction = (numerator: number, denominator: number) => {
  if (numerator <= 0) {
    return { numerator: 0, denominator: 1 } satisfies SentimentFraction;
  }
  if (denominator <= 0) {
    return { numerator: 0, denominator: 1 } satisfies SentimentFraction;
  }

  let safeNumerator = Math.trunc(numerator);
  let safeDenominator = Math.trunc(denominator);

  if (safeNumerator >= safeDenominator) {
    safeDenominator = safeNumerator + 1;
  }

  const divisor = gcd(safeNumerator, safeDenominator);
  return {
    numerator: safeNumerator / divisor,
    denominator: safeDenominator / divisor,
  } satisfies SentimentFraction;
};

const parseSentimentRecordId = (recordId: string) => {
  const [beingRaw, type, axiomRaw] = recordId.split(":");
  if (!beingRaw || !type || !axiomRaw) {
    throw new Error(`Invalid sentiment record identifier: ${recordId}`);
  }

  return { beingId: beingRaw, type, axiomId: axiomRaw };
};

export const createModelBackedSentimentProvider = (
  sentiments: SentimentModel,
): SentimentProvider => {
  return async (recordId) => {
    const { beingId, type, axiomId } = parseSentimentRecordId(recordId);
    const allocations = await sentiments.listForBeing(beingId, { type });
    const match = allocations.find((allocation) => allocation.axiomId === axiomId);
    if (!match) {
      return null;
    }

    return normaliseFraction(match.weight, match.totalWeightForType);
  };
};

export interface SentimentNetworkOptions {
  libp2p: Libp2p;
  getSentiment: SentimentProvider;
  protocol?: string;
  logger?: Logger;
}

export interface SentimentNetwork {
  protocol: string;
  querySentiment: (
    peerId: PeerId,
    recordId: string,
  ) => Promise<SentimentFraction | null>;
  close: () => Promise<void>;
}

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
    const { stream } = await libp2p.dialProtocol(peerId, protocol);
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
