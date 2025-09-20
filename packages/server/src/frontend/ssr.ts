import { access, readFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import express from "express";
import type { Application, NextFunction, Request, Response } from "express";

import { createAppLogger } from "@root-solar/observability";
import {
  DEFAULT_SHELL_DIST_SUBDIR,
  DEFAULT_SHELL_MOUNT,
  DEFAULT_SNB_DIST_SUBDIR,
  DEFAULT_SNB_MOUNT,
  DEFAULT_AUTH_DIST_SUBDIR,
  DEFAULT_AUTH_MOUNT,
  resolveDistSubdir,
  resolveMountPath,
} from "../../../../config/mfePaths.ts";
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

const ROOT_DIR = process.env.ROOT_SOLAR_ROOT
  ? path.resolve(process.env.ROOT_SOLAR_ROOT)
  : process.cwd();
const DIST_ROOT = path.join(ROOT_DIR, "dist");
const SHELL_DIST_DIR = path.join(DIST_ROOT, DEFAULT_SHELL_DIST_SUBDIR);
const resolvePrimaryTemplate = (): string => {
  const hint = process.env.SHELL_HTML?.trim();
  if (!hint) {
    return path.join(DIST_ROOT, "index.html");
  }
  return path.isAbsolute(hint) ? hint : path.join(DIST_ROOT, hint);
};

const PRIMARY_TEMPLATE = resolvePrimaryTemplate();
const SHELL_TEMPLATE_FALLBACK = path.join(
  DIST_ROOT,
  DEFAULT_SHELL_DIST_SUBDIR,
  "index.html",
);

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
    const entryPath = path.join(DIST_ROOT, candidate);
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
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }

    const acceptsHtml = req.headers.accept?.includes("text/html");
    if (!acceptsHtml) {
      return next();
    }

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

const mountStaticIfPresent = async (
  app: Application,
  mountPath: string,
  directory: string,
) => {
  if (!(await fileExists(directory))) {
    prodFrontendLogger.debug("Static directory missing; skipping mount", {
      mountPath,
      directory,
      tags: ["startup", "frontend"],
    });
    return;
  }

  prodFrontendLogger.debug("Attaching static middleware", {
    mountPath,
    directory,
    tags: ["startup", "frontend"],
  });
  app.use(mountPath, express.static(directory, { index: false }));
};

const resolveTemplatePath = async (): Promise<string> => {
  if (await fileExists(PRIMARY_TEMPLATE)) {
    return PRIMARY_TEMPLATE;
  }
  if (await fileExists(SHELL_TEMPLATE_FALLBACK)) {
    return SHELL_TEMPLATE_FALLBACK;
  }
  throw new Error(
    `Unable to locate an HTML template under dist/. Expected ${PRIMARY_TEMPLATE} or ${SHELL_TEMPLATE_FALLBACK}. Run "pnpm run build" before starting in production mode.`,
  );
};

export const setupProdFrontend = async (
  app: Application,
): Promise<FrontendLifecycle> => {
  const templatePath = await resolveTemplatePath();

  const shellDist = SHELL_DIST_DIR;

  prodFrontendLogger.info("Configuring production frontend", {
    distDir: shellDist,
    templatePath,
    tags: ["startup", "frontend"],
  });
  const template = await readFile(templatePath, "utf-8");
  prodFrontendLogger.debug("Production template loaded", {
    length: template.length,
    tags: ["startup", "frontend"],
  });
  const renderer = await inferRenderer();

  const shellStaticMount = resolveMountPath(
    process.env.SHELL_STATIC_PATH,
    DEFAULT_SHELL_MOUNT,
  );
  await mountStaticIfPresent(app, shellStaticMount, shellDist);

  const snbMount = resolveMountPath(process.env.SNB_REMOTE_PATH, DEFAULT_SNB_MOUNT);
  const snbDistSubdir = resolveDistSubdir(
    process.env.SNB_DIST_SUBDIR,
    DEFAULT_SNB_DIST_SUBDIR,
  );
  const snbDist = path.join(DIST_ROOT, snbDistSubdir);
  await mountStaticIfPresent(app, snbMount, snbDist);

  const authMount = resolveMountPath(
    process.env.AUTH_REMOTE_PATH,
    DEFAULT_AUTH_MOUNT,
  );
  const authDistSubdir = resolveDistSubdir(
    process.env.AUTH_DIST_SUBDIR,
    DEFAULT_AUTH_DIST_SUBDIR,
  );
  const authDist = path.join(DIST_ROOT, authDistSubdir);
  await mountStaticIfPresent(app, authMount, authDist);

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
