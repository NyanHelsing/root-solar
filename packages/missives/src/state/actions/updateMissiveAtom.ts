import { atom } from "jotai";

import { trpc } from "@root-solar/api/client";

import type { MissiveRecord } from "../../types.ts";
import type { MissiveUpdateInput } from "../types.ts";

const updateMissiveMutationAtom = trpc.updateMissive.atomWithMutation();

export const updateMissiveAtom = atom<null, [MissiveUpdateInput], Promise<MissiveRecord | null>>(
    null,
    async (_get, set, input) => {
        const record = await set(updateMissiveMutationAtom, [input]);
        return record;
    }
);

export default updateMissiveAtom;
