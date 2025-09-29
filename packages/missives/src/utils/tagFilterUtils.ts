import { labelFromSlug } from "@root-solar/globalization";

import { SENTIMENT_TAG_SLUG } from "../constants.ts";
import type { MissiveOverview } from "../types.ts";
import { normalizeFilterValue } from "./listUtils.ts";

export type TagOption = {
  slug: string;
  label: string;
};

const canonicalizeSlug = (value: string | null | undefined): string | null =>
  normalizeFilterValue(value);

const ensureSlugLabel = (map: Map<string, string>, slug: string | null | undefined) => {
  const canonical = canonicalizeSlug(slug);
  if (!canonical) {
    return;
  }
  if (!map.has(canonical)) {
    const source = typeof slug === "string" && slug.length > 0 ? slug : canonical;
    map.set(canonical, labelFromSlug(source));
  }
};

export const buildTagOptions = (
  missives: MissiveOverview[],
  activeTag: string | null,
): TagOption[] => {
  const map = new Map<string, string>();

  for (const item of missives) {
    for (const tag of item.tags) {
      const canonical = canonicalizeSlug(tag.slug);
      if (!canonical) {
        continue;
      }
      const label = tag.label?.trim() ? tag.label : labelFromSlug(tag.slug);
      map.set(canonical, label);
    }
  }

  ensureSlugLabel(map, activeTag);
  ensureSlugLabel(map, SENTIMENT_TAG_SLUG);

  return Array.from(map.entries())
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

export const filterMissivesByTag = (
  missives: MissiveOverview[],
  activeTag: string | null,
  sentimentFilterSlug: string | null,
): MissiveOverview[] => {
  const canonicalActiveTag = canonicalizeSlug(activeTag);
  if (!canonicalActiveTag) {
    return missives;
  }
  const canonicalSentiment = canonicalizeSlug(sentimentFilterSlug);
  const canonicalSentimentTag = canonicalizeSlug(SENTIMENT_TAG_SLUG);
  if (
    canonicalActiveTag === canonicalSentimentTag &&
    canonicalSentiment === canonicalSentimentTag
  ) {
    return missives;
  }
  return missives.filter((item) =>
    item.tags.some((tag) => canonicalizeSlug(tag.slug) === canonicalActiveTag),
  );
};
