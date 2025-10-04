import { getLocalStorage } from "./get-local-storage.ts";
import { serializeSessionRecord } from "./serialize-session-record.ts";
import type { BeingSessionRecord } from "./schema.ts";
import { SESSION_STORAGE_KEY } from "./constants.ts";

export const persistBeingSessionRecord = (record: BeingSessionRecord): void => {
    try {
        const storage = getLocalStorage();
        storage.setItem(SESSION_STORAGE_KEY, serializeSessionRecord(record));
    } catch (error) {
        throw new Error("Failed to persist session to local storage", {
            cause: error instanceof Error ? error : undefined
        });
    }
};

export default persistBeingSessionRecord;
