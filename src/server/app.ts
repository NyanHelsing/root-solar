import express from "express";

import { createAppLogger } from "@root-solar/observability";
import { apiMiddleware } from "../api/middleware.ts";

const appLogger = createAppLogger("server:app", {
  tags: ["server", "express"],
});

export const createBaseApp = () => {
  appLogger.debug("Creating base express app", {
    tags: ["startup"],
  });
  const router = express.Router();
  router.get("/health", (req, res) => {
    appLogger.debug("Healthcheck requested", {
      method: req.method,
      path: req.path,
      tags: ["healthcheck"],
    });
    res.status(200).send("ok");
  });

  const app = express().use("/", router).use("/api", apiMiddleware);
  appLogger.debug("Base express app configured", {
    tags: ["startup"],
  });
  return app;
};
