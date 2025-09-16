import { Surreal } from "surrealdb";
import { surrealdbNodeEngines } from "@surrealdb/node";

export const getDb = async () => {
  const db = new Surreal({
    engines: surrealdbNodeEngines(),
  });
  await db.connect("surrealkv://root-solar");
  db.use({ namespace: "root-solar", database: "root-solar" });
  return db;
};
