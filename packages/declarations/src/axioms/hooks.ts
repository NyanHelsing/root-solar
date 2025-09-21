import {
  useAddMissiveComment,
  useMissiveDetailState,
  useMissivesListError,
  useMissivesListLoading,
  useMissivesOverview,
  useMissivesTotalWeight,
  useLoadMissiveDetail,
  useLoadMissives,
  useUpdateMissiveSentiment,
} from "../missives/hooks.ts";
import type {
  MissiveDetailState,
  MissiveOverview,
  MissiveHookOptions,
} from "../missives/hooks.ts";
import { MAX_SENTIMENT_WEIGHT, SENTIMENT_TYPE } from "./constants.ts";

const KIND = "axiom" as const;

const options = {
  sentimentType: SENTIMENT_TYPE,
  maxSentimentWeight: MAX_SENTIMENT_WEIGHT,
} satisfies MissiveHookOptions;

export type AxiomOverview = MissiveOverview;
export type AxiomDetailState = MissiveDetailState;

export const useAxiomsOverview = () => useMissivesOverview(KIND, options);
export const useAxiomsTotalWeight = () => useMissivesTotalWeight(KIND, options);
export const useAxiomsListLoading = () => useMissivesListLoading(KIND, options);
export const useAxiomsListError = () => useMissivesListError(KIND, options);
export const useLoadAxioms = () => useLoadMissives(KIND, options);
export const useLoadAxiomDetail = () => useLoadMissiveDetail(KIND, options);
export const useUpdateAxiomSentiment = () =>
  useUpdateMissiveSentiment(KIND, options);
export const useAddAxiomComment = () => useAddMissiveComment(KIND, options);
export const useAxiomDetailState = (axiomId?: string) =>
  useMissiveDetailState(KIND, axiomId, options);
