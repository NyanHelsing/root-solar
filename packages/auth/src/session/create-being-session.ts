import type { BeingCredentialBundle } from "../credentials.ts";
import { createBeingSessionRecord } from "./create-being-session-record.ts";
import { generateSessionPin } from "./generate-session-pin.ts";
import { persistBeingSessionRecord } from "./persist-being-session-record.ts";
import type { BeingSessionRecord } from "./schema.ts";

export const createBeingSession = async (
    bundle: BeingCredentialBundle,
): Promise<{ pin: string; record: BeingSessionRecord }> => {
    const pin = generateSessionPin();
    const record = await createBeingSessionRecord(bundle, pin);
    persistBeingSessionRecord(record);
    return { pin, record };
};

export default createBeingSession;
