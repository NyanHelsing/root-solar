import { utf8ToBytes } from "../encoding.ts";
import type { AuthIntent } from "./types.ts";

export const normalizeIntent = (intent: AuthIntent): Uint8Array | undefined => {
    if (intent === undefined) {
        return undefined;
    }
    if (typeof intent === "string") {
        return utf8ToBytes(intent);
    }
    return intent;
};

export default normalizeIntent;
