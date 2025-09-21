import { atom } from "jotai";

import {
  clearBeingSessionRecord,
  loadBeingSessionRecord,
  type BeingSessionRecord,
} from "./session.ts";

const resolveInitialSession = (): BeingSessionRecord | null => {
  try {
    return loadBeingSessionRecord();
  } catch (error) {
    console.warn("Unable to load session during initialization", error);
    return null;
  }
};

const baseSessionAtom = atom<BeingSessionRecord | null>(resolveInitialSession());

export type BeingSessionAction =
  | { type: "set"; record: BeingSessionRecord }
  | { type: "clear" };

export const beingSessionAtom = atom<BeingSessionRecord | null, BeingSessionAction>(
  (get) => get(baseSessionAtom),
  (_get, set, action) => {
    if (action.type === "set") {
      set(baseSessionAtom, action.record);
      return;
    }
    clearBeingSessionRecord();
    set(baseSessionAtom, null);
  },
);

export const beingSessionSummaryAtom = atom((get) => {
  const session = get(beingSessionAtom);
  if (!session) {
    return null;
  }
  const displayName = session.being.name?.trim() || session.being.id;
  return {
    beingId: session.being.id,
    displayName,
  } as const;
});
