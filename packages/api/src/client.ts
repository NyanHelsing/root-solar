import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { CreateTRPCClientOptions } from "@trpc/client";
import { createTRPCJotai } from "jotai-trpc";

import type { ApiRouter } from "./router";

const clientOptions: CreateTRPCClientOptions<ApiRouter> = {
  links: [
    httpBatchLink({
      url: "http://localhost:3000/api",
      async headers() {
        return {
          authorization: "",
        };
      },
    }),
  ],
};

export const client = createTRPCProxyClient<ApiRouter>(clientOptions);
export const trpc = createTRPCJotai<ApiRouter>(clientOptions);
