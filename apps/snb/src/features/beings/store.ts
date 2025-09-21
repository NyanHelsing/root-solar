import { atom } from "jotai";

import { beingSessionAtom } from "@root-solar/auth";

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

export const beingAtom = atom<Being>((get) => {
  const session = get(beingSessionAtom);
  if (!session) {
    return fallbackBeing;
  }
  const displayName = session.being.name?.trim() || session.being.id;
  return {
    id: session.being.id,
    name: displayName,
    role: "participant",
  } satisfies Being;
});
