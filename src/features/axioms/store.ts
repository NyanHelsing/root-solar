import { atom } from "jotai";

import { client } from "../../api/client.ts";
import type { AxiomRecord } from "../../api/persistence/entities/index.ts";
import type { SentimentAllocation } from "../../api/persistence/entities/index.ts";
import { beingAtom } from "../beings/store.ts";

export const SENTIMENT_TYPE = "priority" as const;
export const MAX_SENTIMENT_WEIGHT = 100;

export type AxiomSentiment = {
  id: number;
  title: string;
  weight: number;
  ratio: number;
};

const baseAxiomsAtom = atom<AxiomSentiment[]>([]);
const isLoadingAtom = atom(false);

const computeRatios = (records: AxiomSentiment[]) => {
  const total = records.reduce((sum, record) => sum + record.weight, 0);
  if (total === 0) {
    return records.map((record) => ({ ...record, ratio: 0 }));
  }
  return records.map((record) => ({
    ...record,
    ratio: record.weight / total,
  }));
};

const mergeAxioms = (axioms: AxiomRecord[], sentiments: SentimentAllocation[]) => {
  const allocations = new Map<number, SentimentAllocation>();
  for (const sentiment of sentiments) {
    allocations.set(sentiment.axiomId, sentiment);
  }

  const merged = axioms.map<AxiomSentiment>((axiom) => {
    const allocation = allocations.get(axiom.id);
    return {
      id: axiom.id,
      title: axiom.title,
      weight: allocation?.weight ?? 0,
      ratio: allocation?.ratio ?? 0,
    } satisfies AxiomSentiment;
  });

  return computeRatios(merged);
};

export const loadAxiomsAtom = atom(null, async (get, set) => {
  if (get(isLoadingAtom)) {
    return;
  }
  set(isLoadingAtom, true);
  try {
    const being = get(beingAtom);
    const [axioms, sentiments] = await Promise.all([
      client.listAxioms.query(),
      client.listSentimentsForBeing.query({
        beingId: being.id,
        type: SENTIMENT_TYPE,
      }),
    ]);
    set(baseAxiomsAtom, mergeAxioms(axioms, sentiments));
  } catch (error) {
    console.error("Failed to load axioms", error);
  } finally {
    set(isLoadingAtom, false);
  }
});

export const axiomsAtom = atom((get) => get(baseAxiomsAtom));
export const axiomsTotalWeightAtom = atom((get) =>
  get(baseAxiomsAtom).reduce((sum, item) => sum + item.weight, 0),
);
export const axiomsLoadingAtom = atom((get) => get(isLoadingAtom));

export const setAxiomWeightAtom = atom(
  null,
  async (get, set, update: { axiomId: number; weight: number }) => {
    const safeWeight = Math.max(0, Math.min(MAX_SENTIMENT_WEIGHT, Math.round(update.weight)));
    const being = get(beingAtom);
    try {
      await client.setSentiment.mutate({
        beingId: being.id,
        axiomId: update.axiomId,
        type: SENTIMENT_TYPE,
        weight: safeWeight,
        maxWeight: MAX_SENTIMENT_WEIGHT,
      });
    } catch (error) {
      console.error("Failed to persist sentiment weight", error);
      return;
    }

    const next = get(baseAxiomsAtom).map((record) =>
      record.id === update.axiomId ? { ...record, weight: safeWeight } : record,
    );
    set(baseAxiomsAtom, computeRatios(next));
  },
);
