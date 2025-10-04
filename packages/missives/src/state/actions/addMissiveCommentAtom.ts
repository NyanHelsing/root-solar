import { atom } from "jotai";

import { addCommentMutationAtom, buildMissiveCommentPayloadAtom } from "@root-solar/commentary";
import type { MissiveCommentInput, MissiveCommentPayload } from "@root-solar/commentary";
import { loadMissiveDetailAtom } from "../detail/loadMissiveDetailAtom.ts";

export const addMissiveCommentAtom = atom<
    null,
    [MissiveCommentInput],
    Promise<MissiveCommentPayload>
>(null, async (_get, set, input) => {
    const payload = set(buildMissiveCommentPayloadAtom, input);
    await set(addCommentMutationAtom, [payload]);
    await set(loadMissiveDetailAtom, input.missiveId);
    return payload;
});

export default addMissiveCommentAtom;
