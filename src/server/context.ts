import { Context } from "../api/context.ts";
import { getDb } from "../api/persistence/db.ts";

export const createServerContext = async () => {
  const db = await getDb();
  return new Context({ db });
};
