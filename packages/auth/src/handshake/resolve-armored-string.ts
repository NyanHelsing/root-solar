import type * as openpgp from "openpgp";
import type { Readable } from "node:stream";

import { bytesToUtf8 } from "../encoding.ts";

const isReadableStream = (value: unknown): value is ReadableStream<string> =>
    Boolean(
        value &&
            typeof value === "object" &&
            "getReader" in value &&
            typeof (value as { getReader: () => unknown }).getReader === "function",
    );

const isNodeReadable = (value: unknown): value is Readable =>
    Boolean(
        value &&
            typeof value === "object" &&
            "pipe" in value &&
            typeof (value as { pipe: unknown }).pipe === "function",
    );

const readWebStream = async (stream: ReadableStream<string>): Promise<string> => {
    const reader = stream.getReader();
    let result = "";
    while (true) {
        const { value, done } = await reader.read();
        if (done) {
            break;
        }
        if (value) {
            result += value;
        }
    }
    return result;
};

const readNodeStream = (stream: Readable): Promise<string> =>
    new Promise<string>((resolve, reject) => {
        let result = "";
        stream.setEncoding("utf8");
        stream.on("data", (chunk) => {
            result += chunk;
        });
        stream.on("end", () => resolve(result));
        stream.on("error", (error) => reject(error));
    });

export const resolveArmoredString = async (
    output: string | Uint8Array | openpgp.WebStream<string>,
): Promise<string> => {
    if (typeof output === "string") {
        return output;
    }
    if (output instanceof Uint8Array) {
        return bytesToUtf8(output);
    }
    if (isReadableStream(output)) {
        return await readWebStream(output);
    }
    if (isNodeReadable(output)) {
        return await readNodeStream(output);
    }
    throw new Error("Unsupported OpenPGP armored output");
};

export default resolveArmoredString;
