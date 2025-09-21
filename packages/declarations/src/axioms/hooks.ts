import { useMemo } from "react";
import { atom, useAtomValue, useSetAtom } from "jotai";

import type { AxiomRecord, CommentTreeNode, SentimentAllocation } from "@root-solar/api";

import {
  SENTIMENT_TYPE,
  axiomsStoreAtom,
  addAxiomCommentAtom,
  loadAxiomDetailAtom,
  loadAxiomsAtom,
  updateAxiomSentimentAtom,
} from "./atoms.ts";

export type AxiomOverview = {
  id: string;
  title: string;
  details?: string;
  weight: number;
  ratio: number;
};

export type AxiomDetailState = {
  record: AxiomRecord | null;
  sentiments: SentimentAllocation[];
  comments: CommentTreeNode[];
  isLoading: boolean;
  error: string | null;
  hasDetail: boolean;
};

const axiomsOverviewAtom = atom<AxiomOverview[]>((get) => {
  const store = get(axiomsStoreAtom);
  return store.order.map((id) => {
    const entity = store.entities[id];
    if (!entity) {
      return {
        id,
        title: id,
        weight: 0,
        ratio: 0,
      } satisfies AxiomOverview;
    }
    const sentiment = entity.sentiments[SENTIMENT_TYPE];
    return {
      id,
      title: entity.record.title,
      details: entity.record.details,
      weight: sentiment?.weight ?? 0,
      ratio: sentiment?.ratio ?? 0,
    } satisfies AxiomOverview;
  });
});

const axiomsTotalWeightAtom = atom((get) =>
  get(axiomsOverviewAtom).reduce((total, axiom) => total + axiom.weight, 0),
);

const axiomsListLoadingAtom = atom((get) => get(axiomsStoreAtom).listStatus.isLoading);
const axiomsListErrorAtom = atom((get) => get(axiomsStoreAtom).listStatus.error);

const createDetailSelectorAtom = (axiomId?: string) =>
  atom<AxiomDetailState>((get) => {
    if (!axiomId) {
      return {
        record: null,
        sentiments: [],
        comments: [],
        isLoading: false,
        error: null,
        hasDetail: false,
      } satisfies AxiomDetailState;
    }
    const store = get(axiomsStoreAtom);
    const entity = store.entities[axiomId];
    const status = store.detailStatus[axiomId];
    return {
      record: entity?.record ?? null,
      sentiments: entity ? Object.values(entity.sentiments).sort((a, b) => a.type.localeCompare(b.type)) : [],
      comments: entity?.comments ?? [],
      isLoading: status?.isLoading ?? false,
      error: status?.error ?? null,
      hasDetail: entity?.detailLoadedAt != null,
    } satisfies AxiomDetailState;
  });

export const useAxiomsOverview = () => useAtomValue(axiomsOverviewAtom);
export const useAxiomsTotalWeight = () => useAtomValue(axiomsTotalWeightAtom);
export const useAxiomsListLoading = () => useAtomValue(axiomsListLoadingAtom);
export const useAxiomsListError = () => useAtomValue(axiomsListErrorAtom);
export const useLoadAxioms = () => useSetAtom(loadAxiomsAtom);
export const useLoadAxiomDetail = () => useSetAtom(loadAxiomDetailAtom);
export const useUpdateAxiomSentiment = () => useSetAtom(updateAxiomSentimentAtom);
export const useAddAxiomComment = () => useSetAtom(addAxiomCommentAtom);

export const useAxiomDetailState = (axiomId?: string) => {
  const detailAtom = useMemo(() => createDetailSelectorAtom(axiomId), [axiomId]);
  return useAtomValue(detailAtom);
};
