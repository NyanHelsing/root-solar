import { atom, useAtomValue } from "jotai";

import { buildTagOptions } from "../../utils/tagFilterUtils.ts";
import { missivesOverviewAtom } from "./missivesOverviewAtom.ts";
import { missiveTagSelectionAtom } from "./missiveTagSelectionAtom.ts";

export const missiveTagOptionsAtom = atom((get) => {
  const missives = get(missivesOverviewAtom);
  const selectedTag = get(missiveTagSelectionAtom);
  return buildTagOptions(missives, selectedTag);
});

export const useMissiveTagOptions = () => useAtomValue(missiveTagOptionsAtom);

export default missiveTagOptionsAtom;
