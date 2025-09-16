import express from "express";
import { z } from "zod";
import { apiMiddleware } from "./api/middleware.ts";

const PORT = process.env.PORT || 3000;

express()
  .use(
    "/",
    express.Router().get("/health", (req, res) => {
      res.status(200).send("ok");
    }),
  )
  .use("/api", apiMiddleware)
  .listen(PORT, () => {
    console.info(`Server listening on ${PORT}`);
  });
