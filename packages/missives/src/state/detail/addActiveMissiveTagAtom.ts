import { atom, useSetAtom } from "jotai";

import { normalizeOptionalSlug } from "@root-solar/globalization";
import { trpc } from "@root-solar/api/client";

import { activeMissiveIdAtom } from "./activeMissiveIdAtom.ts";
import { loadMissiveDetailAtom } from "./loadMissiveDetailAtom.ts";

const addMissiveTagMutationAtom = trpc.addMissiveTag.atomWithMutation();

const stripTagPrefix = (value: string) =>
  value.startsWith("tag:") ? value.slice(4) : value;

const resolveTagSlug = (input: string): string | null => {
  const normalized = normalizeOptionalSlug(stripTagPrefix(input.trim()));
  if (!normalized) {
    return null;
  }
  return normalized;
};

export const addActiveMissiveTagAtom = atom(
  null,
  async (get, set, tagInput: string) => {
    const missiveId = get(activeMissiveIdAtom);
    if (!missiveId) {
      throw new Error("Select a missive before adding tags.");
    }
    const slug = resolveTagSlug(tagInput);
    if (!slug) {
      throw new Error("Provide a valid tag slug.");
    }
    await set(addMissiveTagMutationAtom, [{
      missiveId,
      tagSlug: slug,
    }]);
    await set(loadMissiveDetailAtom, missiveId);
  },
);

export const useAddActiveMissiveTag = () => {
  const addTag = useSetAtom(addActiveMissiveTagAtom);
  return async (tagInput: string) => {
    await addTag(tagInput);
  };
};

export default addActiveMissiveTagAtom;
