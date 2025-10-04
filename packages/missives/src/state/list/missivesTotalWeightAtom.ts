import { atom, useAtomValue } from "jotai";

import { activeSentimentAtom } from "../sentiment/activeSentimentAtom.ts";
import { sentimentsLoadableAtom } from "./sentimentsLoadableAtom.ts";
import { selectActiveSentiments } from "./selectActiveSentiments.ts";

export const missivesTotalWeightAtom = atom((get) => {
    const loadableSentiments = get(sentimentsLoadableAtom);
    const { id: activeSentimentId } = get(activeSentimentAtom);
    const activeSentiments = selectActiveSentiments(loadableSentiments, activeSentimentId);
    if (activeSentiments.length === 0) {
        return 0;
    }
    return activeSentiments.reduce((total, allocation) => total + allocation.weight, 0);
});

export const useMissivesTotalWeight = () => useAtomValue(missivesTotalWeightAtom);

export default missivesTotalWeightAtom;
