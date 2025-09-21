import { useAtomValue } from "jotai";
import { atom } from "jotai";

import { beingSessionAtom, loadBeingSessionRecord } from "@root-solar/auth";

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

const beingValueAtom = atom<Being>((get) => {
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

export const beingAtom = beingValueAtom;

const beingResourceAtom = atom(async (get) => get(beingValueAtom));

export const useBeing = () => useAtomValue(beingResourceAtom);
