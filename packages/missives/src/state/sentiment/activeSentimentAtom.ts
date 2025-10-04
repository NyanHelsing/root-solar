import { atom, useAtomValue } from "jotai";

import { SENTIMENT_TAG_ID, SENTIMENT_TAG_SLUG } from "../../constants.ts";
import type { ActiveSentiment } from "../../types.ts";

export const activeSentimentAtom = atom<ActiveSentiment>({
    id: SENTIMENT_TAG_ID,
    slug: SENTIMENT_TAG_SLUG,
    filter: null,
});

export const useActiveSentimentTag = () => useAtomValue(activeSentimentAtom);
export const useActiveSentimentFilter = () => useAtomValue(activeSentimentAtom).filter;

export default activeSentimentAtom;
