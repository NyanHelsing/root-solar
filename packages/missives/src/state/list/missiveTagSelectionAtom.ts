import { atom, useAtomValue, useSetAtom } from "jotai";

import { normalizeFilterValue } from "../../utils/listUtils.ts";
import { activeSentimentAtom } from "../sentiment/activeSentimentAtom.ts";

const selectionStateAtom = atom({
    selection: null as string | null,
    sentimentKey: null as string | null,
});

export const missiveTagSelectionAtom = atom(
    (get) => {
        const { selection, sentimentKey } = get(selectionStateAtom);
        const activeSentiment = get(activeSentimentAtom);
        if (sentimentKey !== activeSentiment.filter) {
            return null;
        }
        return selection;
    },
    (get, set, next: string | null) => {
        const canonicalSelection = next ? normalizeFilterValue(next) : null;
        const activeSentiment = get(activeSentimentAtom);
        const current = get(selectionStateAtom);
        if (
            current.selection === canonicalSelection &&
            current.sentimentKey === activeSentiment.filter
        ) {
            return;
        }
        set(selectionStateAtom, {
            selection: canonicalSelection,
            sentimentKey: activeSentiment.filter,
        });
    },
);

export const useSelectedMissiveTag = () => useAtomValue(missiveTagSelectionAtom);
export const useSetSelectedMissiveTag = () => useSetAtom(missiveTagSelectionAtom);

export default missiveTagSelectionAtom;
