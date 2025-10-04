import { useCallback } from "react";

import { atom, useSetAtom } from "jotai";

import { activeMissiveIdAtom } from "./activeMissiveIdAtom.ts";
import { updateMissiveSentimentAtom } from "../actions/updateMissiveSentimentAtom.ts";

export const commitActiveMissiveSentimentAtom = atom(
    null,
    async (
        get,
        set,
        {
            tagId,
            weight
        }: {
            tagId: string;
            weight: number;
        }
    ) => {
        const missiveId = get(activeMissiveIdAtom);
        if (!missiveId) {
            throw new Error("Select a missive before adjusting sentiments.");
        }
        return set(updateMissiveSentimentAtom, {
            missiveId,
            tagId,
            weight
        });
    }
);

export default commitActiveMissiveSentimentAtom;

export const useCommitActiveMissiveSentiment = () => {
    const setCommit = useSetAtom(commitActiveMissiveSentimentAtom);
    return useCallback(
        (tagId: string, weight: number) => setCommit({ tagId, weight }),
        [setCommit]
    );
};
