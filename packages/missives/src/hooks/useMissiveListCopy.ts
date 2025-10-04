import { useMemo } from "react";
import { labelFromSlug } from "@root-solar/globalization";

import type { MissiveListCopy } from "../utils/listUtils.ts";
import { createMissiveListCopy } from "../utils/listUtils.ts";
import type { TagOption } from "../utils/tagFilterUtils.ts";

export const useMissiveListCopy = (
    activeTag: TagOption | undefined,
    sentimentFilterSlug: string | null,
    normalizedSentiment: string | null
): MissiveListCopy => {
    const sentimentLabel = useMemo(() => {
        if (!normalizedSentiment) {
            return undefined;
        }
        return labelFromSlug(normalizedSentiment);
    }, [normalizedSentiment]);

    return useMemo(
        () =>
            createMissiveListCopy({
                tag: activeTag,
                sentimentSlug: sentimentFilterSlug ?? undefined,
                sentimentLabel
            }),
        [activeTag, sentimentFilterSlug, sentimentLabel]
    );
};

export default useMissiveListCopy;
