import { atom, useAtomValue } from "jotai";

import { filterMissivesByTag } from "../../utils/tagFilterUtils.ts";
import { missivesOverviewAtom } from "./missivesOverviewAtom.ts";
import { missiveTagSelectionAtom } from "./missiveTagSelectionAtom.ts";
import { activeSentimentAtom } from "../sentiment/activeSentimentAtom.ts";

export const filteredMissivesAtom = atom((get) => {
  const missives = get(missivesOverviewAtom);
  const selectedTag = get(missiveTagSelectionAtom);
  const sentimentFilter = get(activeSentimentAtom).filter;
  return filterMissivesByTag(missives, selectedTag, sentimentFilter);
});

export const useFilteredMissives = () => useAtomValue(filteredMissivesAtom);

export default filteredMissivesAtom;
