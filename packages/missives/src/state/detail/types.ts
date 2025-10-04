import type { AxiomRecord, CommentTreeNode, SentimentAllocation } from "@root-solar/api";

export type MissiveDetailPayload =
    | (AxiomRecord & {
          comments: CommentTreeNode[];
          sentiments: SentimentAllocation[];
      })
    | null;
