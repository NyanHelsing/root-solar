import { Context } from "../api/context.ts";
import { getDb } from "../api/persistence/db.ts";
import { createAppLogger } from "../logging/index.ts";

const contextLogger = createAppLogger("server:context", {
  tags: ["server", "context"],
});

export const createServerContext = async () => {
  contextLogger.debug("Creating server context", {
    tags: ["startup"],
  });
  const db = await getDb();
  contextLogger.debug("Database handle acquired", {
    tags: ["startup", "database"],
  });
  const context = new Context({ db });
  contextLogger.debug("Server context created", {
    tags: ["startup"],
  });
  return context;
};
