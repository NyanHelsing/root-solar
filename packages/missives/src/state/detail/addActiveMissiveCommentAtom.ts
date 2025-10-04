import { useCallback } from "react";

import { atom, useSetAtom } from "jotai";

import { activeMissiveIdAtom } from "./activeMissiveIdAtom.ts";
import { addMissiveCommentAtom } from "../actions/addMissiveCommentAtom.ts";

export const addActiveMissiveCommentAtom = atom(
    null,
    async (
        get,
        set,
        {
            body,
            parentCommentId,
        }: {
            body: string;
            parentCommentId?: string;
        },
    ) => {
        const missiveId = get(activeMissiveIdAtom);
        if (!missiveId) {
            throw new Error("Select a missive before posting comments.");
        }
        return set(addMissiveCommentAtom, {
            missiveId,
            body,
            parentCommentId,
        });
    },
);

export default addActiveMissiveCommentAtom;

export const useAddActiveMissiveComment = () => {
    const setComment = useSetAtom(addActiveMissiveCommentAtom);
    return useCallback(
        async (body: string, parentCommentId?: string) => {
            await setComment({ body, parentCommentId });
        },
        [setComment],
    );
};
