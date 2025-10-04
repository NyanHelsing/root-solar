export type MissiveSentimentInput = {
    missiveId: string;
    tagId: string;
    weight: number;
};

export type SentimentMutationVariables = {
    beingId: string;
    subjectId: string;
    subjectTable: "missive";
    tagId: string;
    weight: number;
    maxWeight?: number;
};

export type SentimentMutationContext = {
    payload: SentimentMutationVariables;
    resolvedWeight: number;
};

export type MissiveCreationInput = {
    title: string;
    details?: string;
    tagSlugs?: string[];
};

export type MissiveUpdateInput = {
    missiveId: string;
    title: string;
    details?: string;
};
