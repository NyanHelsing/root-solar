import type { Stream } from "@libp2p/interface";
import { Uint8ArrayList } from "uint8arraylist";

import type { AppLogger } from "./types.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

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

export const readJson = async <T>(stream: Stream): Promise<T> => {
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

export const writeJson = async (stream: Stream, value: unknown, logger: AppLogger) => {
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

export const closeStream = async (stream: Stream, logger: AppLogger) => {
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
