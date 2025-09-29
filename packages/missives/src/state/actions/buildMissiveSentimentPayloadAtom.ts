import { atom } from "jotai";

import { beingAtom } from "@root-solar/auth";

import { MAX_SENTIMENT_WEIGHT } from "../../constants.ts";
import { activeSentimentAtom } from "../sentiment/activeSentimentAtom.ts";
import type {
  MissiveSentimentInput,
  SentimentMutationContext,
} from "../types.ts";

export const buildMissiveSentimentPayloadAtom = atom<
  null,
  [MissiveSentimentInput],
  SentimentMutationContext
>(
  null,
  (get, _set, { missiveId, tagId, weight }) => {
    const being = get(beingAtom);
    const activeSentiment = get(activeSentimentAtom);
    const maxWeight = tagId === activeSentiment.id ? MAX_SENTIMENT_WEIGHT : undefined;
    const normalizedWeight = Math.max(0, Math.round(weight));
    const resolvedWeight =
      maxWeight !== undefined
        ? Math.min(maxWeight, normalizedWeight)
        : normalizedWeight;

    return {
      payload: {
        beingId: being.id,
        subjectId: missiveId,
        subjectTable: "missive",
        tagId,
        weight: resolvedWeight,
        ...(maxWeight !== undefined ? { maxWeight } : {}),
      },
      resolvedWeight,
    } satisfies SentimentMutationContext;
  },
);

export default buildMissiveSentimentPayloadAtom;
