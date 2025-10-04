import { SESSION_STORAGE_KEY } from "./constants.ts";
import { deserializeSessionRecord } from "./deserialize-session-record.ts";
import type { BeingSessionRecord } from "./schema.ts";
import { isBrowserEnvironment } from "./is-browser-environment.ts";

export const loadBeingSessionRecord = (): BeingSessionRecord | null => {
    if (!isBrowserEnvironment()) {
        return null;
    }
    try {
        const storage = window.localStorage;
        const serialized = storage.getItem(SESSION_STORAGE_KEY);
        if (!serialized) {
            return null;
        }
        return deserializeSessionRecord(serialized);
    } catch (error) {
        console.warn("Failed to load stored session", error);
        try {
            window.localStorage.removeItem(SESSION_STORAGE_KEY);
        } catch (removalError) {
            console.warn("Failed to clear invalid session data", removalError);
        }
        return null;
    }
};

export default loadBeingSessionRecord;
