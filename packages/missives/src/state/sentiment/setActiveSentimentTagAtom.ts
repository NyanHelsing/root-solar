import { atom, useSetAtom } from "jotai";

import { normalizeFilterValue } from "../../utils/listUtils.ts";
import { SENTIMENT_TAG_SLUG } from "../../constants.ts";
import { activeSentimentAtom } from "./activeSentimentAtom.ts";

const toSentimentId = (slug: string) => (slug.startsWith("tag:") ? slug : `tag:${slug}`);

const resolveSlug = (slug: string | null | undefined) => {
  const normalized = normalizeFilterValue(slug);
  if (normalized) {
    return normalized;
  }
  return SENTIMENT_TAG_SLUG;
};

export const setActiveSentimentTagAtom = atom(
  null,
  (get, set, slug: string | null | undefined) => {
    const current = get(activeSentimentAtom);
    const nextSlug = resolveSlug(slug);
    const nextId = toSentimentId(nextSlug);
    if (current.id === nextId && current.slug === nextSlug) {
      return;
    }
    set(activeSentimentAtom, {
      id: nextId,
      slug: nextSlug,
      filter: current.filter,
    });
  },
);

export const useSetActiveSentimentTag = () => useSetAtom(setActiveSentimentTagAtom);

export default setActiveSentimentTagAtom;
