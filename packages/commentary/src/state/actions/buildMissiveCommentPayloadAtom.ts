import { atom } from "jotai";

import { beingAtom } from "@root-solar/auth";

import type { MissiveCommentInput, MissiveCommentPayload } from "../../types.ts";

// TODO: this is using a setter, but doesn't actually set anything, instead uses a return value.
// This should probably be split into several atoms that set parts of the payload, and a
// write-Only that actually calls the trpc mutation that gets all the values it needs from those
// other atoms in order to construct the payload and send it.
export const buildMissiveCommentPayloadAtom = atom<
    null,
    [MissiveCommentInput],
    MissiveCommentPayload
>(null, (get, _set, { missiveId, body, parentCommentId }) => {
    const trimmed = body.trim();
    if (!trimmed) throw new Error("Comment body cannot be empty.");
    const being = get(beingAtom);
    return {
        axiomId: missiveId,
        parentCommentId,
        authorBeingId: being.id,
        authorDisplayName: being.name,
        body: trimmed
    } satisfies MissiveCommentPayload;
});

export default buildMissiveCommentPayloadAtom;
