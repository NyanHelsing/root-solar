import path from "node:path";
import { pathToFileURL } from "node:url";

import { createRsbuild, mergeRsbuildConfig, type RsbuildConfig } from "@rsbuild/core";
import type { Application, NextFunction, Request, Response } from "express";

import { createAppLogger } from "@root-solar/observability";
import {
    DEFAULT_SHELL_MOUNT,
    DEFAULT_SNB_MOUNT,
    DEFAULT_AUTH_MOUNT,
    resolveMountPath
} from "../../../../config/mfePaths.ts";
import type { FrontendLifecycle } from "./types.ts";

const devFrontendLogger = createAppLogger("server:frontend:dev", {
    tags: ["server", "frontend", "dev"]
});

const ROOT_DIR = process.env.ROOT_SOLAR_ROOT
    ? path.resolve(process.env.ROOT_SOLAR_ROOT)
    : process.cwd();

const resolveConfig = (value: unknown): RsbuildConfig => {
    if (value && typeof value === "object") {
        return value as RsbuildConfig;
    }
    return {} as RsbuildConfig;
};

interface LoadedConfigs {
    shellConfig: RsbuildConfig;
    snbConfig: RsbuildConfig;
    authConfig: RsbuildConfig;
    shellMountPath: string;
    snbMountPath: string;
    authMountPath: string;
}

const loadRsbuildConfigs = async (): Promise<LoadedConfigs> => {
    const shellMountPath = resolveMountPath(process.env.SHELL_STATIC_PATH, DEFAULT_SHELL_MOUNT);
    if (!process.env.SHELL_STATIC_PATH) {
        process.env.SHELL_STATIC_PATH = shellMountPath;
    }
    const snbMountPath = resolveMountPath(process.env.SNB_REMOTE_PATH, DEFAULT_SNB_MOUNT);
    if (!process.env.SNB_REMOTE_PATH) {
        process.env.SNB_REMOTE_PATH = snbMountPath;
    }
    if (!process.env.SNB_REMOTE_URL) {
        process.env.SNB_REMOTE_URL = snbMountPath;
    }

    const authMountPath = resolveMountPath(process.env.AUTH_REMOTE_PATH, DEFAULT_AUTH_MOUNT);
    if (!process.env.AUTH_REMOTE_PATH) {
        process.env.AUTH_REMOTE_PATH = authMountPath;
    }
    if (!process.env.AUTH_REMOTE_URL) {
        process.env.AUTH_REMOTE_URL = authMountPath;
    }

    const configModuleUrl = pathToFileURL(path.join(ROOT_DIR, "rsbuild.config.ts")).href;
    const module = await import(configModuleUrl);
    const shellConfig = resolveConfig(module.shellConfig ?? module.default);
    const snbConfig = resolveConfig(module.snbConfig);
    const authConfig = resolveConfig(module.authConfig);
    return {
        shellConfig,
        snbConfig,
        authConfig,
        shellMountPath,
        snbMountPath,
        authMountPath
    };
};

const buildHmrPath = (mountPath: string) => `${mountPath}/rsbuild-hmr`;

const resolveEntryName = (config: RsbuildConfig): string => {
    const source = (config as { source?: { entry?: Record<string, unknown> } }).source;
    const entry = source?.entry;
    if (!entry || typeof entry !== "object") {
        return "shell";
    }
    const entryNames = Object.keys(entry);
    return entryNames[0] ?? "shell";
};

const pickFirstEnvironment = <T extends Record<string, unknown>>(environments: T) => {
    const [, environment] = Object.entries(environments).find(([, value]) => value) ?? [];
    return environment;
};

const shouldServeShellHtml = (
    req: Request,
    shellMount: string,
    authMount: string,
    snbMount: string
) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
        return false;
    }
    const pathname = req.path ?? "/";
    if (
        pathname.startsWith("/api") ||
        pathname.startsWith(shellMount) ||
        pathname.startsWith(authMount) ||
        pathname.startsWith(snbMount) ||
        pathname.startsWith("/rsbuild-hmr")
    ) {
        return false;
    }
    if (path.extname(pathname)) {
        return false;
    }
    const acceptHeader = req.headers.accept ?? "";
    return (
        acceptHeader.includes("text/html") || acceptHeader.includes("*/*") || acceptHeader === ""
    );
};

export const setupDevFrontend = async (app: Application): Promise<FrontendLifecycle> => {
    const { shellConfig, snbConfig, authConfig, shellMountPath, snbMountPath, authMountPath } =
        await loadRsbuildConfigs();
    devFrontendLogger.debug("Loaded rsbuild configs for dev server", {
        tags: ["startup"]
    });
    const shellEntryName = resolveEntryName(shellConfig);
    devFrontendLogger.debug("Resolved shell entry name", {
        entry: shellEntryName,
        tags: ["startup", "frontend", "shell"]
    });
    const shellRsbuild = await createRsbuild({
        rsbuildConfig: mergeRsbuildConfig(shellConfig, {
            server: {
                middlewareMode: true
            },
            dev: {
                client: {
                    path: "/rsbuild-hmr"
                }
            }
        }),
        loadEnv: true
    });

    const snbRsbuild = await createRsbuild({
        rsbuildConfig: mergeRsbuildConfig(snbConfig, {
            server: {
                middlewareMode: true
            },
            dev: {
                assetPrefix: snbMountPath,
                client: {
                    path: buildHmrPath(snbMountPath)
                }
            }
        }),
        loadEnv: true
    });

    const authRsbuild = await createRsbuild({
        rsbuildConfig: mergeRsbuildConfig(authConfig, {
            server: {
                middlewareMode: true
            },
            dev: {
                assetPrefix: authMountPath,
                client: {
                    path: buildHmrPath(authMountPath)
                }
            }
        }),
        loadEnv: true
    });

    devFrontendLogger.info("Creating rsbuild middleware for shell host", {
        tags: ["startup", "frontend", "shell"]
    });

    const snbDevServer = await snbRsbuild.createDevServer();
    const authDevServer = await authRsbuild.createDevServer();
    const shellDevServer = await shellRsbuild.createDevServer();
    const shellEnvironment = pickFirstEnvironment(shellDevServer.environments) as
        | {
              getTransformedHtml: (entryName: string) => Promise<string>;
          }
        | undefined;
    if (!shellEnvironment) {
        devFrontendLogger.warn("Shell environment unavailable; SPA fallback disabled", {
            tags: ["startup", "frontend", "shell"]
        });
    }

    let resolveShellReady: (() => void) | null = null;
    const shellReady = new Promise<void>((resolve) => {
        resolveShellReady = resolve;
    });

    const serveShellHtml = async (req: Request, res: Response, next: NextFunction) => {
        if (!shellEnvironment) {
            return next();
        }
        try {
            await shellReady;
            const html = await shellEnvironment.getTransformedHtml(shellEntryName);
            res.status(200).setHeader("Content-Type", "text/html").send(html);
        } catch (error) {
            devFrontendLogger.error("Failed to render shell HTML", error, {
                tags: ["runtime", "frontend", "shell"],
                path: req.originalUrl
            });
            next(error);
        }
    };

    app.use(snbMountPath, snbDevServer.middlewares);
    devFrontendLogger.info("SNB remote middleware attached", {
        tags: ["startup", "frontend", "snb"],
        mountPath: snbMountPath
    });

    app.use(authMountPath, authDevServer.middlewares);
    devFrontendLogger.info("Auth remote middleware attached", {
        tags: ["startup", "frontend", "auth"],
        mountPath: authMountPath
    });

    app.use(shellDevServer.middlewares);
    devFrontendLogger.info("Shell host middleware attached", {
        tags: ["startup", "frontend", "shell"]
    });

    app.use((req, res, next) => {
        if (shouldServeShellHtml(req, shellMountPath, authMountPath, snbMountPath)) {
            void serveShellHtml(req, res, next);
            return;
        }
        next();
    });

    return {
        afterServerStart: async (server) => {
            devFrontendLogger.debug("Binding dev server to HTTP listener", {
                tags: ["startup"]
            });
            shellDevServer.connectWebSocket({ server });
            snbDevServer.connectWebSocket({ server });
            authDevServer.connectWebSocket({ server });
            await Promise.all([
                shellDevServer.afterListen(),
                snbDevServer.afterListen(),
                authDevServer.afterListen()
            ]);
            resolveShellReady?.();
            shellDevServer.printUrls();
            snbDevServer.printUrls();
            authDevServer.printUrls();
            devFrontendLogger.info("Dev frontends ready", {
                tags: ["startup", "frontend"],
                mounts: {
                    shell: "/",
                    snb: snbMountPath,
                    auth: authMountPath
                }
            });
        },
        close: async () => {
            devFrontendLogger.debug("Closing dev server", {
                tags: ["shutdown"]
            });
            await Promise.all([
                shellDevServer.close(),
                snbDevServer.close(),
                authDevServer.close()
            ]);
            devFrontendLogger.info("Dev server closed", {
                tags: ["shutdown"]
            });
        }
    } satisfies FrontendLifecycle;
};
