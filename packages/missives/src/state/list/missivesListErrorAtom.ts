import { atom, useAtomValue } from "jotai";

import { missivesLoadableAtom } from "./missivesLoadableAtom.ts";
import { sentimentsLoadableAtom } from "./sentimentsLoadableAtom.ts";
import { toErrorMessage } from "./toErrorMessage.ts";

export const missivesListErrorAtom = atom((get) => {
    const missiveState = get(missivesLoadableAtom);
    if (missiveState.state === "hasError") {
        return toErrorMessage(missiveState.error);
    }
    const sentimentState = get(sentimentsLoadableAtom);
    if (sentimentState.state === "hasError") {
        return toErrorMessage(sentimentState.error);
    }
    return null;
});

export const useMissivesListError = () => useAtomValue(missivesListErrorAtom);

export default missivesListErrorAtom;
