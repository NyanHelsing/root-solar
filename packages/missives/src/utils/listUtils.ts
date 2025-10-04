import { labelFromSlug, normalizeOptionalSlug, pluralize } from "@root-solar/globalization";

import { SENTIMENT_TAG_SLUG } from "../constants.ts";

const stripTagPrefix = (value: string) =>
    value.slice(0, 4).toLowerCase() === "tag:" ? value.slice(4) : value;

export const normalizeFilterValue = (value?: string | null): string | null => {
    if (!value) {
        return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    return normalizeOptionalSlug(stripTagPrefix(trimmed));
};

export const formatTagLabel = (slug: string) => labelFromSlug(slug);

export type MissiveListCopy = {
    title: string;
    description: string;
    totalLabel: string;
    loadingLabel: string;
    errorLabel: string;
    emptyLabel: string;
    moreInfoLabel: string;
};

export type MissiveListCopyContext = {
    tag?: { slug: string; label: string };
    sentimentSlug?: string;
    sentimentLabel?: string;
};

export const createMissiveListCopy = ({
    tag,
    sentimentSlug,
    sentimentLabel,
}: MissiveListCopyContext): MissiveListCopy => {
    if (sentimentSlug === SENTIMENT_TAG_SLUG) {
        return {
            title: "Axiomatic Alignment",
            description:
                "Summed weights showing how strongly each participant marks a missive as axiomatic.",
            totalLabel: "Total axiomatic allocation",
            loadingLabel: "Refreshing axioms…",
            errorLabel: "Unable to load axioms right now.",
            emptyLabel: "No axioms marked yet.",
            moreInfoLabel: "More Info",
        } satisfies MissiveListCopy;
    }

    if (sentimentSlug) {
        const label = sentimentLabel ?? formatTagLabel(sentimentSlug);
        return {
            title: `${label} Sentiments`,
            description: `Missives filtered by participants' ${label.toLowerCase()} sentiment weights.`,
            totalLabel: "Total weight",
            loadingLabel: "Refreshing missives…",
            errorLabel: "Unable to load missives right now.",
            emptyLabel: `No missives have ${label.toLowerCase()} weights yet.`,
            moreInfoLabel: "Details",
        } satisfies MissiveListCopy;
    }

    if (tag) {
        const label = tag.label;
        return {
            title: `Missives: ${label}`,
            description: "Curated declarations filtered by the selected tag.",
            totalLabel: "Total weight",
            loadingLabel: "Refreshing missives…",
            errorLabel: "Unable to load missives right now.",
            emptyLabel: "No missives found for this filter.",
            moreInfoLabel: "Details",
        } satisfies MissiveListCopy;
    }

    return {
        title: "Missives",
        description: "Curated declarations filtered by the selected criteria.",
        totalLabel: "Total weight",
        loadingLabel: "Refreshing missives…",
        errorLabel: "Unable to load missives right now.",
        emptyLabel: "No missives found for this filter.",
        moreInfoLabel: "Details",
    } satisfies MissiveListCopy;
};
