import { Context, getDb } from "@root-solar/api";
import { createAppLogger } from "@root-solar/observability";

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
