import { useCallback, useId } from "react";

import type { MissiveOverview } from "../types.ts";
import type { MissiveListCopy } from "../utils/listUtils.ts";
import type { TagOption } from "../utils/tagFilterUtils.ts";
import useMissiveTagFilter from "./useMissiveTagFilter.ts";
import useMissiveListCopy from "./useMissiveListCopy.ts";
import useMissiveLoadState from "./useMissiveLoadState.ts";
import useMissiveSentimentSync from "./useMissiveSentimentSync.ts";
import useMissiveTotals from "./useMissiveTotals.ts";

export type MissiveListControllerProps = {
    sentiment?: string | null;
};

export type MissiveListControllerState = {
    copy: MissiveListCopy;
    isLoading: boolean;
    error: string | null;
    missives: MissiveOverview[];
    totalWeight: number;
    filterControlId: string;
    filterValue: string;
    tagOptions: TagOption[];
    handleFilterChange: (nextTag: string | null) => void;
    sentimentFilterSlug: string | null;
    activeSentimentTagId: string;
    isSentimentCapped: boolean;
};

const useMissiveListController = ({
    sentiment
}: MissiveListControllerProps): MissiveListControllerState => {
    const filterControlId = useId();

    const { isLoading, error } = useMissiveLoadState();
    const { normalizedSentiment, activeSentimentTagId, sentimentFilterSlug, isSentimentCapped } =
        useMissiveSentimentSync(sentiment);
    const { filteredMissives, tagOptions, selectedTag, setSelectedTag, activeTagDescriptor } =
        useMissiveTagFilter();
    const { missives: readyMissives, totalWeight } = useMissiveTotals(filteredMissives);

    const handleFilterChange = useCallback(
        (nextTag: string | null) => {
            setSelectedTag(nextTag);
        },
        [setSelectedTag]
    );

    const copy = useMissiveListCopy(activeTagDescriptor, sentimentFilterSlug, normalizedSentiment);

    return {
        copy,
        isLoading,
        error,
        missives: readyMissives,
        totalWeight,
        filterControlId,
        filterValue: selectedTag ?? "",
        tagOptions,
        handleFilterChange,
        sentimentFilterSlug,
        activeSentimentTagId,
        isSentimentCapped
    } satisfies MissiveListControllerState;
};

export default useMissiveListController;
