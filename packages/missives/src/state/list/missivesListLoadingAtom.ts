import { atom, useAtomValue } from "jotai";

import { missivesLoadableAtom } from "./missivesLoadableAtom.ts";
import { sentimentsLoadableAtom } from "./sentimentsLoadableAtom.ts";

export const missivesListLoadingAtom = atom((get) => {
    const missiveState = get(missivesLoadableAtom);
    const sentimentState = get(sentimentsLoadableAtom);
    return missiveState.state === "loading" || sentimentState.state === "loading";
});

export const useMissivesListLoading = () => useAtomValue(missivesListLoadingAtom);

export default missivesListLoadingAtom;
