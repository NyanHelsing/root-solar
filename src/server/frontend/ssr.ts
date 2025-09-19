import { access, readFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import express from "express";
import type { Application, NextFunction, Request, Response } from "express";

import { createAppLogger } from "@root-solar/observability";
import type { FrontendLifecycle } from "./types.ts";

const prodFrontendLogger = createAppLogger("server:frontend:prod", {
  tags: ["server", "frontend", "prod"],
});

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
    prodFrontendLogger.debug("File missing", {
      filepath,
      tags: ["fs"],
    });
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
      prodFrontendLogger.info("SSR renderer located", {
        candidate,
        exportName: "render",
        tags: ["startup", "ssr"],
      });
      return (options) => module.render(options);
    }
    if (typeof module.default === "function") {
      prodFrontendLogger.info("SSR renderer located", {
        candidate,
        exportName: "default",
        tags: ["startup", "ssr"],
      });
      return (options) => module.default(options);
    }
    prodFrontendLogger.debug("SSR candidate missing callable export", {
      candidate,
      tags: ["startup", "ssr"],
    });
  }

  prodFrontendLogger.warn("No SSR renderer discovered", {
    tags: ["startup", "ssr"],
  });
  return null;
};

const createRequestHandler = (
  template: string,
  renderer: SsrRenderer | null,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      prodFrontendLogger.debug("Handling SSR request", {
        url: req.originalUrl,
        hasRenderer: Boolean(renderer),
        tags: ["request", "ssr"],
      });
      if (renderer) {
        const result = await renderer({ request: req, url: req.originalUrl });
        if (result.headers) {
          for (const [name, value] of Object.entries(result.headers)) {
            res.setHeader(name, value);
          }
        }
        res.status(result.status ?? 200).send(result.html);
        prodFrontendLogger.debug("SSR response rendered", {
          url: req.originalUrl,
          status: result.status ?? 200,
          tags: ["request", "ssr"],
        });
        return;
      }

      res.setHeader("Content-Type", "text/html");
      res.status(200).send(template);
      prodFrontendLogger.debug("SSR fallback template served", {
        url: req.originalUrl,
        tags: ["request", "ssr"],
      });
    } catch (error) {
      prodFrontendLogger.error("SSR request handling failed", error, {
        url: req.originalUrl,
        tags: ["request", "ssr"],
      });
      next(error);
    }
  };
};

export const setupProdFrontend = async (
  app: Application,
): Promise<FrontendLifecycle> => {
  if (!(await fileExists(INDEX_HTML))) {
    prodFrontendLogger.error("Production index.html missing", {
      filepath: INDEX_HTML,
      tags: ["startup", "frontend"],
    });
    throw new Error(
      `Unable to locate ${INDEX_HTML}. Run \"pnpm rsbuild build\" before starting in production mode.`,
    );
  }

  prodFrontendLogger.info("Configuring production frontend", {
    distDir: DIST_DIR,
    tags: ["startup", "frontend"],
  });
  const template = await readFile(INDEX_HTML, "utf-8");
  prodFrontendLogger.debug("Production template loaded", {
    length: template.length,
    tags: ["startup", "frontend"],
  });
  const renderer = await inferRenderer();

  app.use(express.static(DIST_DIR, { index: false }));
  prodFrontendLogger.debug("Static middleware attached", {
    tags: ["startup", "frontend"],
  });
  app.use(createRequestHandler(template, renderer));

  return {
    close: async () => {
      // no resources to clean up for the static renderer
      prodFrontendLogger.debug("Production frontend close invoked", {
        tags: ["shutdown", "frontend"],
      });
    },
  } satisfies FrontendLifecycle;
};
