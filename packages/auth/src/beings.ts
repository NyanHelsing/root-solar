import { atom, useAtomValue } from "jotai";

import { beingSessionAtom } from "./session-atoms.ts";
import { loadBeingSessionRecord } from "./session.ts";

export type Being = {
    id: string;
    name: string;
    role: "superuser" | "participant";
};

const fallbackBeing: Being = {
    id: "guest",
    name: "Guest",
    role: "participant",
};

const toBeing = (session: { being: { id: string; name?: string | null } }): Being => {
    const displayName = session.being.name?.trim() || session.being.id;
    return {
        id: session.being.id,
        name: displayName,
        role: "participant",
    } satisfies Being;
};

const resolveStoredSession = () => {
    try {
        return loadBeingSessionRecord();
    } catch (error) {
        console.warn("Failed to load stored session record", error);
        return null;
    }
};

export const beingAtom = atom<Being>((get) => {
    const session = get(beingSessionAtom);
    if (!session) {
        const stored = resolveStoredSession();
        if (!stored) {
            return fallbackBeing;
        }
        return toBeing(stored);
    }
    return toBeing(session);
});

const beingResourceAtom = atom(async (get) => get(beingAtom));

export const useBeing = () => useAtomValue(beingResourceAtom);
