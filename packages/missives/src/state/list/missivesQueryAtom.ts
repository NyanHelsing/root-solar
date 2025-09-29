import type { Getter } from "jotai";
import { trpc } from "@root-solar/api/client";

import { activeSentimentAtom } from "../sentiment/activeSentimentAtom.ts";

export const missivesQueryAtom = trpc.listAxioms.atomWithQuery((get: Getter) => {
  const { filter } = get(activeSentimentAtom);
  return filter ? { sentiment: filter } : undefined;
});

export default missivesQueryAtom;
