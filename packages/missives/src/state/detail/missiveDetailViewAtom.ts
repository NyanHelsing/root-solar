import { atom, useAtomValue } from "jotai";

import type { CommentTreeNode, SentimentAllocation } from "@root-solar/api";

import type { MissiveRecord } from "../../types.ts";
import { activeMissiveIdAtom } from "./activeMissiveIdAtom.ts";
import { detailQueryAtomFactory } from "./detailQueryAtomFactory.ts";
import { missiveDetailRecordAtom } from "./missiveDetailRecordAtom.ts";

export type MissiveDetailView = {
  missiveId: string | null;
  record: MissiveRecord | null;
  sentiments: SentimentAllocation[];
  comments: CommentTreeNode[];
};

export const missiveDetailViewAtom = atom((get): MissiveDetailView => {
  const missiveId = get(activeMissiveIdAtom);
  if (!missiveId) {
    return {
      missiveId: null,
      record: null,
      sentiments: [],
      comments: [],
    } satisfies MissiveDetailView;
  }

  const detail = get(detailQueryAtomFactory(missiveId));
  const record = get(missiveDetailRecordAtom(missiveId));

  return {
    missiveId,
    record,
    sentiments: detail?.sentiments ?? [],
    comments: detail?.comments ?? [],
  } satisfies MissiveDetailView;
});

export default missiveDetailViewAtom;

export const useMissiveDetailView = () => useAtomValue(missiveDetailViewAtom);
