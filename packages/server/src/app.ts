import express from "express";
import type { RequestHandler } from "express";

import { createAppLogger } from "@root-solar/observability";
import { apiMiddleware } from "@root-solar/api/middleware";

const appLogger = createAppLogger("server:app", {
  tags: ["server", "express"],
});

export type CreateBaseAppOptions = {
  apiHandler?: RequestHandler;
};

export const createBaseApp = ({
  apiHandler = apiMiddleware,
}: CreateBaseAppOptions = {}) => {
  appLogger.debug("Creating base express app", {
    tags: ["startup"],
  });
  const app = express();
  app.get("/health", (req, res) => {
    appLogger.debug("Healthcheck requested", {
      method: req.method,
      path: req.path,
      tags: ["healthcheck"],
    });
    res.status(200).send("ok");
  });

  app.use("/api", apiHandler);
  appLogger.debug("Base express app configured", {
    tags: ["startup"],
  });
  return app;
};
