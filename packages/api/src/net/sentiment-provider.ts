import type { SentimentFraction, SentimentProvider } from "@root-solar/net";

import type {
  SentimentAllocation,
  SentimentModel,
} from "../persistence/entities/index.ts";

const parseSentimentRecordId = (recordId: string) => {
  const [beingRaw, type, axiomRaw] = recordId.split(":");
  if (!beingRaw || !type || !axiomRaw) {
    throw new Error(`Invalid sentiment record identifier: ${recordId}`);
  }

  return { beingId: beingRaw, type, axiomId: axiomRaw };
};

const gcd = (a: number, b: number): number => {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y !== 0) {
    const remainder = x % y;
    x = y;
    y = remainder;
  }
  return x === 0 ? 1 : x;
};

const normaliseFraction = (
  numerator: number,
  denominator: number,
): SentimentFraction => {
  if (numerator <= 0) {
    return { numerator: 0, denominator: 1 } satisfies SentimentFraction;
  }
  if (denominator <= 0) {
    return { numerator: 0, denominator: 1 } satisfies SentimentFraction;
  }

  let safeNumerator = Math.trunc(numerator);
  let safeDenominator = Math.trunc(denominator);

  if (safeNumerator >= safeDenominator) {
    safeDenominator = safeNumerator + 1;
  }

  const divisor = gcd(safeNumerator, safeDenominator);
  return {
    numerator: safeNumerator / divisor,
    denominator: safeDenominator / divisor,
  } satisfies SentimentFraction;
};

const findSentimentAllocation = (
  allocations: SentimentAllocation[],
  axiomId: string,
) => allocations.find((allocation) => allocation.axiomId === axiomId);

export const createModelBackedSentimentProvider = (
  sentiments: Pick<SentimentModel, "listForBeing">,
): SentimentProvider => {
  return async (recordId) => {
    const { beingId, type, axiomId } = parseSentimentRecordId(recordId);
    const allocations = await sentiments.listForBeing(beingId, { type });
    const match = findSentimentAllocation(allocations, axiomId);
    if (!match) {
      return null;
    }

    return normaliseFraction(match.weight, match.totalWeightForType);
  };
};
