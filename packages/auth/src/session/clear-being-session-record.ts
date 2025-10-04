import { SESSION_STORAGE_KEY } from "./constants.ts";
import { isBrowserEnvironment } from "./is-browser-environment.ts";

export const clearBeingSessionRecord = (): void => {
    if (!isBrowserEnvironment()) {
        return;
    }
    try {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
        console.warn("Failed to clear session", error);
    }
};

export default clearBeingSessionRecord;
