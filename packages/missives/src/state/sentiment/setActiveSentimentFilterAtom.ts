import { atom, useSetAtom } from "jotai";

import { normalizeFilterValue } from "../../utils/listUtils.ts";
import { activeSentimentAtom } from "./activeSentimentAtom.ts";

export const setActiveSentimentFilterAtom = atom(null, (get, set, slug: string | null) => {
    const current = get(activeSentimentAtom);
    const nextFilter = normalizeFilterValue(slug);
    if (current.filter === nextFilter) {
        return;
    }
    set(activeSentimentAtom, {
        ...current,
        filter: nextFilter,
    });
});

export const useSetActiveSentimentFilter = () => useSetAtom(setActiveSentimentFilterAtom);

export default setActiveSentimentFilterAtom;
