import { RecordId } from "surrealdb";

import type { Context } from "../../../context.ts";

export type BeingRecord = {
  id: number;
  name: string;
};

export type AxiomVoteRecord = {
  id: string;
  axiomId: number;
  beingId: number;
  weight: number;
};

const TABLE = "being" as const;
const VOTE_TABLE = "axiom_vote" as const;

const unwrapSingle = <T>(value: T | T[] | null): T | null => {
  if (value === null) {
    return null;
  }
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value;
};

export type BeingModel = ReturnType<typeof createBeingModel>;

export const createBeingModel = (ctx: Context) => {
  return {
    async list() {
      const records = await ctx.db.select<BeingRecord>(TABLE);
      return (records ?? []).sort((a, b) => a.id - b.id);
    },
    async get(id: number) {
      const record = await ctx.db.select<BeingRecord>(
        new RecordId(TABLE, id),
      );
      return unwrapSingle(record);
    },
    async upsert(input: BeingRecord) {
      const record = await ctx.db.upsert<BeingRecord>(
        new RecordId(TABLE, input.id),
        input,
      );
      return unwrapSingle(record);
    },
    async voteForAxiom({
      beingId,
      axiomId,
      weight,
    }: {
      beingId: number;
      axiomId: number;
      weight: number;
    }) {
      const existingBeing = await ctx.db.select<BeingRecord>(
        new RecordId(TABLE, beingId),
      );
      if (!unwrapSingle(existingBeing)) {
        throw new Error(`Being ${beingId} does not exist`);
      }
      const voteId = `${beingId}:${axiomId}`;
      const record = await ctx.db.upsert<AxiomVoteRecord>(
        new RecordId(VOTE_TABLE, voteId),
        {
          id: voteId,
          beingId,
          axiomId,
          weight,
        },
      );
      return unwrapSingle(record);
    },
    async votesForBeing(beingId: number) {
      const [queryResult] = await ctx.db.query<[
        AxiomVoteRecord[] | null,
      ]>("SELECT * FROM type::table($table) WHERE beingId = $beingId", {
        table: VOTE_TABLE,
        beingId,
      });
      if (!queryResult || queryResult.status !== "OK") {
        return [] as AxiomVoteRecord[];
      }
      const votes = queryResult.result;
      if (!Array.isArray(votes)) {
        return [] as AxiomVoteRecord[];
      }
      return votes;
    },
  } satisfies {
    list: () => Promise<BeingRecord[]>;
    get: (id: number) => Promise<BeingRecord | null>;
    upsert: (input: BeingRecord) => Promise<BeingRecord | null>;
    voteForAxiom: (input: {
      beingId: number;
      axiomId: number;
      weight: number;
    }) => Promise<AxiomVoteRecord | null>;
    votesForBeing: (beingId: number) => Promise<AxiomVoteRecord[]>;
  };
};
