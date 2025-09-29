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
