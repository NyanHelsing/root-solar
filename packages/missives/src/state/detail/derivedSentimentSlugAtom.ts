import { atom, useAtomValue } from "jotai";
import { atomFamily } from "jotai/utils";

import { SENTIMENT_TAG_SLUG } from "../../constants.ts";
import { normalizeSentimentSlug } from "../../utils/normalizeSentimentSlug.ts";

const derivedSentimentSlugFamily = atomFamily((key: string) =>
    atom(() => {
        const [tagSlug, sentiment] = key.split("|", 2);
        const normalized = normalizeSentimentSlug(sentiment || undefined);
        if (normalized) {
            return normalized;
        }
        if (tagSlug === SENTIMENT_TAG_SLUG) {
            return SENTIMENT_TAG_SLUG;
        }
        return null;
    }),
);

const toKey = (tagSlug?: string, sentiment?: string) => `${tagSlug ?? ""}|${sentiment ?? ""}`;

export const useDerivedSentimentSlug = ({
    tagSlug,
    sentiment,
}: {
    tagSlug?: string;
    sentiment?: string;
}) => useAtomValue(derivedSentimentSlugFamily(toKey(tagSlug, sentiment)));

export default derivedSentimentSlugFamily;
