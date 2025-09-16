import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

import { Being } from "./persistence/entities/being/entity.ts";
//import { type EntityManager, MikroORM } from "@mikro-orm/sqlite";

//import { seed as seedAxioms } from "./persistence/entities/axiom/entity.ts";

//export interface Context {
//  em: EntityManager;
//}
//export const orm = await MikroORM.init();
//await orm.schema.updateSchema();

//await seedAxioms(orm);

import { getDb } from "./persistence/db.ts";

export class Context {
  db: Awaited<ReturnType<typeof getDb>>;
  constructor({ db }: { db: Awaited<ReturnType<typeof getDb>> }) {
    this.db = db;
  }
  get Being() {
    return Being.contextualize(this);
  }
}

export const createContext = async ({
  req,
  res,
}: CreateExpressContextOptions) => {
  const db = await getDb();
  return new Context({ db });
};
