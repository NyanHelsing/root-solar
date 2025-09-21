import { useMemo } from "react";
import { atom, useAtomValue, useSetAtom } from "jotai";

import type {
  CommentTreeNode,
  MissiveRecord,
  SentimentAllocation,
} from "@root-solar/api";
import type { MissiveKind } from "@root-solar/planning";

import { getMissiveAtoms } from "./atoms.ts";

export type MissiveOverview = {
  id: string;
  kind: MissiveKind;
  title: string;
  summary?: string;
  weight: number;
  ratio: number;
};

export type MissiveDetailState = {
  record: MissiveRecord | null;
  sentiments: SentimentAllocation[];
  comments: CommentTreeNode[];
  isLoading: boolean;
  error: string | null;
  hasDetail: boolean;
};

export type MissiveHookOptions = {
  sentimentType?: string;
  maxSentimentWeight?: number;
};

const DEFAULT_SENTIMENT_TYPE = "priority";

const useMissiveAtoms = (
  kind: MissiveKind,
  options?: MissiveHookOptions,
) => {
  const sentimentType = options?.sentimentType ?? DEFAULT_SENTIMENT_TYPE;
  const maxSentimentWeight = options?.maxSentimentWeight;
  return useMemo(
    () =>
      getMissiveAtoms({
        kind,
        sentimentType,
        maxSentimentWeight,
      }),
    [kind, sentimentType, maxSentimentWeight],
  );
};

const sortSentiments = (sentiments: Record<string, SentimentAllocation>) =>
  Object.values(sentiments).sort((a, b) => a.type.localeCompare(b.type));

export const useMissivesOverview = (
  kind: MissiveKind,
  options?: MissiveHookOptions,
) => {
  const atoms = useMissiveAtoms(kind, options);
  const store = useAtomValue(atoms.storeAtom);
  const sentimentType = atoms.sentimentType;
  return useMemo(
    () =>
      store.order.map((id) => {
        const entity = store.entities[id];
        if (!entity) {
          return {
            id,
            kind,
            title: id,
            weight: 0,
            ratio: 0,
          } satisfies MissiveOverview;
        }
        const sentiment = entity.sentiments[sentimentType];
        return {
          id,
          kind,
          title: entity.record.title,
          summary: entity.record.summary,
          weight: sentiment?.weight ?? 0,
          ratio: sentiment?.ratio ?? 0,
        } satisfies MissiveOverview;
      }),
    [store, kind, sentimentType],
  );
};

export const useMissivesTotalWeight = (
  kind: MissiveKind,
  options?: MissiveHookOptions,
) => {
  const overviews = useMissivesOverview(kind, options);
  return useMemo(
    () => overviews.reduce((total, missive) => total + missive.weight, 0),
    [overviews],
  );
};

export const useMissivesListLoading = (
  kind: MissiveKind,
  options?: MissiveHookOptions,
) => {
  const atoms = useMissiveAtoms(kind, options);
  const store = useAtomValue(atoms.storeAtom);
  return store.listStatus.isLoading;
};

export const useMissivesListError = (
  kind: MissiveKind,
  options?: MissiveHookOptions,
) => {
  const atoms = useMissiveAtoms(kind, options);
  const store = useAtomValue(atoms.storeAtom);
  return store.listStatus.error;
};

export const useLoadMissives = (
  kind: MissiveKind,
  options?: MissiveHookOptions,
) => {
  const atoms = useMissiveAtoms(kind, options);
  return useSetAtom(atoms.loadListAtom);
};

export const useLoadMissiveDetail = (
  kind: MissiveKind,
  options?: MissiveHookOptions,
) => {
  const atoms = useMissiveAtoms(kind, options);
  return useSetAtom(atoms.loadDetailAtom);
};

export const useUpdateMissiveSentiment = (
  kind: MissiveKind,
  options?: MissiveHookOptions,
) => {
  const atoms = useMissiveAtoms(kind, options);
  return useSetAtom(atoms.updateSentimentAtom);
};

export const useAddMissiveComment = (
  kind: MissiveKind,
  options?: MissiveHookOptions,
) => {
  const atoms = useMissiveAtoms(kind, options);
  return useSetAtom(atoms.addCommentAtom);
};

export const useMissiveDetailState = (
  kind: MissiveKind,
  missiveId?: string,
  options?: MissiveHookOptions,
) => {
  const atoms = useMissiveAtoms(kind, options);
  const detailAtom = useMemo(
    () =>
      atom((get) => {
        if (!missiveId) {
          return {
            record: null,
            sentiments: [],
            comments: [],
            isLoading: false,
            error: null,
            hasDetail: false,
          } satisfies MissiveDetailState;
        }
        const store = get(atoms.storeAtom);
        const entity = store.entities[missiveId];
        const status = store.detailStatus[missiveId];
        return {
          record: entity?.record ?? null,
          sentiments: entity
            ? sortSentiments(entity.sentiments)
            : ([] as SentimentAllocation[]),
          comments: entity?.comments ?? [],
          isLoading: status?.isLoading ?? false,
          error: status?.error ?? null,
          hasDetail: entity?.detailLoadedAt != null,
        } satisfies MissiveDetailState;
      }),
    [atoms, missiveId],
  );
  return useAtomValue(detailAtom);
};
