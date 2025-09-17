import express from "express";

import { apiMiddleware } from "../api/middleware.ts";

export const createBaseApp = () => {
  const router = express.Router();
  router.get("/health", (_req, res) => {
    res.status(200).send("ok");
  });

  return express().use("/", router).use("/api", apiMiddleware);
};
