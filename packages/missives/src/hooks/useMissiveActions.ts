import { useSetAtom } from "jotai";

import { loadMissivesAtom } from "../state/list/index.ts";
import { loadMissiveDetailAtom } from "../state/detail/index.ts";
import {
  addMissiveCommentAtom,
  updateMissiveSentimentAtom,
} from "../state/actions/index.ts";

// These wrappers preserve the existing public API surface while atoms move under state/.
export const useLoadMissives = () => useSetAtom(loadMissivesAtom);
export const useLoadMissiveDetail = () => useSetAtom(loadMissiveDetailAtom);
export const useUpdateMissiveSentiment = () =>
  useSetAtom(updateMissiveSentimentAtom);
export const useAddMissiveComment = () => useSetAtom(addMissiveCommentAtom);
