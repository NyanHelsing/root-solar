import { useEffect, useMemo } from "react";

import { SENTIMENT_TAG_SLUG } from "../constants.ts";
import { normalizeFilterValue } from "../utils/listUtils.ts";
import {
    useActiveSentimentTag,
    useSetActiveSentimentFilter,
    useSetActiveSentimentTag
} from "../state/sentiment/index.ts";

// Route-level sentiment input still needs an effect to push into atoms; normalization now happens inside the atom setters.
export const useMissiveSentimentSync = (sentiment?: string | null) => {
    const normalizedSentiment = useMemo(() => normalizeFilterValue(sentiment), [sentiment]);
    const activeSentiment = useActiveSentimentTag();
    const setActiveSentimentTag = useSetActiveSentimentTag();
    const setActiveSentimentFilter = useSetActiveSentimentFilter();

    const resolvedActiveSentimentSlug =
        normalizeFilterValue(activeSentiment.slug) ?? SENTIMENT_TAG_SLUG;
    const activeTagSlug = normalizedSentiment ?? resolvedActiveSentimentSlug;
    const activeSentimentTagId = `tag:${activeTagSlug}`;
    const sentimentFilterSlug = normalizedSentiment ?? null;

    useEffect(() => {
        setActiveSentimentTag(activeTagSlug);
        setActiveSentimentFilter(sentimentFilterSlug);
    }, [activeTagSlug, sentimentFilterSlug, setActiveSentimentFilter, setActiveSentimentTag]);

    return {
        normalizedSentiment,
        activeSentimentTagId,
        sentimentFilterSlug,
        isSentimentCapped: activeTagSlug === SENTIMENT_TAG_SLUG
    } as const;
};

export default useMissiveSentimentSync;
