import type { SentimentFraction, SentimentProvider } from "@root-solar/net";

import type {
  SentimentAllocation,
  SentimentModel,
} from "../persistence/entities/index.ts";

const parseSentimentRecordId = (recordId: string) => {
  const [beingId, tagId, subjectTable, ...subjectParts] = recordId.split(":");
  if (!beingId || !tagId || !subjectTable || subjectParts.length === 0) {
    throw new Error(`Invalid sentiment record identifier: ${recordId}`);
  }

  return {
    beingId,
    tagId,
    subjectTable,
    subjectId: subjectParts.join(":"),
  };
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

  const safeNumerator = Math.trunc(numerator);
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
  subjectId: string,
  subjectTable: string,
) =>
  allocations.find(
    (allocation) =>
      allocation.subjectId === subjectId && allocation.subjectTable === subjectTable,
  );

export const createModelBackedSentimentProvider = (
  sentiments: Pick<SentimentModel, "listForBeing">,
): SentimentProvider => {
  return async (recordId) => {
    const { beingId, tagId, subjectTable, subjectId } = parseSentimentRecordId(recordId);
    const allocations = await sentiments.listForBeing(beingId, {
      tagId,
      subjectTable,
    });
    const match = findSentimentAllocation(allocations, subjectId, subjectTable);
    if (!match) {
      return null;
    }

    return normaliseFraction(match.weight, match.totalWeightForTag);
  };
};
