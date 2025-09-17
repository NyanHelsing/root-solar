import { access, readFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import express from "express";
import type { Application, NextFunction, Request, Response } from "express";

import type { FrontendLifecycle } from "./types.ts";

const SSR_ENTRY_CANDIDATES = [
  "server/entry.mjs",
  "server/entry.js",
  "server/index.mjs",
  "server/index.js",
  "entry-server.mjs",
  "entry-server.js",
] as const;

const HERE = fileURLToPath(new URL(".", import.meta.url));
const ROOT_DIR = path.resolve(HERE, "../../../");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const INDEX_HTML = path.join(DIST_DIR, "index.html");

const fileExists = async (filepath: string) => {
  try {
    await access(filepath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
};

interface RenderResult {
  html: string;
  status?: number;
  headers?: Record<string, string>;
}

type SsrRenderer = (options: {
  request: Request;
  url: string;
}) => Promise<RenderResult> | RenderResult;

const inferRenderer = async (): Promise<SsrRenderer | null> => {
  for (const candidate of SSR_ENTRY_CANDIDATES) {
    const entryPath = path.join(DIST_DIR, candidate);
    if (!(await fileExists(entryPath))) {
      continue;
    }

    const moduleUrl = pathToFileURL(entryPath).href;
    const module = await import(moduleUrl);
    if (typeof module.render === "function") {
      return (options) => module.render(options);
    }
    if (typeof module.default === "function") {
      return (options) => module.default(options);
    }
  }

  return null;
};

const createRequestHandler = (
  template: string,
  renderer: SsrRenderer | null,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (renderer) {
        const result = await renderer({ request: req, url: req.originalUrl });
        if (result.headers) {
          for (const [name, value] of Object.entries(result.headers)) {
            res.setHeader(name, value);
          }
        }
        res.status(result.status ?? 200).send(result.html);
        return;
      }

      res.setHeader("Content-Type", "text/html");
      res.status(200).send(template);
    } catch (error) {
      next(error);
    }
  };
};

export const setupProdFrontend = async (
  app: Application,
): Promise<FrontendLifecycle> => {
  if (!(await fileExists(INDEX_HTML))) {
    throw new Error(
      `Unable to locate ${INDEX_HTML}. Run \"pnpm rsbuild build\" before starting in production mode.`,
    );
  }

  const template = await readFile(INDEX_HTML, "utf-8");
  const renderer = await inferRenderer();

  app.use(express.static(DIST_DIR, { index: false }));
  app.use(createRequestHandler(template, renderer));

  return {
    close: async () => {
      // no resources to clean up for the static renderer
    },
  } satisfies FrontendLifecycle;
};
