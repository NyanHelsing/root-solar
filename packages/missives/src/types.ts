import type {
  AxiomRecord,
  CommentTreeNode,
  SentimentAllocation,
  TagRecord,
} from "@root-solar/api";

export type MissiveRecord = AxiomRecord;

export type MissiveOverview = {
  id: string;
  title: string;
  details?: string;
  weight: number;
  ratio: number;
  tags: TagRecord[];
};

export type MissiveDetailState = {
  record: MissiveRecord | null;
  sentiments: SentimentAllocation[];
  comments: CommentTreeNode[];
  isLoading: boolean;
  error: string | null;
  hasDetail: boolean;
};

export type ActiveSentiment = {
  id: string;
  slug: string;
  filter: string | null;
};
