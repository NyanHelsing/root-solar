import { atom, useSetAtom } from "jotai";

import { trpc } from "@root-solar/api/client";

import { activeMissiveIdAtom } from "./activeMissiveIdAtom.ts";
import { loadMissiveDetailAtom } from "./loadMissiveDetailAtom.ts";

const removeMissiveTagMutationAtom = trpc.removeMissiveTag.atomWithMutation();

export const removeActiveMissiveTagAtom = atom(
  null,
  async (get, set, tagSlug: string) => {
    const missiveId = get(activeMissiveIdAtom);
    if (!missiveId) {
      throw new Error("Select a missive before removing tags.");
    }
    await set(removeMissiveTagMutationAtom, [{ missiveId, tagSlug }]);
    await set(loadMissiveDetailAtom, missiveId);
  },
);

export const useRemoveActiveMissiveTag = () => useSetAtom(removeActiveMissiveTagAtom);

export default removeActiveMissiveTagAtom;
