import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { createContext } from "./context.ts";
import { router } from "./router.ts";

export const apiMiddleware = createExpressMiddleware({ router, createContext });
