import { useEffect } from "react";

import { SENTIMENT_TAG_SLUG } from "../../constants.ts";
import { normalizeFilterValue } from "../../utils/listUtils.ts";
import {
    useActiveSentimentTag,
    useSetActiveSentimentFilter,
    useSetActiveSentimentTag,
} from "./index.ts";

export const useActiveSentimentSync = (slug: string | null) => {
    const activeSentiment = useActiveSentimentTag();
    const setActiveSentimentTag = useSetActiveSentimentTag();
    const setActiveSentimentFilter = useSetActiveSentimentFilter();

    useEffect(() => {
        const nextSlug = slug ?? activeSentiment.slug ?? SENTIMENT_TAG_SLUG;
        if (activeSentiment.slug !== nextSlug) {
            setActiveSentimentTag(nextSlug);
        }

        const normalizedFilter = normalizeFilterValue(slug);
        if (activeSentiment.filter !== normalizedFilter) {
            setActiveSentimentFilter(normalizedFilter);
        }
    }, [
        activeSentiment.filter,
        activeSentiment.slug,
        setActiveSentimentFilter,
        setActiveSentimentTag,
        slug,
    ]);
};

export default useActiveSentimentSync;
