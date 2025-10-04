import { atom } from "jotai";

import { detailQueryAtomFactory } from "../detail/detailQueryAtomFactory.ts";
import { buildMissiveSentimentPayloadAtom } from "./buildMissiveSentimentPayloadAtom.ts";
import { setSentimentMutationAtom } from "./setSentimentMutationAtom.ts";
import { missivesQueryAtom } from "../list/missivesQueryAtom.ts";
import { sentimentsQueryAtom } from "../list/sentimentsQueryAtom.ts";
import type { MissiveSentimentInput } from "../types.ts";

export const updateMissiveSentimentAtom = atom<null, [MissiveSentimentInput], Promise<number>>(
    null,
    async (_get, set, input) => {
        const { payload, resolvedWeight } = await set(buildMissiveSentimentPayloadAtom, input);
        await set(setSentimentMutationAtom, [payload]);
        set(missivesQueryAtom);
        set(sentimentsQueryAtom);
        set(detailQueryAtomFactory(input.missiveId));
        return resolvedWeight;
    },
);

export default updateMissiveSentimentAtom;
