import { atom } from "jotai";

import { detailQueryAtomFactory } from "./detailQueryAtomFactory.ts";

export const loadMissiveDetailAtom = atom(
    null,
    async (_get, set, missiveId: string | null | undefined) => {
        if (!missiveId) {
            return;
        }
        set(detailQueryAtomFactory(missiveId));
    },
);

export default loadMissiveDetailAtom;
