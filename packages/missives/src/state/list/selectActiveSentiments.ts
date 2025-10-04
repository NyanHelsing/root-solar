import type { Loadable } from "jotai/vanilla/utils/loadable";

import type { SentimentAllocation } from "@root-solar/api";

export const selectActiveSentiments = (
    loadableSentiments: Loadable<SentimentAllocation[]>,
    tagId: string
): SentimentAllocation[] => {
    if (loadableSentiments.state !== "hasData") {
        return [];
    }
    return loadableSentiments.data.filter((allocation) => allocation.tagId === tagId);
};

export default selectActiveSentiments;
