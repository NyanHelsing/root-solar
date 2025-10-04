import { atom } from "jotai";

import { trpc } from "@root-solar/api/client";

import type { MissiveRecord } from "../../types.ts";
import type { MissiveCreationInput } from "../types.ts";

const createMissiveMutationAtom = trpc.createMissive.atomWithMutation();

export const createMissiveAtom = atom<null, [MissiveCreationInput], Promise<MissiveRecord>>(
    null,
    async (_get, set, input) => {
        const record = await set(createMissiveMutationAtom, [input]);
        return record;
    }
);

export default createMissiveAtom;
